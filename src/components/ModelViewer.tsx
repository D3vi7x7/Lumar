import React, { useRef, Suspense, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, useAnimations, Ring } from '@react-three/drei';
import { XR, createXRStore, useXRHitTest, IfInSessionMode } from '@react-three/xr';
import { Group, Matrix4, Vector3, Quaternion, Euler } from 'three';

const store = createXRStore();

// ─── Shared matrix helpers (allocated once outside components) ───────────────
const _matrix = new Matrix4();
const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();

// ─── Reticle: ring that follows hit-test surface ─────────────────────────────
function ARReticle({ onPositionUpdate }: { onPositionUpdate: (pos: Vector3, quat: Quaternion) => void }) {
  const ringRef = useRef<Group>(null);

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) {
        if (ringRef.current) ringRef.current.visible = false;
        return;
      }
      getWorldMatrix(_matrix, results[0]);
      _matrix.decompose(_position, _quaternion, _scale);
      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.position.copy(_position);
        ringRef.current.quaternion.copy(_quaternion);
      }
      onPositionUpdate(_position.clone(), _quaternion.clone());
    },
    'viewer',
    ['plane', 'mesh', 'point']
  );

  return (
    <group ref={ringRef} visible={false}>
      <Ring args={[0.08, 0.1, 32]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} />
      </Ring>
      {/* Cross-hair dots */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.055, 0, Math.sin(angle) * 0.055]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── AR placement wrapper ─────────────────────────────────────────────────────
function ARPlacedModel({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<Group>(null);
  const [placed, setPlaced] = useState(false);
  const placedPos = useRef(new Vector3(0, 0, -1));
  const placedQuat = useRef(new Quaternion());
  const reticlePos = useRef(new Vector3());
  const reticleQuat = useRef(new Quaternion());
  const { gl } = useThree();

  const handlePositionUpdate = useCallback((pos: Vector3, quat: Quaternion) => {
    reticlePos.current.copy(pos);
    reticleQuat.current.copy(quat);
  }, []);

  // Place on tap
  const handleSelect = useCallback(() => {
    placedPos.current.copy(reticlePos.current);
    placedQuat.current.copy(reticleQuat.current);
    setPlaced(true);
  }, []);

  React.useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handleSelect);
    return () => canvas.removeEventListener('pointerdown', handleSelect);
  }, [gl, handleSelect]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (placed) {
      groupRef.current.position.copy(placedPos.current);
      // Keep upright — only copy Y rotation from hit surface
      const euler = new Euler().setFromQuaternion(placedQuat.current, 'YXZ');
      groupRef.current.rotation.set(0, euler.y, 0);
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <>
      <ARReticle onPositionUpdate={handlePositionUpdate} />
      <group ref={groupRef} visible={false}>
        {children}
      </group>
    </>
  );
}

// ─── Atom model ──────────────────────────────────────────────────────────────
const AtomModel = () => {
  const electron1 = useRef<Group>(null);
  const electron2 = useRef<Group>(null);
  const electron3 = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 3;
    if (electron1.current) electron1.current.position.set(Math.sin(t) * 2.5, Math.cos(t) * 2.5, 0);
    if (electron2.current) electron2.current.position.set(Math.sin(t + 2) * 2.5, 0, Math.cos(t + 2) * 2.5);
    if (electron3.current) electron3.current.position.set(0, Math.sin(t + 4) * 2.5, Math.cos(t + 4) * 2.5);
  });

  return (
    <group scale={0.7}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#8a2be2" emissive="#4a0e4e" roughness={0.2} metalness={0.8} />
      </mesh>
      <group ref={electron1}><mesh><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh></group>
      <group ref={electron2}><mesh><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh></group>
      <group ref={electron3}><mesh><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f0ff" emissive="#00ffff" /></mesh></group>
    </group>
  );
};

// ─── Solar System GLTF ───────────────────────────────────────────────────────
function SolarSystemGLTF() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/solar-system/scene.gltf');
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    Object.values(actions).forEach((action) => action?.play());
  }, [actions]);

  return (
    <>
      <Stars radius={150} depth={60} count={6000} factor={4} saturation={0} fade speed={0.5} />
      <group ref={group} scale={0.012}>
        <primitive object={scene} />
      </group>
    </>
  );
}
useGLTF.preload('/solar-system/scene.gltf');

const SolarSystemModel = () => (
  <Suspense fallback={null}>
    <SolarSystemGLTF />
  </Suspense>
);

// ─── Water molecule model ────────────────────────────────────────────────────
const WaterMoleculeModel = () => (
  <group scale={1.2}>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial color="#ff0000" roughness={0.2} />
    </mesh>
    <mesh position={[0.7, -0.6, 0]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
    <mesh position={[-0.7, -0.6, 0]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
  </group>
);

// ─── Magnet GLTF ─────────────────────────────────────────────────────────────
function MagnetGLTF() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/magnet/scene.gltf');
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    Object.values(actions).forEach((action) => action?.play());
  }, [actions]);

  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.003;
  });

  return (
    <group ref={group} scale={15}>
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

// ─── Helper: y-offset for non-AR display ─────────────────────────────────────
function yOffset(modelType: string) {
  return modelType === 'solar-system' ? 0 : 1.0;
}

// ─── Model selector (renders correct model for modelType) ────────────────────
function SceneModel({ modelType }: { modelType: string }) {
  if (modelType === 'solar-system') return <SolarSystemModel />;
  if (modelType === 'atom') return <AtomModel />;
  if (modelType === 'h2o') return <WaterMoleculeModel />;
  if (modelType === 'magnet') return <MagnetModel />;
  return null;
}

// ─── ModelViewer ─────────────────────────────────────────────────────────────
export const ModelViewer: React.FC<{ modelType: string }> = ({ modelType }) => {
  const isSolar = modelType === 'solar-system';
  const isMagnet = modelType === 'magnet';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#0a0a0a' }}>
      <button
        style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)', transition: 'transform 0.2s' }}
        onClick={() => store.enterAR()}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        View in AR
      </button>

      {/* AR hint */}
      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', opacity: 0.7, fontSize: '0.78rem', color: '#aaa', whiteSpace: 'nowrap' }}>
        In AR: aim at a surface · tap to place
      </div>

      <Canvas
        camera={
          isSolar
            ? { position: [0, 0.8, 2], fov: 60, near: 0.01 }
            : isMagnet
            ? { position: [0, 1, 3], fov: 60, near: 0.01 }
            : { position: [0, 0, 5], fov: 50, near: 0.01 }
        }
      >
        <XR store={store}>
          <ambientLight intensity={isSolar ? 1.2 : 0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />

          {/* ── Outside AR: fixed position, orbit controls ── */}
          <IfInSessionMode deny="immersive-ar">
            <OrbitControls
              autoRotate={!isSolar && !isMagnet}
              autoRotateSpeed={0.5}
              enablePan={false}
              minDistance={0.5}
              maxDistance={20}
            />
            <group position={[0, yOffset(modelType), 0]}>
              <SceneModel modelType={modelType} />
            </group>
          </IfInSessionMode>

          {/* ── Inside AR: hit-test placement ── */}
          <IfInSessionMode allow="immersive-ar">
            <ARPlacedModel>
              <SceneModel modelType={modelType} />
            </ARPlacedModel>
          </IfInSessionMode>
        </XR>
      </Canvas>
    </div>
  );
};
