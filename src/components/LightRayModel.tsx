import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text, Line } from '@react-three/drei';
import { MathUtils, Mesh, MeshBasicMaterial, CanvasTexture, RepeatWrapping } from 'three';

// ─── Glowing Beam Texture ──────────────────────────────────────────────────
const createLaserTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    
    // Core photon pulse
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

// ─── Flashlight Wrapper ────────────────────────────────────────────────────
const FlashLight = ({ position, rotation, scale = 0.5 }: any) => {
  const { nodes, materials } = useGLTF('/lightSrc/scene.gltf') as any;
  return (
    <group position={position} rotation={rotation} scale={scale} dispose={null}>
      <group scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.base_base_0.geometry}
          material={materials.base}
          position={[0, 37.169, 92.269]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.glass_glass_0.geometry}
          material={materials.glass}
          position={[0, 0, -323.083]}
        />
      </group>
    </group>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export const LightRayModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  const beamRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  
  // Physics limits
  const targetLength = useRef(0);
  const currentLength = useRef(0);
  const opacity = useRef(0);

  // Derive parameters from slides
  // Slide 0: The Source (Off)
  // Slide 1: Rectilinear Propagation (On, shooting out to 50)
  // Slide 2: Infinity (Shoots out extremely far to 300)
  // Slide 3: Speed of Light (Texture animates completely blazingly fast)
  useFrame((state, delta) => {
    // Determine target state
    if (currentSlide === 0) {
      targetLength.current = 0;
    } else if (currentSlide === 1) {
      targetLength.current = 20; 
    } else {
      targetLength.current = 150; // Vastly far out into the distance
    }

    const isSpeedOfLight = currentSlide >= 3;
    const speed = isSpeedOfLight ? 15.0 : 3.0; // Much faster UV shift for speed of light

    // Animate Extension
    currentLength.current = MathUtils.damp(currentLength.current, targetLength.current, 3, delta);
    
    // Animate Intensity Fade
    const targetOpacity = currentSlide === 0 ? 0 : 1;
    opacity.current = MathUtils.damp(opacity.current, targetOpacity, 6, delta);

    // Apply to mesh
    if (beamRef.current) {
        // Adjust scale Z to stretch the beam. We assume normalized cylinder length = 1
        beamRef.current.scale.set(1, currentLength.current, 1);
        // Position it forward so it grows outward from z=0
        beamRef.current.position.set(0, 0, -currentLength.current / 2);
        
        // UV flow texture animation
        laserTexture.offset.y -= delta * speed;
        laserTexture.repeat.set(1, currentLength.current / 4); // Stretch texture proportionally

        const mat = beamRef.current.material as MeshBasicMaterial;
        mat.opacity = opacity.current * (0.4 + 0.1 * Math.sin(state.clock.elapsedTime * 15));
    }
    
    if (coreRef.current) {
        coreRef.current.scale.set(1, currentLength.current, 1);
        coreRef.current.position.set(0, 0, -currentLength.current / 2);
        const coreMat = coreRef.current.material as MeshBasicMaterial;
        coreMat.opacity = opacity.current * 0.9;
    }
  });

  return (
    <group scale={0.2}>
      {/* Flashlight rotated 180 degrees and shifted so its new emitting face properly aligns with the ray origin */}
      <group position={[0, 0, -3.2]}>
        <FlashLight rotation={[0, Math.PI, 0]} />
        
        {/* AR Source Annotation */}
        {currentSlide >= 1 && (
          <group position={[0, 3.5, 0]}>
            <Line points={[[0, 0, 0], [0, -2.5, 0]]} color="#00f0ff" lineWidth={2} alphaTest={0.5} />
            <Text position={[0, 0.4, 0]} fontSize={0.6} color="#ffffff" anchorX="center" fontWeight="bold">
              Light Source
            </Text>
          </group>
        )}
      </group>

      {/* Volumetric Ray System */}
      <group position={[0, 0, -3.4]}>
        
        {/* AR Ray Annotation */}
        {currentSlide >= 1 && (
          <group position={[0, 2.5, -8]}>
            <Line points={[[0, 0, 0], [0, -1.8, 0]]} color="#00f0ff" lineWidth={2} />
            <Text position={[0, 0.4, 0]} fontSize={0.6} color="#ffffff" anchorX="center" fontWeight="bold">
              Photon Ray
            </Text>
          </group>
        )}
        
        {/* Inner Solid Core */}
        <mesh ref={coreRef} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1, 16]} />
          <meshBasicMaterial color="#ffffff" transparent blending={2} depthWrite={false} />
        </mesh>

        {/* Outer Glowing Pulsing Shell */}
        <mesh ref={beamRef} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1, 32]} />
          <meshBasicMaterial 
            color="#00f0ff" 
            transparent 
            blending={2} 
            depthWrite={false} 
            map={laserTexture} 
          />
        </mesh>
      </group>
    </group>
  );
};
