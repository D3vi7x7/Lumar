import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import { Group, MathUtils } from 'three';

const Ball = React.forwardRef<Group, { color: string; emissive: string }>(({ color, emissive }, ref) => (
  <group ref={ref}>
    <mesh>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
    </mesh>
    {/* Glow */}
    <mesh>
      <sphereGeometry args={[0.22, 16, 16]} />
      <meshBasicMaterial color={emissive} transparent opacity={0.15} />
    </mesh>
  </group>
));

export const UniformNonUniformModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const uniformRef = useRef<Group>(null);
  const nonUniformRef = useRef<Group>(null);
  const uniformX = useRef(-3.5);
  const nonUniformX = useRef(-3.5);
  const nonUniformSpeed = useRef(0.5);
  const markersOpacity = useRef(0);
  const trackStart = -3.5;
  const trackEnd = 3.5;

  // Time marker positions (computed once per cycle)
  const uniformMarkers = useRef<number[]>([]);
  const nonUniformMarkers = useRef<number[]>([]);
  const markerTimer = useRef(0);

  useFrame((_, delta) => {
    markersOpacity.current = MathUtils.damp(markersOpacity.current, currentSlide >= 2 ? 1 : 0, 4, delta);

    if (currentSlide === 0) {
      uniformX.current = MathUtils.damp(uniformX.current, trackStart, 3, delta);
      nonUniformX.current = MathUtils.damp(nonUniformX.current, trackStart, 3, delta);
      nonUniformSpeed.current = 0.5;
      uniformMarkers.current = [];
      nonUniformMarkers.current = [];
      markerTimer.current = 0;
    } else if (currentSlide >= 1) {
      const uniformSpeed = 2.0;
      uniformX.current += uniformSpeed * delta;
      nonUniformSpeed.current += delta * 0.6; // accelerates
      nonUniformX.current += nonUniformSpeed.current * delta;

      // Record markers every 0.8 seconds
      markerTimer.current += delta;
      if (markerTimer.current > 0.8 && currentSlide >= 2) {
        markerTimer.current = 0;
        if (uniformMarkers.current.length < 12) {
          uniformMarkers.current = [...uniformMarkers.current, uniformX.current];
          nonUniformMarkers.current = [...nonUniformMarkers.current, nonUniformX.current];
        }
      }

      // Loop
      if (uniformX.current > trackEnd) {
        uniformX.current = trackStart;
        nonUniformX.current = trackStart;
        nonUniformSpeed.current = 0.5;
        uniformMarkers.current = [];
        nonUniformMarkers.current = [];
      }
    }

    if (uniformRef.current) uniformRef.current.position.x = uniformX.current;
    if (nonUniformRef.current) nonUniformRef.current.position.x = nonUniformX.current;
  });

  return (
    <group scale={0.65} position={[0, -0.3, 0]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
      </mesh>

      {/* UNIFORM TRACK (top) */}
      <group position={[0, 0.8, 0]}>
        <Text position={[-4.2, 0.3, 0]} fontSize={0.14} color="#39ff14" anchorX="left" fontWeight="bold">UNIFORM</Text>
        <Line points={[[trackStart, 0, 0], [trackEnd, 0, 0]]} color="#39ff14" lineWidth={3} transparent opacity={0.4} />
        <Ball ref={uniformRef} color="#39ff14" emissive="#00ff00" />
        {/* Time position markers */}
        {uniformMarkers.current.map((mx, i) => (
          <group key={`um-${i}`} position={[mx, -0.3, 0]}>
            <mesh><boxGeometry args={[0.04, 0.25, 0.04]} /><meshStandardMaterial color="#39ff14" transparent opacity={0.6} /></mesh>
            <Text position={[0, -0.25, 0]} fontSize={0.08} color="#39ff14" anchorX="center">t{i + 1}</Text>
          </group>
        ))}
      </group>

      {/* NON-UNIFORM TRACK (bottom) */}
      <group position={[0, -0.8, 0]}>
        <Text position={[-4.2, 0.3, 0]} fontSize={0.14} color="#ff6b35" anchorX="left" fontWeight="bold">NON-UNIFORM</Text>
        <Line points={[[trackStart, 0, 0], [trackEnd, 0, 0]]} color="#ff6b35" lineWidth={3} transparent opacity={0.4} />
        <Ball ref={nonUniformRef} color="#ff6b35" emissive="#ff4500" />
        {/* Time position markers */}
        {nonUniformMarkers.current.map((mx, i) => (
          <group key={`nm-${i}`} position={[mx, -0.3, 0]}>
            <mesh><boxGeometry args={[0.04, 0.25, 0.04]} /><meshStandardMaterial color="#ff6b35" transparent opacity={0.6} /></mesh>
            <Text position={[0, -0.25, 0]} fontSize={0.08} color="#ff6b35" anchorX="center">t{i + 1}</Text>
          </group>
        ))}
      </group>

      {/* Spacing info labels */}
      {currentSlide >= 2 && (
        <>
          <group position={[4.5, 0.8, 0]}>
            <mesh position={[0, 0, -0.01]}><planeGeometry args={[1.6, 0.3]} /><meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} /></mesh>
            <Text position={[0, 0, 0]} fontSize={0.09} color="#39ff14" anchorX="center" fontWeight="bold">Equal Spacing!</Text>
          </group>
          <group position={[4.5, -0.8, 0]}>
            <mesh position={[0, 0, -0.01]}><planeGeometry args={[1.6, 0.3]} /><meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} /></mesh>
            <Text position={[0, 0, 0]} fontSize={0.09} color="#ff6b35" anchorX="center" fontWeight="bold">Unequal Spacing!</Text>
          </group>
        </>
      )}

      {/* Summary */}
      {currentSlide >= 3 && (
        <group position={[0, 2.5, 0]}>
          <mesh position={[0, 0, -0.01]}><planeGeometry args={[5.5, 0.6]} /><meshStandardMaterial color="#1a0a2e" transparent opacity={0.85} /></mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.11} color="#39ff14" anchorX="center" fontWeight="bold">
            Uniform = Equal distances in equal time intervals
          </Text>
          <Text position={[0, -0.12, 0]} fontSize={0.11} color="#ff6b35" anchorX="center" fontWeight="bold">
            Non-Uniform = Unequal distances in equal time intervals
          </Text>
        </group>
      )}
    </group>
  );
};
