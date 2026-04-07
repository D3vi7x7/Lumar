import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshReflectorMaterial, Text, Line } from '@react-three/drei';
import { MathUtils, Mesh, MeshBasicMaterial, CanvasTexture, RepeatWrapping, Vector3, CatmullRomCurve3, DoubleSide, BufferAttribute } from 'three';

// ─── Glowing Beam Texture (Reused) ─────────────────────────────────────────
const createLaserTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 16);

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  return tex;
};
const laserTexture = createLaserTexture();

// ─── Flashlight Wrapper (Reused) ───────────────────────────────────────────
const FlashLight = ({ position, rotation, scale = 0.5 }: any) => {
  const { nodes, materials } = useGLTF('/lightSrc/scene.gltf') as any;
  return (
    <group position={position} rotation={rotation} scale={scale} dispose={null}>
      <group scale={0.01} position={[0, 0, 1.155]}>
        <mesh castShadow receiveShadow geometry={nodes.base_base_0.geometry} material={materials.base} position={[0, 37.169, 92.269]} />
        <mesh castShadow receiveShadow geometry={nodes.glass_glass_0.geometry} material={materials.glass} position={[0, 0, -323.083]} />
      </group>
    </group>
  );
};

// ─── Rough Floor GLTF ──────────────────────────────────────────────────────
const RoughFloor = ({ scale = 1.0, position = [0, 0, 0] }: any) => {
  const { scene } = useGLTF('/floor/scene.gltf');
  return <primitive object={scene} scale={scale} position={position} />;
};

// ─── Procedural Beam Component ─────────────────────────────────────────────
const LaserBeam = ({ start, end, opacity = 1.0, width = 0.05, color = "#00f0ff" }: any) => {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshBasicMaterial;
      mat.opacity = opacity;
    }
  });

  return (
    <group position={start.clone().lerp(end, 0.5)}>
      <mesh ref={meshRef} rotation={[0, 0, 0]}>
        {/* Look at logic requires grouping tricks, we use a custom tube for simplicity */}
        {/* Using CatmullRom ensures line connects exactly */}
        <tubeGeometry args={[new CatmullRomCurve3([start.clone().sub(start.clone().lerp(end, 0.5)), end.clone().sub(start.clone().lerp(end, 0.5))]), 2, width, 8, false]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} blending={2} map={laserTexture} />
      </mesh>
    </group>
  )
}

// ─── Main Content ──────────────────────────────────────────────────────────
export const ReflectionModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const floorRef = useRef<Mesh>(null);

  // State booleans based on slide
  const isSpecular = currentSlide === 0;
  const isDiffuse = currentSlide === 1;
  const isMirror = currentSlide >= 2;

  // Deflection rays for Diffuse slide
  const diffuseRays = useMemo(() => {
    const rays = [];
    const origin = new Vector3(0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const phi = MathUtils.randFloat(0, Math.PI / 2.5);
      const theta = MathUtils.randFloat(0, Math.PI * 2);

      const r = 2.0; // blast radius
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      rays.push({ start: origin, end: new Vector3(x, y, z) });
    }
    return rays;
  }, []);

  // Floor geometry animation (bumpy on diffuse)
  useFrame((state, delta) => {
    if (!floorRef.current) return;
    const geom = floorRef.current.geometry;
    const posAttr = geom.getAttribute('position') as BufferAttribute;

    const time = state.clock.elapsedTime;
    const noiseLevel = isDiffuse ? 0.08 : 0.0;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // Math sine wave pseudo noise
      const z = Math.sin(vx * 10 + time * 5) * Math.cos(vy * 8 + time * 4) * noiseLevel;
      posAttr.setZ(i, z);
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();

    // UV offset for all laser textures
    laserTexture.offset.x -= delta * 5;
  });

  // Calculate beam paths 
  const laserOrigin = new Vector3(-1.5, 1.5, 0);
  const floorHit = new Vector3(0, 0, 0);
  const specularBounce = new Vector3(1.5, 1.5, 0);

  return (
    <group scale={0.7} position={[0, -0.2, 0]}>

      {/* ── Slides 0 and 1: Flashlight Physics ── */}
      {!isMirror && (
        <group>
          {/* Flashlight physical body */}
          <group position={[-4.2, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <FlashLight scale={0.4} rotation={[-0.5, Math.PI, 0]} />
          </group>

          {/* Source Annotation */}
          <group position={[-1.6, 2.5, 0]}>
            <Line points={[[0, 0, 0], [0, -0.6, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
            <Text position={[0, 0.2, 0]} fontSize={0.25} color="#ffffff" anchorX="center" fontWeight="bold">
              Light Source
            </Text>
          </group>

          {/* Incoming Main Ray */}
          <LaserBeam start={laserOrigin} end={floorHit} width={0.06} color="#ffffff" />

          <group position={[-0.8, 0.8, 0]}>
            <Line points={[[0, 0, 0], [0.4, 0.4, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
            <Text position={[0.4, 0.6, 0]} fontSize={0.2} color="#ffffff" anchorX="center" fontWeight="bold">
              Incident Ray
            </Text>
          </group>


          {/* Specular Bouncing Ray & Physics Angles */}
          {isSpecular && (
            <group>
              {/* Normal Vector Line */}
              <Line points={[[0, 0, 0], [0, 2.5, 0]]} color="#ffffff" lineWidth={1.5} dashed dashSize={0.1} gapSize={0.05} />
              <Text position={[0, 2.7, 0]} fontSize={0.18} color="#ffffff" anchorX="center" fontWeight="bold">
                Normal
              </Text>

              {/* Angle values */}
              <Text position={[-0.3, 1.0, 0]} fontSize={0.2} color="#00f0ff" anchorX="right" fontWeight="bold">
                ∠ i
              </Text>
              <Text position={[0.3, 1.0, 0]} fontSize={0.2} color="#00f0ff" anchorX="left" fontWeight="bold">
                ∠ r
              </Text>

              <LaserBeam start={floorHit} end={specularBounce} width={0.06} color="#ffffff" />
              <group position={[0.8, 1.3, 0]}>
                <Line points={[[0, 0, 0], [-0.4, 0.4, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
                <Text position={[-0.4, 0.6, 0]} fontSize={0.2} color="#ffffff" anchorX="center" fontWeight="bold">
                  Reflected Ray
                </Text>
              </group>
            </group>
          )}

          {/* Diffuse Scattering Rays */}
          {isDiffuse && diffuseRays.map((ray, i) => (
            <LaserBeam key={i} start={ray.start} end={ray.end} width={0.02} opacity={0.6} />
          ))}

          {/* The Floor */}
          {!isDiffuse ? (
            <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4, 4, 32, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} side={DoubleSide} />
            </mesh>
          ) : (
            <group>
              <RoughFloor scale={0.2} position={[0, 0.55, 0]} />
              <group position={[0.8, 1.3, 0]}>
                <Line points={[[0, 0, 0], [2.4, 0.4, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
                <Text position={[2.4, 0.6, 0]} fontSize={0.2} color="#ffffff" anchorX="center" fontWeight="bold">
                  Reflected Rays from rough surface
                </Text>
              </group>
            </group>
          )}
        </group>
      )}

      {/* ── Slide 2: Real-time Mirror Rendering ── */}
      {isMirror && (
        <group>
          {/* Horizontal Polished Mirror Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
            <planeGeometry args={[15, 15]} />
            <MeshReflectorMaterial
              blur={[0, 0]}
              resolution={1024}
              mixBlur={0}
              mixStrength={1} // Base level, no overdrive clipping
              roughness={0}
              color="#a0a0a0" // Brighter baseline color
              metalness={0.8} // Natural reflectivity
              mirror={1}
            />
          </mesh>

          {/* Spawning the Glowing Cube Subject onto the polished floor */}
          <group position={[0, 0.5, 0]}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={2} toneMapped={false} />
            </mesh>

            <Text position={[0, 1.5, 0]} fontSize={0.2} color="white" anchorX="center" fontWeight="bold">
              Glowing Cube
            </Text>

            {/* Virtual Image Helper Text explicitly pointing below the floor level */}
            <Text position={[3.7, 0.2, 0]} fontSize={0.22} color="#00f0ff" anchorX="center" fontWeight="bold">
              Virtual Reflected Image (Underneath)
            </Text>
          </group>
        </group>
      )}
    </group>
  );
};
