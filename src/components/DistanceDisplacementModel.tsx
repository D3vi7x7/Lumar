import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import { Group, Vector3, MathUtils, CatmullRomCurve3 } from 'three';

// ─── Winding Road Path ─────────────────────────────────────────────────────
const roadPoints = [
  new Vector3(-4, 0, 0),
  new Vector3(-2.5, 0, 1.5),
  new Vector3(-1, 0, -1),
  new Vector3(0.5, 0, 2),
  new Vector3(2, 0, 0.5),
  new Vector3(3.5, 0, -1.2),
  new Vector3(4, 0, 0.3),
];
const roadCurve = new CatmullRomCurve3(roadPoints, false, 'catmullrom', 0.5);
const roadCurvePoints = roadCurve.getPoints(120);
const totalRoadLength = roadCurve.getLength();

// ─── Flag Pole ─────────────────────────────────────────────────────────────
const FlagPole = ({ position, label, color }: { position: [number, number, number]; label: string; color: string }) => (
  <group position={position}>
    {/* Pole */}
    <mesh position={[0, 0.6, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
      <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Flag */}
    <mesh position={[0.25, 1.05, 0]}>
      <planeGeometry args={[0.5, 0.3]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} side={2} />
    </mesh>
    <Text position={[0.25, 1.05, 0.01]} fontSize={0.12} color="#ffffff" anchorX="center" fontWeight="bold">
      {label}
    </Text>
  </group>
);

// ─── Car ───────────────────────────────────────────────────────────────────
const Car = React.forwardRef<Group>((_, ref) => (
  <group ref={ref}>
    {/* Body */}
    <mesh position={[0, 0.18, 0]}>
      <boxGeometry args={[0.5, 0.15, 0.25]} />
      <meshStandardMaterial color="#ff6b35" emissive="#ff4500" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
    </mesh>
    {/* Cabin */}
    <mesh position={[0.02, 0.32, 0]}>
      <boxGeometry args={[0.25, 0.13, 0.22]} />
      <meshStandardMaterial color="#ffaa55" emissive="#ff8800" emissiveIntensity={0.15} metalness={0.4} roughness={0.4} />
    </mesh>
    {/* Wheels */}
    {[[-0.15, 0.08, 0.14], [-0.15, 0.08, -0.14], [0.15, 0.08, 0.14], [0.15, 0.08, -0.14]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    ))}
  </group>
));

// ─── Main Component ────────────────────────────────────────────────────────
export const DistanceDisplacementModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const carRef = useRef<Group>(null);
  const progress = useRef(0); // 0 to 1 along road
  const trailProgress = useRef(0);
  const displacementOpacity = useRef(0);
  const distLabelOpacity = useRef(0);
  const dispLabelOpacity = useRef(0);

  // Derive trail points based on progress
  const trailRef = useRef<Vector3[]>([roadCurvePoints[0].clone()]);

  useFrame((_, delta) => {
    // Target progress based on slide
    let targetProgress = 0;
    if (currentSlide >= 1) targetProgress = 1;

    progress.current = MathUtils.damp(progress.current, targetProgress, 2, delta);
    trailProgress.current = MathUtils.damp(trailProgress.current, currentSlide >= 1 ? 1 : 0, 2, delta);

    // Displacement arrow visibility
    displacementOpacity.current = MathUtils.damp(displacementOpacity.current, currentSlide >= 2 ? 1 : 0, 4, delta);
    distLabelOpacity.current = MathUtils.damp(distLabelOpacity.current, currentSlide >= 1 ? 1 : 0, 4, delta);
    dispLabelOpacity.current = MathUtils.damp(dispLabelOpacity.current, currentSlide >= 2 ? 1 : 0, 4, delta);

    // Move car along curve
    if (carRef.current) {
      const t = Math.min(progress.current, 1);
      const pos = roadCurve.getPointAt(t);
      const tangent = roadCurve.getTangentAt(t);
      carRef.current.position.copy(pos);
      carRef.current.lookAt(pos.clone().add(tangent));
    }

    // Build trail
    const trailIdx = Math.floor(trailProgress.current * (roadCurvePoints.length - 1));
    trailRef.current = roadCurvePoints.slice(0, trailIdx + 1);
  });

  const startPos = roadPoints[0];
  const endPos = roadPoints[roadPoints.length - 1];
  const displacementLength = startPos.distanceTo(endPos);

  // Road surface points (flat ribbon along road)
  const roadSurfacePoints = useMemo(() => {
    return roadCurvePoints.map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, []);

  return (
    <group scale={0.7} position={[0, -0.5, 0]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.6} />
      </mesh>

      {/* Road surface — the winding path */}
      <Line
        points={roadSurfacePoints}
        color="#3a3a5c"
        lineWidth={8}
        opacity={0.7}
        transparent
      />

      {/* Distance Trail (dotted path the car traveled) */}
      {trailProgress.current > 0.01 && trailRef.current.length > 1 && (
        <Line
          points={trailRef.current.map(p => [p.x, p.y + 0.05, p.z] as [number, number, number])}
          color="#39ff14"
          lineWidth={3}
          dashed
          dashSize={0.15}
          gapSize={0.08}
        />
      )}

      {/* Displacement arrow (straight line start to end) */}
      {displacementOpacity.current > 0.01 && (
        <>
          <Line
            points={[
              [startPos.x, 0.3, startPos.z],
              [endPos.x, 0.3, endPos.z]
            ]}
            color="#00f0ff"
            lineWidth={4}
          />
          {/* Arrow head */}
          <mesh position={[endPos.x - 0.15, 0.3, endPos.z]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.25, 8]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {/* Flags */}
      <FlagPole position={[startPos.x, 0, startPos.z]} label="START" color="#39ff14" />
      <FlagPole position={[endPos.x, 0, endPos.z]} label="FINISH" color="#ff4444" />

      {/* Car */}
      <Car ref={carRef} />

      {/* Distance label */}
      {distLabelOpacity.current > 0.01 && (
        <group position={[0, 2.2, 0]}>
          {/* Background panel */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[3.2, 0.5]} />
            <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
          </mesh>
          <Text position={[-0.8, 0.05, 0]} fontSize={0.16} color="#39ff14" anchorX="center" fontWeight="bold">
            Distance: {(totalRoadLength * Math.min(trailProgress.current, 1)).toFixed(1)} m
          </Text>
          {dispLabelOpacity.current > 0.01 && (
            <Text position={[0.9, 0.05, 0]} fontSize={0.16} color="#00f0ff" anchorX="center" fontWeight="bold">
              Displacement: {(displacementLength * Math.min(displacementOpacity.current, 1)).toFixed(1)} m
            </Text>
          )}
        </group>
      )}

      {/* Summary label for slide 3 */}
      {currentSlide >= 3 && (
        <group position={[0, 2.8, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[4.5, 0.4]} />
            <meshStandardMaterial color="#1a0a2e" transparent opacity={0.85} />
          </mesh>
          <Text position={[0, 0, 0]} fontSize={0.13} color="#ffcc00" anchorX="center" fontWeight="bold">
            ⚡ Distance ≥ Displacement — Always! (Equal only in a straight line)
          </Text>
        </group>
      )}
    </group>
  );
};
