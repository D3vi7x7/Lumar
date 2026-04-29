import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import { Group, MathUtils, Mesh } from 'three';

// ─── Flame Particle ────────────────────────────────────────────────────────
const FlameParticle = ({ offset, active }: { offset: number; active: boolean }) => {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current || !active) { if (ref.current) ref.current.visible = false; return; }
    ref.current.visible = true;
    const t = (state.clock.elapsedTime * 3 + offset) % 1;
    ref.current.position.y = -t * 1.5;
    ref.current.position.x = Math.sin(offset * 17) * 0.15;
    ref.current.position.z = Math.cos(offset * 23) * 0.15;
    const s = (1 - t) * 0.15;
    ref.current.scale.set(s, s, s);
    const mat = ref.current.material as any;
    mat.opacity = (1 - t) * 0.8;
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={Math.random() > 0.5 ? '#ff4400' : '#ffaa00'} transparent depthWrite={false} />
    </mesh>
  );
};

// ─── Rocket ────────────────────────────────────────────────────────────────
const Rocket = React.forwardRef<Group>((_, ref) => (
  <group ref={ref}>
    {/* Body */}
    <mesh position={[0, 0.6, 0]}>
      <cylinderGeometry args={[0.18, 0.22, 1.2, 16]} />
      <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Nose cone */}
    <mesh position={[0, 1.4, 0]}>
      <coneGeometry args={[0.18, 0.5, 16]} />
      <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.3} metalness={0.6} />
    </mesh>
    {/* Fins */}
    {[0, 1, 2, 3].map(i => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.22, 0.1, Math.sin(i * Math.PI / 2) * 0.22]} rotation={[0, i * Math.PI / 2, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.03]} />
        <meshStandardMaterial color="#ff6b35" emissive="#ff4500" emissiveIntensity={0.2} />
      </mesh>
    ))}
    {/* Window */}
    <mesh position={[0, 0.9, 0.19]}>
      <circleGeometry args={[0.06, 16]} />
      <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={0.5} />
    </mesh>
    {/* Nozzle */}
    <mesh position={[0, -0.05, 0]}>
      <cylinderGeometry args={[0.15, 0.1, 0.15, 12]} />
      <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
));

export const AccelerationModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const rocketRef = useRef<Group>(null);
  const rocketY = useRef(0);
  const velocity = useRef(0);
  const velArrowScale = useRef(0);

  const flameParticles = useMemo(() => Array.from({ length: 20 }, (_, i) => i * 0.05), []);

  useFrame((_, delta) => {
    if (currentSlide === 0) {
      rocketY.current = MathUtils.damp(rocketY.current, 0, 3, delta);
      velocity.current = MathUtils.damp(velocity.current, 0, 5, delta);
    } else if (currentSlide === 1) {
      // Positive acceleration: velocity increases
      velocity.current = MathUtils.damp(velocity.current, 6, 1.5, delta);
      rocketY.current += velocity.current * delta * 0.15;
      if (rocketY.current > 4) rocketY.current = 4; // cap for visual
    } else if (currentSlide === 2) {
      // Zero acceleration: constant velocity
      velocity.current = MathUtils.damp(velocity.current, 4, 3, delta);
      // Slight oscillation to show movement at constant speed
      rocketY.current = MathUtils.damp(rocketY.current, 3, 2, delta);
    } else if (currentSlide === 3) {
      // Negative acceleration: velocity decreases
      velocity.current = MathUtils.damp(velocity.current, 0.5, 1.2, delta);
      rocketY.current = MathUtils.damp(rocketY.current, 1.5, 1.5, delta);
    }

    velArrowScale.current = MathUtils.damp(velArrowScale.current, velocity.current / 6, 4, delta);

    if (rocketRef.current) {
      rocketRef.current.position.y = rocketY.current;
    }
  });

  const showFlames = currentSlide === 1;
  const showRetro = currentSlide === 3;

  return (
    <group scale={0.55} position={[0, -1.5, 0]}>
      {/* Launch pad */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#333355" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="#222244" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Rocket */}
      <Rocket ref={rocketRef} />

      {/* Engine Flames (positive acceleration) */}
      <group position={[0, rocketY.current - 0.2, 0]}>
        {flameParticles.map((o, i) => (
          <FlameParticle key={i} offset={o} active={showFlames} />
        ))}
        {showFlames && (
          <pointLight position={[0, -0.5, 0]} color="#ff6600" intensity={3} distance={4} />
        )}
      </group>

      {/* Retro-thruster flames (negative acceleration) */}
      {showRetro && (
        <group position={[0, rocketY.current + 1.7, 0]}>
          {flameParticles.slice(0, 10).map((o, i) => (
            <FlameParticle key={`r-${i}`} offset={o} active={true} />
          ))}
          <pointLight position={[0, 0.5, 0]} color="#4488ff" intensity={2} distance={3} />
        </group>
      )}

      {/* Velocity arrow */}
      {velocity.current > 0.1 && (
        <group position={[0.8, rocketY.current + 0.6, 0]}>
          <Line
            points={[[0, 0, 0], [0, velArrowScale.current * 2, 0]]}
            color="#00f0ff"
            lineWidth={4}
          />
          <mesh position={[0, velArrowScale.current * 2 + 0.1, 0]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
          </mesh>
          <Text position={[0.5, velArrowScale.current, 0]} fontSize={0.12} color="#00f0ff" anchorX="left" fontWeight="bold">
            v = {velocity.current.toFixed(1)} m/s
          </Text>
        </group>
      )}

      {/* Acceleration indicator */}
      <group position={[-2, 4.5, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[2.5, 0.8]} />
          <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
        </mesh>
        <Text position={[0, 0.15, 0]} fontSize={0.12} color="#ffffff" anchorX="center" fontWeight="bold">
          Acceleration
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.14} color={
          currentSlide === 0 ? '#888888' :
          currentSlide === 1 ? '#39ff14' :
          currentSlide === 2 ? '#ffcc00' : '#ff4444'
        } anchorX="center" fontWeight="bold">
          {currentSlide === 0 ? 'a = 0 (at rest)' :
           currentSlide === 1 ? 'a = +ve (speeding up!)' :
           currentSlide === 2 ? 'a = 0 (constant v)' : 'a = -ve (slowing down!)'}
        </Text>
      </group>

      {/* Speed readout */}
      <group position={[2, 4.5, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[2, 0.8]} />
          <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
        </mesh>
        <Text position={[0, 0.15, 0]} fontSize={0.12} color="#ffffff" anchorX="center" fontWeight="bold">
          Velocity
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.16} color="#00f0ff" anchorX="center" fontWeight="bold">
          {velocity.current.toFixed(1)} m/s
        </Text>
      </group>
    </group>
  );
};
