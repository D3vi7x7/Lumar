import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import { Group, MathUtils } from 'three';

// ─── Graph dimensions ──────────────────────────────────────────────────────
const gW = 2.2;
const gH = 1.8;
const NUM_POINTS = 80;

// ─── Pre-compute all graph curves statically ───────────────────────────────
function buildStaticCurves() {
  // 1. Uniform distance-time: d = v*t → straight diagonal (v=1)
  const uniformDT: [number, number, number][] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    uniformDT.push([t * gW, t * gH, 0]);
  }

  // 2. Accelerating distance-time: d = ½at² → parabola
  const accelDT: [number, number, number][] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    accelDT.push([t * gW, (t * t) * gH, 0]); // y = t²
  }

  // 3. Speed-time constant: horizontal line at 50% height
  const constST: [number, number, number][] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    constST.push([t * gW, 0.5 * gH, 0]);
  }

  // 4. Speed-time accelerating: diagonal line 0→90% height
  const accelST: [number, number, number][] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    accelST.push([t * gW, t * 0.9 * gH, 0]);
  }

  // 5. Ball x-positions synced to each curve (trackStart to trackEnd)
  const trackStart = -3;
  const trackEnd = 3.5;
  const range = trackEnd - trackStart;
  const uniformBallX: number[] = [];
  const accelBallX: number[] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    uniformBallX.push(trackStart + t * range);
    accelBallX.push(trackStart + (t * t) * range);
  }

  return { uniformDT, accelDT, constST, accelST, uniformBallX, accelBallX };
}

// ─── Graph Axes ────────────────────────────────────────────────────────────
const GraphAxes = ({ position, xLabel, yLabel }: {
  position: [number, number, number]; xLabel: string; yLabel: string;
}) => (
  <group position={position}>
    {/* Background */}
    <mesh position={[gW / 2, gH / 2, -0.02]}>
      <planeGeometry args={[gW + 0.3, gH + 0.3]} />
      <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
    </mesh>
    {/* X axis */}
    <Line points={[[0, 0, 0], [gW, 0, 0]]} color="#666666" lineWidth={2} />
    {/* Y axis */}
    <Line points={[[0, 0, 0], [0, gH, 0]]} color="#666666" lineWidth={2} />
    {/* X arrow */}
    <mesh position={[gW + 0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.04, 0.1, 6]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
    {/* Y arrow */}
    <mesh position={[0, gH + 0.05, 0]}>
      <coneGeometry args={[0.04, 0.1, 6]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
    {/* Labels */}
    <Text position={[gW / 2, -0.2, 0]} fontSize={0.1} color="#aaaaaa" anchorX="center">{xLabel}</Text>
    <Text position={[-0.25, gH / 2, 0]} fontSize={0.1} color="#aaaaaa" anchorX="center" rotation={[0, 0, Math.PI / 2]}>{yLabel}</Text>
    {/* Grid lines */}
    {Array.from({ length: 5 }, (_, i) => (
      <React.Fragment key={i}>
        <Line points={[[(i + 1) * gW / 5, 0, 0], [(i + 1) * gW / 5, gH, 0]]} color="#222233" lineWidth={1} />
        <Line points={[[0, (i + 1) * gH / 5, 0], [gW, (i + 1) * gH / 5, 0]]} color="#222233" lineWidth={1} />
      </React.Fragment>
    ))}
  </group>
);

// ─── Main Component ────────────────────────────────────────────────────────
export const MotionGraphModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const ballRef = useRef<Group>(null);
  const revealProgress = useRef(0); // 0→1 animates the line drawing
  const prevSlide = useRef(currentSlide);
  const trackStart = -3;

  // Pre-compute all curves once
  const curves = useMemo(() => buildStaticCurves(), []);

  // Reset reveal progress when slide changes
  useFrame((_, delta) => {
    if (prevSlide.current !== currentSlide) {
      revealProgress.current = 0;
      prevSlide.current = currentSlide;
    }

    // Smoothly animate reveal from 0 to 1
    revealProgress.current = MathUtils.damp(revealProgress.current, 1, 1.2, delta);

    // Move ball in sync with reveal progress
    const t = Math.min(revealProgress.current, 1);
    const idx = Math.floor(t * NUM_POINTS);

    if (ballRef.current) {
      if (currentSlide === 0) {
        ballRef.current.position.x = MathUtils.damp(ballRef.current.position.x, trackStart, 3, delta);
      } else if (currentSlide === 1) {
        ballRef.current.position.x = curves.uniformBallX[idx];
      } else if (currentSlide === 2) {
        ballRef.current.position.x = curves.accelBallX[idx];
      } else {
        // Slide 3: park the ball at center
        ballRef.current.position.x = MathUtils.damp(ballRef.current.position.x, 0, 2, delta);
      }
    }
  });

  // Slice the static curves up to the current reveal point
  const revealIdx = Math.max(2, Math.floor(Math.min(revealProgress.current, 1) * NUM_POINTS) + 1);

  return (
    <group scale={0.55} position={[0, -0.5, 0]}>
      {/* Track */}
      <group position={[0, -0.5, 0]}>
        <Line points={[[trackStart - 0.5, 0, 0], [4, 0, 0]]} color="#4a4a6a" lineWidth={4} />
        {/* Track markers */}
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} position={[trackStart + i, 0, 0]}>
            <mesh><boxGeometry args={[0.04, 0.15, 0.04]} /><meshStandardMaterial color="#666666" /></mesh>
          </group>
        ))}
        {/* Ball */}
        <group ref={ballRef} position={[trackStart, 0, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial color="#ff6b35" emissive="#ff4500" emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color="#ff4500" transparent opacity={0.15} />
          </mesh>
        </group>
      </group>

      {/* ── Distance-Time Graph (slides 1 & 2) ── */}
      {(currentSlide === 1 || currentSlide === 2) && (
        <group position={[1.5, 1, 0]}>
          <GraphAxes position={[0, 0, 0]} xLabel="Time (s)" yLabel="Distance (m)" />
          <Text position={[gW / 2, gH + 0.2, 0]} fontSize={0.12} color="#ffffff" anchorX="center" fontWeight="bold">
            Distance-Time Graph
          </Text>

          {/* Uniform motion: straight diagonal (slide 1) */}
          {currentSlide === 1 && (
            <Line
              points={curves.uniformDT.slice(0, revealIdx)}
              color="#39ff14"
              lineWidth={3}
            />
          )}

          {/* Accelerated motion: parabola (slide 2) */}
          {currentSlide === 2 && (
            <Line
              points={curves.accelDT.slice(0, revealIdx)}
              color="#ff6b35"
              lineWidth={3}
            />
          )}

          {/* Shape label */}
          <group position={[gW + 0.5, gH / 2, 0]}>
            <mesh position={[0, 0, -0.01]}><planeGeometry args={[1.6, 0.5]} /><meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} /></mesh>
            <Text position={[0, 0.08, 0]} fontSize={0.09} color={currentSlide === 1 ? '#39ff14' : '#ff6b35'} anchorX="center" fontWeight="bold">
              {currentSlide === 1 ? 'Straight Line' : 'Curved Line'}
            </Text>
            <Text position={[0, -0.08, 0]} fontSize={0.07} color="#aaaaaa" anchorX="center">
              {currentSlide === 1 ? '= Constant Speed' : '= Changing Speed'}
            </Text>
          </group>
        </group>
      )}

      {/* ── Speed-Time Graph (slide 3) ── */}
      {currentSlide === 3 && (
        <group position={[1.5, 1, 0]}>
          <GraphAxes position={[0, 0, 0]} xLabel="Time (s)" yLabel="Speed (m/s)" />
          <Text position={[gW / 2, gH + 0.2, 0]} fontSize={0.12} color="#ffffff" anchorX="center" fontWeight="bold">
            Speed-Time Graph
          </Text>

          {/* Constant speed = horizontal line */}
          <Line
            points={curves.constST.slice(0, revealIdx)}
            color="#39ff14"
            lineWidth={3}
          />

          {/* Accelerating = diagonal line */}
          <Line
            points={curves.accelST.slice(0, revealIdx)}
            color="#ff6b35"
            lineWidth={3}
          />

          {/* Legend */}
          <group position={[gW + 0.5, gH * 0.7, 0]}>
            <mesh position={[0, 0, -0.01]}><planeGeometry args={[1.8, 0.7]} /><meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} /></mesh>
            <Text position={[0, 0.15, 0]} fontSize={0.08} color="#39ff14" anchorX="center" fontWeight="bold">── Constant Speed</Text>
            <Text position={[0, 0, 0]} fontSize={0.08} color="#ff6b35" anchorX="center" fontWeight="bold">── Accelerating</Text>
            <Text position={[0, -0.18, 0]} fontSize={0.07} color="#ffcc00" anchorX="center">Area under = Distance</Text>
          </group>
        </group>
      )}

      {/* Title for current slide */}
      <group position={[-2.5, 3, 0]}>
        <mesh position={[0, 0, -0.01]}><planeGeometry args={[2.5, 0.4]} /><meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} /></mesh>
        <Text position={[0, 0, 0]} fontSize={0.12} color="#ffcc00" anchorX="center" fontWeight="bold">
          {currentSlide === 0 ? 'Setup: Ball + Graph' :
           currentSlide === 1 ? 'Uniform Motion' :
           currentSlide === 2 ? 'Non-Uniform Motion' : 'Speed-Time Graphs'}
        </Text>
      </group>
    </group>
  );
};
