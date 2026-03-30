import React, {
  useRef, useMemo, useState, useEffect, useCallback
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import {
  XR, createXRStore, useXRHitTest, IfInSessionMode, useXR
} from '@react-three/xr';
import {
  Group, Vector3, Box3, Plane, Raycaster, Vector2,
  Mesh, Matrix4, Quaternion
} from 'three';

// ─── Constants ───────────────────────────────────────────────────────────────
const ATTRACTION_RADIUS = 2.6;
const SNAP_RADIUS       = 0.58;
const OBJ_START         = new Vector3(-2.2, 0, 0);
const MAG_START         = new Vector3( 3.8, 0, 0);

type SimState = 'idle' | 'attracting' | 'stuck' | 'repelled';

// ─── Auto-fit GLTF (no self-rotation — we want it stationary for the sim) ───
function AutoFitGLTF({ path, targetSize = 1.6 }: { path: string; targetSize?: number }) {
  const { scene } = useGLTF(path);
  const { scale, offset } = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const box    = new Box3().setFromObject(scene);
    const size   = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const sc = maxDim > 0 ? targetSize / maxDim : 1;
    return {
      scale: sc,
      offset: new Vector3(-sc * center.x, -sc * center.y, -sc * center.z)
    };
  }, [scene, targetSize]);

  return (
    <group scale={scale} position={[offset.x, offset.y, offset.z]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Bar Magnet geometry ─────────────────────────────────────────────────────
function BarMagnet({ onPointerDown }: { onPointerDown: (e: any) => void }) {
  return (
    <group>
      {/* N pole — red */}
      <mesh position={[-0.55, 0, 0]} onPointerDown={onPointerDown} castShadow>
        <boxGeometry args={[1.1, 0.46, 0.46]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* S pole — blue */}
      <mesh position={[0.55, 0, 0]} onPointerDown={onPointerDown} castShadow>
        <boxGeometry args={[1.1, 0.46, 0.46]} />
        <meshStandardMaterial color="#3182ce" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Centre ridge */}
      <mesh position={[0, 0, 0]} onPointerDown={onPointerDown}>
        <boxGeometry args={[0.18, 0.56, 0.56]} />
        <meshStandardMaterial color="#2d3748" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Labels */}
      <Text position={[-0.55, 0, 0.24]} fontSize={0.22} color="white"
            anchorX="center" anchorY="middle">N</Text>
      <Text position={[ 0.55, 0, 0.24]} fontSize={0.22} color="white"
            anchorX="center" anchorY="middle">S</Text>
      {/* Grab hint bar */}
      <mesh position={[0, -0.40, 0]} onPointerDown={onPointerDown}>
        <boxGeometry args={[2.3, 0.06, 0.06]} />
        <meshStandardMaterial color="#718096" roughness={0.5}
                               transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── Spark burst (plays when object sticks) ──────────────────────────────────
function Sparks({ active }: { active: boolean }) {
  const refs    = useRef<(Mesh | null)[]>([]);
  const phases  = useRef<number[]>(Array.from({ length: 10 }, (_, i) => i / 10));

  useFrame((_, dt) => {
    if (!active) return;
    refs.current.forEach((m, i) => {
      if (!m) return;
      phases.current[i] = (phases.current[i] + dt * 1.6) % 1;
      const t     = phases.current[i];
      const angle = (i / 10) * Math.PI * 2;
      const r     = t * 1.1;
      m.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      (m.material as any).opacity = Math.max(0, 1 - t * 1.5);
    });
  });

  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={1}
                              depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Pulsing attraction glow (sphere shell around object) ───────────────────
function AttractionGlow({ proximity }: { proximity: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.8 + 0.2 * Math.sin(clock.getElapsedTime() * 7);
    (ref.current.material as any).opacity = proximity * 0.30 * pulse;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.0, 32, 32]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0}
                          depthWrite={false} side={2} />
    </mesh>
  );
}

// ─── Pulsing repel ring ──────────────────────────────────────────────────────
function RepelRing({ active }: { active: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = active ? 0.5 + 0.5 * Math.abs(Math.sin(clock.getElapsedTime() * 5)) : 0;
    (ref.current.material as any).opacity = pulse * 0.7;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.05, 40]} />
      <meshBasicMaterial color="#ff4d4d" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ─── Drag label (disappears after first drag) ────────────────────────────────
function DragHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Text
      position={[MAG_START.x, MAG_START.y + 0.9, MAG_START.z]}
      fontSize={0.22}
      color="rgba(255,255,255,0.55)"
      anchorX="center"
      anchorY="middle"
    >
      ← drag
    </Text>
  );
}

// ─── Non-AR scene ────────────────────────────────────────────────────────────
interface SceneProps {
  modelType:  string;
  isMagnetic: boolean;
  onState:    (s: SimState) => void;
  resetKey:   number;
}

function MagnetScene({ modelType, isMagnetic, onState, resetKey }: SceneProps) {
  const { camera, gl } = useThree();

  // Live position refs (mutated every frame — no re-render cost)
  const magnetPos  = useRef(MAG_START.clone());
  const objectPos  = useRef(OBJ_START.clone());
  const stateRef   = useRef<SimState>('idle');
  const dragging   = useRef(false);
  const repelShown = useRef(false);

  // Group refs for Three.js position mutations
  const magnetRef  = useRef<Group>(null);
  const objectRef  = useRef<Group>(null);

  // Shared attraction point-light ref
  const glowLightRef = useRef<any>(null);

  // React state — only for things that drive HTML overlays
  const [proximity,  setProximity]  = useState(0);
  const [simState,   setSimState]   = useState<SimState>('idle');
  const [showHint,   setShowHint]   = useState(true);

  // Drag plane: always faces the camera (Z = constant at magnet depth)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), []);

  // Reset on key change
  useEffect(() => {
    magnetPos.current.copy(MAG_START);
    objectPos.current.copy(OBJ_START);
    stateRef.current  = 'idle';
    repelShown.current = false;
    setSimState('idle');
    setProximity(0);
    setShowHint(true);
    onState('idle');
  }, [resetKey]); // eslint-disable-line

  // Global pointer-move/up listeners for smooth drag
  useEffect(() => {
    const canvas    = gl.domElement;
    const raycaster = new Raycaster();
    const ndc       = new Vector2();
    const hit       = new Vector3();

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width)  *  2 - 1,
        -((e.clientY - rect.top)  / rect.height) *  2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hit)) {
        magnetPos.current.set(
          Math.max(-5, Math.min(6, hit.x)),
          Math.max(-2, Math.min(2, hit.y)),
          0
        );
      }
    };
    const onUp = () => {
      dragging.current = false;
      canvas.style.cursor = 'auto';
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, [camera, gl, dragPlane]);

  // Physics + render sync every frame
  useFrame((_, dt) => {
    if (!magnetRef.current || !objectRef.current) return;

    const dist = magnetPos.current.distanceTo(objectPos.current);
    const prox = Math.max(0, 1 - dist / ATTRACTION_RADIUS);

    let next: SimState = 'idle';

    if (dist < ATTRACTION_RADIUS) {
      if (isMagnetic) {
        if (dist < SNAP_RADIUS || stateRef.current === 'stuck') {
          next = 'stuck';
          // Stick: object sits just left of the N pole
          const target = magnetPos.current.clone().add(new Vector3(-1.15, 0, 0));
          objectPos.current.lerp(target, 0.18);
        } else {
          next = 'attracting';
          const speed = Math.min(0.10, 1.8 / (dist * dist));
          objectPos.current.lerp(magnetPos.current, speed * dt * 60);
        }
      } else {
        next = 'repelled';
      }
    }

    // Sync 3D positions
    magnetRef.current.position.copy(magnetPos.current);
    objectRef.current.position.copy(objectPos.current);

    // Glow light between magnet and object
    if (glowLightRef.current) {
      glowLightRef.current.intensity = prox * 3.5;
      glowLightRef.current.position.lerpVectors(
        magnetPos.current, objectPos.current, 0.5
      );
    }

    // Flush to React state (proximity throttled to avoid excess renders)
    if (Math.abs(prox - proximity) > 0.03) setProximity(prox);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setSimState(next);
      onState(next);
    }
  });

  const onMagnetDown = useCallback((e: any) => {
    e.stopPropagation();
    dragging.current = true;
    gl.domElement.style.cursor = 'grabbing';
    setShowHint(false);
  }, [gl]);

  return (
    <>
      {/* Glow attraction point-light */}
      <pointLight ref={glowLightRef} color="#00f0ff" intensity={0} distance={6} />

      {/* Object group */}
      <group ref={objectRef} position={OBJ_START.toArray()}>
        <AutoFitGLTF path={`/${modelType}/scene.gltf`} targetSize={1.6} />
        <AttractionGlow proximity={proximity} />
        {simState === 'stuck'    && <Sparks active />}
        {simState === 'repelled' && <RepelRing active />}
      </group>

      {/* Magnet group */}
      <group ref={magnetRef} position={MAG_START.toArray()}>
        <BarMagnet onPointerDown={onMagnetDown} />
      </group>

      {/* Drag hint text */}
      <DragHint show={showHint} />

      {/* Floor grid for depth cue */}
      <gridHelper args={[14, 14, '#1a1a2e', '#1a1a2e']}
                  position={[0, -1.6, 0]} />
    </>
  );
}

// ─── AR scene ────────────────────────────────────────────────────────────────
interface ARSceneProps extends SceneProps {
  arOffset: number;   // 0 = touching, ~1.5 = starting distance
}

function ARMagnetScene({ modelType, isMagnetic, onState, resetKey, arOffset }: ARSceneProps) {
  const session = useXR((s) => s.session);

  // Shared one-time allocated math objects
  const _mat  = useMemo(() => new Matrix4(),    []);
  const _pos  = useMemo(() => new Vector3(),    []);
  const _quat = useMemo(() => new Quaternion(), []);
  const _scl  = useMemo(() => new Vector3(),    []);

  const [placed,      setPlaced]      = useState(false);
  const reticlePos    = useRef(new Vector3());
  const reticleQuat   = useRef(new Quaternion());
  const placedPos     = useRef(new Vector3());
  const placedQuat    = useRef(new Quaternion());

  const objectPos     = useRef(new Vector3());
  const stateRef      = useRef<SimState>('idle');

  const objectRef     = useRef<Group>(null);
  const magnetRef     = useRef<Group>(null);
  const reticleRef    = useRef<Group>(null);

  // Tap to place
  useEffect(() => {
    if (!session) return;
    const onSelect = () => {
      placedPos.current.copy(reticlePos.current);
      placedQuat.current.copy(reticleQuat.current);
      objectPos.current.copy(reticlePos.current);
      setPlaced(true);
    };
    session.addEventListener('select', onSelect);
    return () => session.removeEventListener('select', onSelect);
  }, [session]);

  // Hit-test for reticle
  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0) {
      if (reticleRef.current) reticleRef.current.visible = false;
      return;
    }
    getWorldMatrix(_mat, results[0]);
    _mat.decompose(_pos, _quat, _scl);
    reticlePos.current.copy(_pos);
    reticleQuat.current.copy(_quat);
    if (reticleRef.current) {
      reticleRef.current.visible = true;
      reticleRef.current.position.copy(_pos);
    }
  }, 'viewer', ['plane', 'mesh', 'point']);

  // Reset
  useEffect(() => {
    if (!placed) return;
    objectPos.current.copy(placedPos.current);
    stateRef.current = 'idle';
    onState('idle');
  }, [resetKey, placed]); // eslint-disable-line

  useFrame((_, dt) => {
    if (!placed || !objectRef.current || !magnetRef.current) return;

    // Magnet position: offset along world X from placed position
    const AR_SCALE  = 0.12;   // 12 cm AR scale
    const magWorldX = placedPos.current.x + arOffset * AR_SCALE;
    const magnetWorldPos = new Vector3(
      magWorldX,
      placedPos.current.y,
      placedPos.current.z
    );

    const dist = magnetWorldPos.distanceTo(objectPos.current);
    const arAttract = ATTRACTION_RADIUS * AR_SCALE;
    const arSnap    = SNAP_RADIUS * AR_SCALE;

    let next: SimState = 'idle';
    if (dist < arAttract) {
      if (isMagnetic) {
        if (dist < arSnap || stateRef.current === 'stuck') {
          next = 'stuck';
          objectPos.current.lerp(magnetWorldPos, 0.15);
        } else {
          next = 'attracting';
          const speed = Math.min(0.08, 1.2 / (dist * dist));
          objectPos.current.lerp(magnetWorldPos, speed * dt * 60);
        }
      } else {
        next = 'repelled';
      }
    }

    objectRef.current.position.copy(objectPos.current);
    magnetRef.current.position.copy(magnetWorldPos);

    if (next !== stateRef.current) {
      stateRef.current = next;
      onState(next);
    }
  });

  const AR_RENDER_SCALE = 0.12;

  return (
    <>
      {/* Hit-test reticle */}
      <group ref={reticleRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.08, 32]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      </group>

      {placed && (
        <>
          <group ref={objectRef} scale={AR_RENDER_SCALE}>
            <AutoFitGLTF path={`/${modelType}/scene.gltf`} targetSize={1.6} />
          </group>
          <group ref={magnetRef} scale={AR_RENDER_SCALE}>
            <BarMagnet onPointerDown={() => {}} />
          </group>
        </>
      )}
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
const xrStore = createXRStore();

export const MagnetSimulator: React.FC<{
  modelType:  string;
  isMagnetic: boolean;
}> = ({ modelType, isMagnetic }) => {
  const [simState,  setSimState]  = useState<SimState>('idle');
  const [resetKey,  setResetKey]  = useState(0);
  const [isInAR,    setIsInAR]    = useState(false);
  const [arOffset,  setArOffset]  = useState(1.5);   // 1.5 = far, 0 = touching

  // Vertical slider drag state
  const sliderDragging  = useRef(false);
  const sliderStartY    = useRef(0);
  const sliderStartOff  = useRef(1.5);

  // Track AR session via store subscription
  useEffect(() => {
    const unsub = (xrStore as any).subscribe((state: any) => {
      setIsInAR(state.mode === 'immersive-ar');
    });
    return unsub;
  }, []);

  const reset = useCallback(() => {
    setResetKey(k => k + 1);
    setSimState('idle');
    setArOffset(1.5);
  }, []);

  // Badge styles
  const badgeBase: React.CSSProperties = {
    position: 'absolute', top: 14, left: '50%',
    transform: 'translateX(-50%)', zIndex: 20,
    padding: '7px 18px', borderRadius: 999,
    fontWeight: 700, fontSize: '0.9rem',
    display: 'flex', alignItems: 'center', gap: 7,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'nowrap', pointerEvents: 'none'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      background: '#060910',
      border: '1px solid rgba(255,255,255,0.07)'
    }}>

      {/* ── Status badges ── */}
      {simState === 'stuck' && (
        <div style={{ ...badgeBase, background: 'rgba(0,200,120,0.14)',
                      border: '1.5px solid #00c878', color: '#00c878' }}>
          🧲 Attracted! &nbsp;✓
        </div>
      )}
      {simState === 'repelled' && (
        <div style={{ ...badgeBase, background: 'rgba(255,70,70,0.12)',
                      border: '1.5px solid #ff4d4d', color: '#ff4d4d' }}>
          ✕ Non-Magnetic — not attracted
        </div>
      )}
      {simState === 'attracting' && (
        <div style={{ ...badgeBase, background: 'rgba(0,240,255,0.08)',
                      border: '1px solid rgba(0,240,255,0.35)', color: '#00f0ff',
                      fontSize: '0.82rem' }}>
          ⚡ Attracting…
        </div>
      )}

      {/* ── AR hint ── */}
      {isInAR && (
        <div style={{ position: 'absolute', top: 14, left: '50%',
                      transform: 'translateX(-50%)', zIndex: 20,
                      fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
                      pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          Tap to place · use slider to move magnet
        </div>
      )}

      {/* ── Bottom buttons ── */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20,
                    display: 'flex', gap: 10 }}>
        <button onClick={reset} style={{
          padding: '10px 18px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.8)', fontWeight: 600,
          fontSize: '0.85rem', cursor: 'pointer',
          backdropFilter: 'blur(8px)'
        }}>↺ Reset</button>
        <button onClick={() => xrStore.enterAR()} style={{
          padding: '10px 20px', borderRadius: 999,
          background: 'linear-gradient(135deg,#00f0ff,#007bff)',
          border: 'none', color: 'white', fontWeight: 700,
          fontSize: '0.85rem', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,240,255,0.3)'
        }}>View in AR</button>
      </div>

      {/* ── AR vertical slider (magnet distance) ── */}
      {isInAR && (
        <div
          style={{
            position: 'absolute', right: 16,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, userSelect: 'none', touchAction: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
          }}
          onPointerDown={(e) => {
            sliderDragging.current   = true;
            sliderStartY.current     = e.clientY;
            sliderStartOff.current   = arOffset;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!sliderDragging.current) return;
            const delta = (sliderStartY.current - e.clientY) / 80;
            setArOffset(Math.max(0.05, Math.min(1.8, sliderStartOff.current + delta)));
          }}
          onPointerUp={() => { sliderDragging.current = false; }}
        >
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.6rem',
                          writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
            Farther
          </span>
          <div style={{
            width: 40, height: 130,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
            position: 'relative', overflow: 'hidden', cursor: 'ns-resize'
          }}>
            {/* Track */}
            <div style={{
              position: 'absolute', left:'50%', top: 6, bottom: 6,
              width: 2, transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.1)', borderRadius: 1
            }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              top: `${((1.8 - arOffset) / 1.75) * 100}%`,
              left: '50%', transform: 'translate(-50%,-50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#e53e3e,#3182ce)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              transition: sliderDragging.current ? 'none' : 'top 0.05s'
            }} />
          </div>
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.6rem',
                          writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
            Closer
          </span>
        </div>
      )}

      {/* ── Canvas ── */}
      <Canvas
        camera={{ position: [0, 1.5, 9], fov: 50, near: 0.01 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <XR store={xrStore}>
          {/* Lighting */}
          <hemisphereLight args={['#c9e8ff', '#ffe8c0', 1.1]} />
          <directionalLight position={[ 5,  8,  5]} intensity={2.2} castShadow />
          <directionalLight position={[-4,  3, -3]} intensity={0.9} />
          <pointLight       position={[ 0,  5,  0]} intensity={0.5} />

          {/* Non-AR scene */}
          <IfInSessionMode deny="immersive-ar">
            <MagnetScene
              key={resetKey}
              modelType={modelType}
              isMagnetic={isMagnetic}
              onState={setSimState}
              resetKey={resetKey}
            />
          </IfInSessionMode>

          {/* AR scene */}
          <IfInSessionMode allow="immersive-ar">
            <ARMagnetScene
              key={resetKey}
              modelType={modelType}
              isMagnetic={isMagnetic}
              onState={setSimState}
              resetKey={resetKey}
              arOffset={arOffset}
            />
          </IfInSessionMode>
        </XR>
      </Canvas>
    </div>
  );
};
