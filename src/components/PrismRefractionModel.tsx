import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text, Line } from '@react-three/drei';
import { Mesh, MeshBasicMaterial, CanvasTexture, RepeatWrapping, Vector3, Box3 } from 'three';

// ─── Glowing Beam Texture ──────────────────────────────────────────────────
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

// ─── Procedural Beam Component ─────────────────────────────────────────────
const LaserBeam = ({ start, end, opacity = 1.0, widthScale = 1.0, color = "#ffffff" }: any) => {
  const groupRef = useRef<any>(null);
  const shellRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  const length = start.distanceTo(end);
  const midpoint = start.clone().lerp(end, 0.5);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.lookAt(end);
    }
    
    if (shellRef.current) {
        const mat = shellRef.current.material as MeshBasicMaterial;
        mat.opacity = opacity * (0.6 + 0.1 * Math.sin(state.clock.elapsedTime * 15));
    }
  });

  return (
    <group ref={groupRef} position={midpoint}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={coreRef}>
          <cylinderGeometry args={[0.012 * widthScale, 0.012 * widthScale, length, 16]} />
          <meshBasicMaterial color="#ffffff" transparent blending={2} depthWrite={false} opacity={opacity * 0.9} />
        </mesh>
        <mesh ref={shellRef}>
          <cylinderGeometry args={[0.05 * widthScale, 0.06 * widthScale, length, 32]} />
          <meshBasicMaterial color={color} transparent blending={2} depthWrite={false} map={laserTexture} />
        </mesh>
      </group>
    </group>
  );
};

// ─── Prism GLTF ────────────────────────────────────────────────────────────
const PrismMesh = ({ scale = 1.0, position = [0, 0, 0] }: any) => {
  const { scene } = useGLTF('/prism/scene.gltf');
  
  // Mathematically normalize the massive raw GLTF to fit exactly inside a 2-unit radius block
  const box = useMemo(() => new Box3().setFromObject(scene), [scene]);
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const normalizedScale = (2.0 / maxDim) * scale;

  // Auto-center bounding box to ensure geometric faces align with procedural hit-points
  const offset = new Vector3(
    -(box.max.x + box.min.x) / 2 * normalizedScale,
    -(box.max.y + box.min.y) / 2 * normalizedScale,
    -(box.max.z + box.min.z) / 2 * normalizedScale
  );

  return (
    <group position={position}>
       {/* Pivot rotation can optionally be added to parent group if needed later */}
       <group position={offset} scale={normalizedScale}>
         <primitive object={scene} />
       </group>
    </group>
  );
};

// ─── Main Content ──────────────────────────────────────────────────────────
export const PrismRefractionModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {

  useFrame((_, delta) => {
      laserTexture.offset.y -= delta * 4; // Flow texture vertically along the beam
  });

  // Textbook 2D-style layout mapping
  const laserOrigin = new Vector3(-3.5, 0.6, 0);
  const entryHit = new Vector3(-0.5, 0.1, 0); // Intersecting left slanted face
  const exitHit = new Vector3(0.5, -0.1, 0);  // Intersecting right slanted face

  // Spectral Colors Mapping - Splitting vertically (Y axis) for classic 2D viewing
  const spectrumColors = [
    { name: "Red", color: "#ff0000", endY: -0.4 },
    { name: "Orange", color: "#ff8800", endY: -0.65 },
    { name: "Yellow", color: "#ffff00", endY: -0.9 },
    { name: "Green", color: "#00ff00", endY: -1.15 },
    { name: "Blue", color: "#0088ff", endY: -1.4 },
    { name: "Indigo", color: "#4b0082", endY: -1.65 },
    { name: "Violet", color: "#ac00e6", endY: -1.9 },
  ];

  return (
    <group scale={1.2} position={[0, -0.2, 0]}>
      
      {/* Centered Glass Prism */}
      <Suspense fallback={null}>
          <PrismMesh scale={1.5} position={[0, -0.5, 0]} />
      </Suspense>

      {/* Incoming White Light Beam */}
      <LaserBeam start={laserOrigin} end={entryHit} widthScale={1.5} color="#ffffff" opacity={1.0} />

      {/* Internal Bending Ray (Refraction inside glass) */}
      {currentSlide >= 1 && (
        <LaserBeam start={entryHit} end={exitHit} widthScale={0.8} color="#ffffff" opacity={0.6} />
      )}

      {/* Slide 0 and 1: General Refraction Angles & Normal */}
      {currentSlide <= 1 && (
          <group>
             {/* Normal Line at Entry Point (Perpendicular to left face) */}
             <Line points={[[-1.2, 0.8, 0], [0.2, -0.6, 0]]} color="#ffffff" lineWidth={1.5} dashed dashSize={0.1} gapSize={0.05} />
             
             <Text position={[-1.3, 0.9, 0]} fontSize={0.15} color="#ffffff" anchorX="center" fontWeight="bold">
               Normal
             </Text>

             {/* Angle of Incidence */}
             <Text position={[-0.9, 0.5, 0]} fontSize={0.2} color="#00f0ff" anchorX="right" fontWeight="bold">
               ∠ i
             </Text>
             
             {/* Angle of Refraction */}
             {currentSlide >= 1 && (
               <Text position={[-0.1, 0.2, 0]} fontSize={0.2} color="#00f0ff" anchorX="left" fontWeight="bold">
                 ∠ r
               </Text>
             )}
          </group>
      )}

      {/* Slide 2: Spectral Dispersion Rainbow */}
      {currentSlide === 2 && (
          <group>
             {spectrumColors.map((ray, i) => {
                 const rayEnd = new Vector3(3.5, ray.endY, 0); // Fanning down the Y-axis
                 return (
                     <group key={i}>
                         <LaserBeam start={exitHit} end={rayEnd} widthScale={1.3} color={ray.color} opacity={0.8} />
                         <Text position={[3.7, ray.endY, 0]} fontSize={0.16} color={ray.color} anchorX="left" anchorY="middle" fontWeight="bold">
                             {ray.name}
                         </Text>
                     </group>
                 )
             })}
          </group>
      )}

      {/* Light Source Indicator */}
      <group position={[-3.6, 1.2, 0]}>
        <Line points={[[0, 0, 0], [0, -0.4, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
        <Text position={[0, 0.15, 0]} fontSize={0.22} color="#ffffff" anchorX="center" fontWeight="bold">
          White Light Beam
        </Text>
      </group>
      
    </group>
  );
};
