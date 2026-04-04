import React, { useRef, Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, useAnimations, Ring, Billboard, Line, Text } from '@react-three/drei';
import { XR, createXRStore, useXRHitTest, IfInSessionMode, useXR } from '@react-three/xr';
import { Group, Matrix4, Vector3, Quaternion, Euler, Box3 } from 'three';
import { magneticObjects, magnetInteractionObjects } from '../data/mockData';
import { SolenoidModel } from './SolenoidModel';
import { InteractionModel } from './InteractionModel';

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

  // Interaction Refs for Pinch/Zoom & Rotate
  const interactionScale = useRef(1);
  const interactionRotY = useRef(0);

  const handlePositionUpdate = useCallback((pos: Vector3, quat: Quaternion) => {
    reticlePos.current.copy(pos);
    reticleQuat.current.copy(quat);
  }, []);

  // Use the native XR session 'select' event — DOM events don't fire in WebXR
  const session = useXR((s) => s.session);
  React.useEffect(() => {
    if (!session || placed) return; // Stop listening to taps once placed
    
    const onSelect = () => {
      placedPos.current.copy(reticlePos.current);
      placedQuat.current.copy(reticleQuat.current);
      setPlaced(true);
    };
    
    session.addEventListener('select', onSelect);
    return () => session.removeEventListener('select', onSelect);
  }, [session, placed]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (placed) {
      groupRef.current.position.copy(placedPos.current);
      // Keep upright — only copy Y rotation from hit surface but add our drag-rotated Y angle
      const euler = new Euler().setFromQuaternion(placedQuat.current, 'YXZ');
      groupRef.current.rotation.set(0, euler.y + interactionRotY.current, 0);
      
      // Apply pinch-to-zoom scaling
      groupRef.current.scale.set(interactionScale.current, interactionScale.current, interactionScale.current);
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  // Global Touch Listeners for Pinch (Zoom) and Pan (Rotate)
  React.useEffect(() => {
    if (!placed) return;

    let initialDist = 0;
    let initialScale = 1;
    let isDragging = false;
    let lastX = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDist = Math.sqrt(dx * dx + dy * dy);
        initialScale = interactionScale.current;
        isDragging = false;
      } else if (e.touches.length === 1) {
        // Only start drag if we aren't tapping a button (avoid consuming button taps)
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
            isDragging = true;
            lastX = e.touches[0].clientX;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (initialDist > 0) {
            const scaleFactor = dist / initialDist;
            // Clamp scaling between 0.1x to 5x of the original
            interactionScale.current = Math.max(0.1, Math.min(initialScale * scaleFactor, 5));
        }
      } else if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastX;
        // Adjust drag speed here (0.01 is a good default for screen-space to radians)
        interactionRotY.current += dx * 0.01;
        lastX = e.touches[0].clientX;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) initialDist = 0;
      if (e.touches.length === 0) isDragging = false;
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
      }
    };

    // Attach passive: false so we can track seamlessly even if browsers try to intervene
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [placed]);


  return (
    <>
      {/* Hide the blue placement ring once the object is placed */}
      {!placed && <ARReticle onPositionUpdate={handlePositionUpdate} />}
      
      <group ref={groupRef} visible={false}>
        {children}
      </group>
    </>
  );
}

// ─── AR annotation wrapper (Renders Billboard above the placed model) ─────────
function ARAnnotatedModel({ modelType, currentSlide, setCurrentSlide, handleReplayAudio, children }: { modelType: string, currentSlide: number, setCurrentSlide: any, handleReplayAudio?: () => void, children: React.ReactNode }) {
  const objectData = useMemo(() => {
    const obj = [...magneticObjects, ...magnetInteractionObjects].find(o => o.modelType === modelType);
    return obj;
  }, [modelType]);
  const CARD_HEIGHT = 0.40;

  if (!objectData || !objectData.annotations) {
    return <ARPlacedModel>{children}</ARPlacedModel>;
  }

  const slideText = objectData.annotations[currentSlide] || '';
  const totalSlides = objectData.annotations.length;
  
  const canPrev = currentSlide > 0;
  const canNext = currentSlide < totalSlides - 1;

  const handlePrev = (e: any) => {
    e.stopPropagation();
    if (canPrev) setCurrentSlide((s: number) => s - 1);
  };

  const handleNext = (e: any) => {
    e.stopPropagation();
    if (canNext) setCurrentSlide((s: number) => s + 1);
  };

  return (
    <ARPlacedModel>
      {/* 1. The original physical model (scaled down for AR table viewing) */}
      <group scale={0.15}>
        {children}
      </group>

      {/* 2. Floating Info Card Annotation */}
      {/* Local offset upwards from the tap-to-place origin */}
      <group position={[0, CARD_HEIGHT, 0]}>
        {/* Laser pointer down to model */}
        <Line points={[[0, -CARD_HEIGHT + 0.05, 0], [0, -0.05, 0]]} color={objectData.isMagnetic ? "#00c878" : "#8892b0"} lineWidth={3} />
        
        <Billboard follow={true}>
           {/* Glass Background */}
           <mesh position={[0, 0, -0.01]}>
             <planeGeometry args={[0.65, 0.40]} />
             <meshStandardMaterial color="#0a0a1a" transparent opacity={0.88} />
           </mesh>
           {/* Colored Border */}
           <Line
             points={[[-0.325, 0.20, 0], [0.325, 0.20, 0], [0.325, -0.20, 0], [-0.325, -0.20, 0], [-0.325, 0.20, 0]]}
             color={objectData.isMagnetic ? "#00c878" : "#8892b0"}
             lineWidth={3}
           />
           <Text position={[0, 0.14, 0]} fontSize={0.045} color={objectData.isMagnetic ? "#00c878" : "#ff4d4d"} anchorX="center" fontWeight="bold">
             {objectData.isMagnetic ? "MAGNETIC" : "NON-MAGNETIC"}
           </Text>
           <Text position={[0, 0.08, 0]} fontSize={0.055} color="#ffffff" anchorX="center" fontWeight="bold">
             {objectData.label}
           </Text>
           <Text position={[0, -0.02, 0]} fontSize={0.028} color="#cccccc" anchorX="center" textAlign="center" maxWidth={0.58} lineHeight={1.2}>
             {slideText}
           </Text>
           <Text position={[0, -0.11, 0]} fontSize={0.022} color="#888888" anchorX="center">
             {`Slide ${currentSlide + 1} of ${totalSlides}`}
           </Text>

           {/* 3D AR Button: Previous */}
           <group position={[-0.16, -0.15, 0.01]}>
             <mesh onPointerDown={handlePrev}>
               <planeGeometry args={[0.13, 0.05]} />
               <meshStandardMaterial color={canPrev ? "#ffffff" : "#4a5568"} transparent opacity={canPrev ? 0.25 : 0.1} />
             </mesh>
             <Text position={[0, 0, 0.005]} fontSize={0.024} color={canPrev ? "#ffffff" : "#888888"} anchorX="center" anchorY="middle" fontWeight="bold" pointerEvents="none">
               ← Prev
             </Text>
           </group>

           {/* 3D AR Button: Replay Audio */}
           <group position={[0, -0.15, 0.01]}>
             <mesh onPointerDown={(e) => { e.stopPropagation(); handleReplayAudio && handleReplayAudio(); }}>
               <planeGeometry args={[0.13, 0.05]} />
               <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
             </mesh>
             <Text position={[0, 0, 0.005]} fontSize={0.024} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold" pointerEvents="none">
               ↻ Replay
             </Text>
           </group>

           {/* 3D AR Button: Next */}
           <group position={[0.16, -0.15, 0.01]}>
             <mesh onPointerDown={handleNext}>
               <planeGeometry args={[0.13, 0.05]} />
               <meshStandardMaterial color={canNext ? "#ffffff" : "#4a5568"} transparent opacity={canNext ? 0.25 : 0.1} />
             </mesh>
             <Text position={[0, 0, 0.005]} fontSize={0.024} color={canNext ? "#ffffff" : "#888888"} anchorX="center" anchorY="middle" fontWeight="bold" pointerEvents="none">
               Next →
             </Text>
           </group>
        </Billboard>
      </group>
    </ARPlacedModel>
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
      <group ref={group} scale={0.020}>
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
    <group ref={group} scale={5} position={[0, 0, 0]}>
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

// ─── Auto-fit GLTF factory ────────────────────────────────────────────────────
// Normalises every model to `targetSize` units and centres it at the origin.
// No manual scale tuning needed — bounding box computed at load time.
function makeGLTF(path: string, rotationSpeed = 0.003, targetSize = 2): React.FC {
  function GLTFModel() {
    const { scene, animations } = useGLTF(path);
    const pivotRef = useRef<Group>(null);       // outer: rotation only at [0,0,0]
    const { actions } = useAnimations(animations, pivotRef);

    // Compute normalised scale + centre offset once per scene load.
    // updateWorldMatrix ensures all nested transforms are baked before Box3 measures.
    const { scale, offset } = useMemo(() => {
      scene.updateWorldMatrix(true, true);
      const box = new Box3();
      box.makeEmpty();
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          box.expandByObject(child);
        }
      });
      // Fallback if no meshes found
      if (box.isEmpty()) {
        box.setFromObject(scene);
      }

      const size   = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const sc = maxDim > 0 ? targetSize / maxDim : 1;
      // offset keeps the geometric centre locked to world origin:
      //   inner_position + sc * scene_center = 0  →  inner_position = -sc * center
      return { scale: sc, offset: new Vector3(-sc * center.x, -sc * center.y, -sc * center.z) };
    }, [scene]);

    React.useEffect(() => {
      Object.values(actions).forEach((a) => a?.play());
    }, [actions]);

    // Rotate the PIVOT (outer group) — inner geometry stays centred at its origin
    useFrame(() => {
      if (pivotRef.current) pivotRef.current.rotation.y += rotationSpeed;
    });

    return (
      // Outer: pure rotation pivot at world origin
      <group ref={pivotRef}>
        {/* Inner: scale + centering offset — no rotation here */}
        <group scale={scale} position={[offset.x, offset.y, offset.z]}>
          <primitive object={scene} />
        </group>
      </group>
    );
  }
  return () => (
    <Suspense fallback={null}>
      <GLTFModel />
    </Suspense>
  );
}


// ─── Magnetic & non-magnetic object models (scale auto-fitted via bounding box) ───
const NailsModel      = makeGLTF('/nails/scene.gltf');
const TmtBarModel     = makeGLTF('/tmtBar/scene.gltf');
const EraserModel     = makeGLTF('/eraser/scene.gltf');
const RubberDuckModel = makeGLTF('/rubberDuck/scene.gltf');
const WoodModel       = makeGLTF('/wood/scene.gltf');

useGLTF.preload('/nails/scene.gltf');
useGLTF.preload('/tmtBar/scene.gltf');
useGLTF.preload('/eraser/scene.gltf');
useGLTF.preload('/rubberDuck/scene.gltf');
useGLTF.preload('/wood/scene.gltf');

// ─── Helper: y-offset for non-AR display ─────────────────────────────────────
function yOffset(modelType: string) {
  if (modelType === 'electromagnetism') return -0.5;
  return modelType === 'solar-system' ? 0 : 1.0;
}

// ─── Model selector (renders correct model for modelType) ────────────────────
function SceneModel({ modelType, currentSlide = 0 }: { modelType: string, currentSlide?: number }) {
  if (modelType === 'electromagnetism') return <SolenoidModel currentSlide={currentSlide} />;
  if (modelType === 'attraction') return <InteractionModel type="attraction" currentSlide={currentSlide} />;
  if (modelType === 'repulsion') return <InteractionModel type="repulsion" currentSlide={currentSlide} />;
  if (modelType === 'solar-system') return <SolarSystemModel />;
  if (modelType === 'atom') return <AtomModel />;
  if (modelType === 'h2o') return <WaterMoleculeModel />;
  if (modelType === 'magnet') return <MagnetModel />;
  if (modelType === 'nails') return <NailsModel />;
  if (modelType === 'tmtBar') return <TmtBarModel />;
  if (modelType === 'eraser') return <EraserModel />;
  if (modelType === 'rubberDuck') return <RubberDuckModel />;
  if (modelType === 'wood') return <WoodModel />;
  return null;
}

// ─── ModelViewer ─────────────────────────────────────────────────────────────
export const ModelViewer: React.FC<{ modelType: string }> = ({ modelType }) => {
  const isSolar = modelType === 'solar-system';
  const isMagnet = modelType === 'magnet';
  const isSolenoid = modelType === 'electromagnetism';
  const isInteraction = modelType === 'attraction' || modelType === 'repulsion';

  const magneticObj = useMemo(() => [...magneticObjects, ...magnetInteractionObjects].find(o => o.modelType === modelType) as any, [modelType]);
  const hasAnnotations = !!(magneticObj && magneticObj.annotations && magneticObj.annotations.length > 0);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInAR, setIsInAR] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setCurrentSlide(0), [modelType]);

  // Handle Automatic Voice Narration Playback
  useEffect(() => {
    const src = magneticObj?.audioNarrations?.[currentSlide];
    if (src) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(src);
      audioRef.current.play().catch(e => console.warn('Audio auto-play blocked by browser. User needs to tap first.', e));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [magneticObj, currentSlide]);

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn('Replay blocked', e));
    }
  };

  useEffect(() => {
    const unsub = (store as any).subscribe((state: any) => {
      setIsInAR(state.mode === 'immersive-ar');
    });
    return unsub;
  }, []);

  const handleNext = () => setCurrentSlide(s => Math.min(s + 1, (magneticObj?.annotations?.length || 1) - 1));
  const handlePrev = () => setCurrentSlide(s => Math.max(s - 1, 0));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#0a0a0a' }}>
      
      {/* Universal Slide Navigation Buttons (Rendered in normal view AND XR Overlay) */}
      {hasAnnotations && (
        <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: '20px', pointerEvents: 'none' }}>
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            style={{ pointerEvents: 'auto', padding: '14px 24px', borderRadius: '30px', background: currentSlide === 0 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 'bold', fontSize: '1.05rem', cursor: currentSlide === 0 ? 'not-allowed' : 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
          >
            ← Previous
          </button>
          
          {magneticObj?.audioNarrations?.[currentSlide] && (
            <button
              onClick={handleReplayAudio}
              style={{ pointerEvents: 'auto', padding: '14px 24px', borderRadius: '30px', background: 'rgba(0,180,255,0.25)', border: '1px solid rgba(0,240,255,0.5)', color: 'white', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
            >
              ↻ Replay Audio
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentSlide === (magneticObj!.annotations!.length - 1)}
            style={{ pointerEvents: 'auto', padding: '14px 24px', borderRadius: '30px', background: currentSlide === (magneticObj!.annotations!.length - 1) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 'bold', fontSize: '1.05rem', cursor: currentSlide === (magneticObj!.annotations!.length - 1) ? 'not-allowed' : 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
          >
            Next →
          </button>
        </div>
      )}

      {!isInAR && (
        <button
          style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)', transition: 'transform 0.2s' }}
          onClick={() => store.enterAR()}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          View in AR
        </button>
      )}

      {/* AR hint */}
      {isInAR && (
        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', opacity: 0.8, fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '12px' }}>
          Tap to place object · Info card will appear
        </div>
      )}

      <Canvas
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        camera={
          isSolar
            ? { position: [0, 0.8, 2], fov: 60, near: 0.01 }
            : isMagnet
              ? { position: [0, 1, 3], fov: 60, near: 0.01 }
              : { position: [0, 0, 5], fov: 50, near: 0.01 }
        }
      >
        <XR store={store}>
          {/* ── Lighting ── */}
          {isSolar ? (
            <ambientLight intensity={1.4} />
          ) : (
            <>
              {/* Hemisphere: sky blue top, warm ground bounce */}
              <hemisphereLight args={['#c9e8ff', '#ffe8c0', 1.2]} />
              {/* Key light */}
              <directionalLight position={[5, 8, 5]}  intensity={2.0} castShadow />
              {/* Fill light */}
              <directionalLight position={[-5, 4, -3]} intensity={1.0} />
              {/* Rim / back light */}
              <pointLight       position={[0, -3, -5]}  intensity={0.8} color="#a0c8ff" />
            </>
          )}

          {/* ── Outside AR: fixed position, orbit controls ── */}
          <IfInSessionMode deny="immersive-ar">
            <OrbitControls
              autoRotate={!isSolar && !isMagnet && !isSolenoid && !isInteraction}
              autoRotateSpeed={0.5}
              enablePan={false}
              minDistance={0.5}
              maxDistance={20}
            />
            <group position={[0, yOffset(modelType), 0]}>
              <SceneModel modelType={modelType} currentSlide={currentSlide} />
            </group>
          </IfInSessionMode>

          {/* ── Inside AR: hit-test placement + 3D Annotations ── */}
          <IfInSessionMode allow="immersive-ar">
            <ARAnnotatedModel modelType={modelType} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} handleReplayAudio={handleReplayAudio}>
              <SceneModel modelType={modelType} currentSlide={currentSlide} />
            </ARAnnotatedModel>
          </IfInSessionMode>
        </XR>
      </Canvas>
    </div>
  );
};
