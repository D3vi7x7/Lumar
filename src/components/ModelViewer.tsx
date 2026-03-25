import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, useAnimations } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { Mesh, Group } from 'three';

const store = createXRStore();

const AtomModel = () => {
  const electron1 = useRef<Mesh>(null);
  const electron2 = useRef<Mesh>(null);
  const electron3 = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 3;
    if (electron1.current) electron1.current.position.set(Math.sin(t) * 2.5, Math.cos(t) * 2.5, 0);
    if (electron2.current) electron2.current.position.set(Math.sin(t + 2) * 2.5, 0, Math.cos(t + 2) * 2.5);
    if (electron3.current) electron3.current.position.set(0, Math.sin(t + 4) * 2.5, Math.cos(t + 4) * 2.5);
  });

  return (
    <group scale={0.7} position={[0, 1.0, 0]}>
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

function SolarSystemGLTF() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/solar-system/scene.gltf');
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    // Play all animations embedded in the GLTF (planet orbits, rotations)
    Object.values(actions).forEach((action) => action?.play());
  }, [actions]);

  return (
    <>
      <Stars radius={150} depth={60} count={6000} factor={4} saturation={0} fade speed={0.5} />
      <group ref={group} scale={0.012} position={[0, 1.0, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
}

// Preload for faster initial display
useGLTF.preload('/solar-system/scene.gltf');

const SolarSystemModel = () => (
  <Suspense fallback={null}>
    <SolarSystemGLTF />
  </Suspense>
);

const WaterMoleculeModel = () => {
  return (
    <group scale={1.2} position={[0, 1.0, 0]}>
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

function MagnetGLTF() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/magnet/scene.gltf');
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    Object.values(actions).forEach((action) => action?.play());
  }, [actions]);

  // Gentle slow rotation so the solenoid field lines are visible from all angles
  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.003;
  });

  return (
    <group ref={group} scale={0.08} position={[0, 1.0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/magnet/scene.gltf');

const MagnetModel = () => (
  <Suspense fallback={null}>
    <MagnetGLTF />
  </Suspense>
);

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

      <Canvas
        camera={
          modelType === 'solar-system'
            ? { position: [0, 0.8, 2], fov: 60 }
            : { position: [0, 0, 5], fov: 50 }
        }
      >
        <XR store={store}>
          <ambientLight intensity={modelType === 'solar-system' ? 1.2 : 0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <OrbitControls
            autoRotate={modelType !== 'solar-system'}
            autoRotateSpeed={0.5}
            enablePan={false}
          />

          {modelType === 'solar-system' && <SolarSystemModel />}
          {modelType === 'atom' && <AtomModel />}
          {modelType === 'h2o' && <WaterMoleculeModel />}
          {modelType === 'magnet' && <MagnetModel />}
        </XR>
      </Canvas>
    </div>
  );
};
