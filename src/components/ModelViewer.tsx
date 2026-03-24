import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';

const store = createXRStore();

const AtomModel = () => {
  const electron1 = useRef<THREE.Mesh>(null);
  const electron2 = useRef<THREE.Mesh>(null);
  const electron3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 3;
    if (electron1.current) electron1.current.position.set(Math.sin(t) * 2.5, Math.cos(t) * 2.5, 0);
    if (electron2.current) electron2.current.position.set(Math.sin(t+2) * 2.5, 0, Math.cos(t+2) * 2.5);
    if (electron3.current) electron3.current.position.set(0, Math.sin(t+4) * 2.5, Math.cos(t+4) * 2.5);
  });

  return (
    <group scale={0.7}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#8a2be2" emissive="#4a0e4e" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh ref={electron1}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh>
      <mesh ref={electron2}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh>
      <mesh ref={electron3}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh>
    </group>
  );
};

const SolarSystemModel = () => {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.005;
  });

  return (
    <group ref={group} scale={0.6}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffa500" emissiveIntensity={0.5} />
      </mesh>
      {/* Earth */}
      <mesh position={[4, 0, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#0047ff" roughness={0.5} />
      </mesh>
      {/* Mars */}
      <mesh position={[6, 0, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#ff4500" roughness={0.7} />
      </mesh>
      {/* Jupiter */}
      <mesh position={[8, 0, 2]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#deb887" roughness={0.9} />
      </mesh>
    </group>
  );
};

const WaterMoleculeModel = () => {
  return (
    <group scale={1.2}>
      {/* Oxygen */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} />
      </mesh>
      {/* Hydrogen 1 */}
      <mesh position={[0.7, -0.6, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Hydrogen 2 */}
      <mesh position={[-0.7, -0.6, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  );
};

const MagnetModel = () => {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) {
        group.current.rotation.x += 0.005;
        group.current.rotation.y += 0.005;
    }
  });
  return (
    <group ref={group} scale={0.8}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1, 2.5, 1]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[1, 2.5, 1]} />
        <meshStandardMaterial color="#0000ff" />
      </mesh>
      <Text position={[0, 2, 0.51]} fontSize={0.6} color="white">N</Text>
      <Text position={[0, -2, 0.51]} fontSize={0.6} color="white">S</Text>
    </group>
  );
};

export const ModelViewer: React.FC<{ modelType: string }> = ({ modelType }) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#0a0a0a' }}>
      <button 
        style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)', transition: 'transform 0.2s' }}
        onClick={() => store.enterAR()}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        View in AR
      </button>

      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <XR store={store}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <OrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} />
            
            {modelType === 'solar-system' && <SolarSystemModel />}
            {modelType === 'atom' && <AtomModel />}
            {modelType === 'h2o' && <WaterMoleculeModel />}
            {modelType === 'magnet' && <MagnetModel />}
        </XR>
      </Canvas>
    </div>
  );
};
