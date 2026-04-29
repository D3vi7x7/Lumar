import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import { Group, MathUtils } from 'three';

const TrackMarker = ({ x, label }: { x: number; label: string }) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 0.01, 0]}>
      <boxGeometry args={[0.05, 0.02, 0.6]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
    </mesh>
    <Text position={[0, -0.2, 0.4]} fontSize={0.12} color="#888888" anchorX="center">{label}</Text>
  </group>
);

const Runner = React.forwardRef<Group>((_, ref) => (
  <group ref={ref}>
    <mesh position={[0, 0.45, 0]}>
      <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
      <meshStandardMaterial color="#ff6b35" emissive="#ff4500" emissiveIntensity={0.2} metalness={0.5} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.75, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="#ffcc88" emissive="#ffaa55" emissiveIntensity={0.1} />
    </mesh>
    <mesh position={[-0.04, 0.12, 0]}>
      <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
      <meshStandardMaterial color="#2244aa" />
    </mesh>
    <mesh position={[0.04, 0.12, 0]}>
      <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
      <meshStandardMaterial color="#2244aa" />
    </mesh>
  </group>
));

const Speedometer = ({ speed, visible }: { speed: number; visible: boolean }) => {
  if (!visible) return null;
  const fraction = Math.min(speed / 8, 1);
  const needleAngle = -Math.PI * 0.75 + fraction * Math.PI * 1.5;
  return (
    <group position={[0, 2.5, 0]}>
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.5, 0.55, 32]} />
        <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.4} transparent opacity={0.8} />
      </mesh>
      <group rotation={[0, 0, needleAngle]}>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.4, 0.025, 0.01]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Text position={[0, -0.25, 0.01]} fontSize={0.12} color="#39ff14" anchorX="center" fontWeight="bold">
        {speed.toFixed(1)} m/s
      </Text>
      <Text position={[0, 0.35, 0.01]} fontSize={0.09} color="#ffffff" anchorX="center" fontWeight="bold">SPEED</Text>
    </group>
  );
};

export const SpeedVelocityModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const runnerRef = useRef<Group>(null);
  const runnerX = useRef(-3);
  const runnerDir = useRef(1);
  const speed = useRef(0);
  const velOpacity = useRef(0);
  const reversed = useRef(false);
  const trackStart = -3.5;
  const trackEnd = 3.5;

  useFrame((state, delta) => {
    if (currentSlide === 0) {
      runnerX.current = MathUtils.damp(runnerX.current, trackStart + 0.5, 3, delta);
      speed.current = MathUtils.damp(speed.current, 0, 5, delta);
      runnerDir.current = 1;
      reversed.current = false;
    } else if (currentSlide === 1 || currentSlide === 2) {
      speed.current = MathUtils.damp(speed.current, 5, 3, delta);
      runnerX.current += speed.current * delta * 0.3;
      if (runnerX.current > trackEnd - 0.5) runnerX.current = trackStart + 0.5;
      runnerDir.current = 1;
      reversed.current = false;
    } else if (currentSlide === 3) {
      const cycle = state.clock.elapsedTime % 6;
      speed.current = MathUtils.damp(speed.current, 5, 3, delta);
      if (cycle < 3) {
        runnerX.current += speed.current * delta * 0.3;
        runnerDir.current = 1;
        reversed.current = false;
      } else {
        runnerX.current -= speed.current * delta * 0.3;
        runnerDir.current = -1;
        reversed.current = true;
      }
      runnerX.current = Math.max(trackStart + 0.5, Math.min(trackEnd - 0.5, runnerX.current));
    }

    velOpacity.current = MathUtils.damp(velOpacity.current, currentSlide >= 2 ? 1 : 0, 4, delta);

    if (runnerRef.current) {
      runnerRef.current.position.x = runnerX.current;
      runnerRef.current.rotation.y = runnerDir.current > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  });

  return (
    <group scale={0.65} position={[0, -0.8, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
      </mesh>
      <Line points={[[trackStart, 0.01, 0], [trackEnd, 0.01, 0]]} color="#4a4a6a" lineWidth={6} />
      {Array.from({ length: 8 }, (_, i) => (
        <TrackMarker key={i} x={trackStart + i} label={`${i}m`} />
      ))}
      <Runner ref={runnerRef} />
      <Speedometer speed={speed.current} visible={currentSlide >= 1} />
      {velOpacity.current > 0.01 && (
        <group position={[runnerX.current, 1.1, 0]}>
          <Line points={[[0, 0, 0], [runnerDir.current * 1.2, 0, 0]]} color="#00f0ff" lineWidth={5} />
          <mesh position={[runnerDir.current * 1.3, 0, 0]} rotation={[0, 0, runnerDir.current > 0 ? -Math.PI / 2 : Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.6} />
          </mesh>
          <Text position={[runnerDir.current * 0.6, 0.2, 0]} fontSize={0.1} color="#00f0ff" anchorX="center" fontWeight="bold">
            v = {(speed.current * runnerDir.current).toFixed(1)} m/s
          </Text>
        </group>
      )}
      {currentSlide >= 1 && (
        <group position={[-2.5, 2.5, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.2, 0.35]} />
            <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
          </mesh>
          <Text position={[0, 0, 0]} fontSize={0.11} color="#39ff14" anchorX="center" fontWeight="bold">
            Speed = Distance / Time (scalar)
          </Text>
        </group>
      )}
      {velOpacity.current > 0.5 && (
        <group position={[2.5, 2.5, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.8, 0.35]} />
            <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
          </mesh>
          <Text position={[0, 0, 0]} fontSize={0.11} color="#00f0ff" anchorX="center" fontWeight="bold">
            Velocity = Displacement / Time (vector)
          </Text>
        </group>
      )}
      {currentSlide >= 3 && reversed.current && (
        <group position={[0, 3.2, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[4.2, 0.4]} />
            <meshStandardMaterial color="#2a0a0a" transparent opacity={0.85} />
          </mesh>
          <Text position={[0, 0, 0]} fontSize={0.12} color="#ff6b35" anchorX="center" fontWeight="bold">
            Direction reversed! Speed same, velocity FLIPPED!
          </Text>
        </group>
      )}
    </group>
  );
};
