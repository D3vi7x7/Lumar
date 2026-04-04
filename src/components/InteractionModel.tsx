import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import { Vector3, CatmullRomCurve3, Group, MathUtils, Mesh, CanvasTexture, RepeatWrapping } from 'three';

// ─── Magnet Wrapper ────────────────────────────────────────────────────────
const BarMagnet = ({ position, rotation = [0, 80, 0], scale = 7.5 }: any) => {
  const { nodes, materials } = useGLTF('/magnetAttract/scene.gltf') as any;
  return (
    <group position={position} rotation={rotation} scale={scale} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.matmaterial_magnet}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

// ─── Global Directional Flow Texture ───────────────────────────────────────
const createFlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  // Tail fades in, head is bright, hard cutoff to show direction
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.8, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 16);

  // Add arrow head chevron for clarity
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(90, 2);
  ctx.lineTo(110, 8);
  ctx.lineTo(90, 14);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 1); // Repeat 5 times along the tube
  return tex;
};
const flowTexture = createFlowTexture();

// ─── Dense Field Lines ─────────────────────────────────────────────────────
const DenseFieldLines = ({ type, phase }: { type: 'attraction' | 'repulsion', phase: number }) => {
  const groupRef = useRef<Group>(null);

  // Opacity refs for cross-fading
  const indOpacity = useRef(0);
  const comOpacity = useRef(0);

  const { individualColor, combinedColor, textLabel } = useMemo(() => {
    if (phase === 2) return { individualColor: '#00e5ff', combinedColor: '#00e5ff', textLabel: 'Individual Fields Active (Flowing N to S)' };
    if (type === 'attraction') return { individualColor: '#29a2af', combinedColor: '#29a2af', textLabel: 'Combined Field Created! Pulling Together!' };
    return { individualColor: '#ff3333', combinedColor: '#ff3333', textLabel: 'Magnetic Repulsion Conflict! Pushing Apart!' };
  }, [type, phase]);

  const { individual, combined } = useMemo(() => {
    const indPaths: CatmullRomCurve3[] = [];
    const comPaths: CatmullRomCurve3[] = [];

    // 12 radial shells, 2 depth layers
    for (let r = 0; r < 12; r++) {
      const theta = (r / 12) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      for (let layer = 0.5; layer <= 1; layer++) {
        const height = layer * 1.8;

        // 1. INDIVIDUAL FIELDS (For Phase 2)
        // Magnet A: Centers at -2.0. N is -1.3, S is -2.7. 
        // Flow N -> S means x goes -1.3 to -2.7.
        const aPts = [];
        for (let s = 0; s <= 20; s++) {
          const t = s / 20;
          const angle = t * Math.PI; // 0 to PI
          // At 0, cos is 1 -> -2.0 + 0.7 = -1.3
          const x = -2.0 + 0.7 * Math.cos(angle);
          const yOffset = height * Math.sin(angle);
          aPts.push(new Vector3(x, yOffset * sinT, yOffset * cosT));
        }
        indPaths.push(new CatmullRomCurve3(aPts));

        // Magnet B: Centers at 2.0.
        // If Attraction (Rotation 0): N is 2.7, S is 1.3. Flow N(2.7) -> S(1.3).
        // If Repulsion (Rot PI): N is 1.3, S is 2.7. Flow N(1.3) -> S(2.7).
        const bPts = [];
        for (let s = 0; s <= 20; s++) {
          const t = s / 20;
          const angle = t * Math.PI; // 0 to PI
          let x;
          if (type === 'attraction') {
            // From 2.7 to 1.3
            x = 2.0 + 0.7 * Math.cos(angle);
          } else {
            // From 1.3 to 2.7
            x = 2.0 - 0.7 * Math.cos(angle);
          }
          const yOffset = height * Math.sin(angle);
          bPts.push(new Vector3(x, yOffset * sinT, yOffset * cosT));
        }
        indPaths.push(new CatmullRomCurve3(bPts));


        // 2. COMBINED FIELDS (For Phase 3)
        if (type === 'attraction') {
          // Field bridges the gap exactly from A's North (-1.3) to B's South (1.3)

          // Outer oval covering the whole system (From B's North 2.7 to A's South -2.7)
          const outerPts = [];
          for (let s = 0; s <= 20; s++) {
            const t = s / 20;
            const angle = (1 - t) * Math.PI;
            const x = -2.7 * Math.cos(angle); // wait. 0->PI. x = -2.7 to 2.7? Wait, (1-t)*PI means PI to 0. So x gets -2.7*-1 = 2.7, ends at -2.7*1 = -2.7. So 2.7 to -2.7!
            const yOffset = (height * 1.5) * Math.sin(angle);
            outerPts.push(new Vector3(x, yOffset * sinT, yOffset * cosT));
          }
          comPaths.push(new CatmullRomCurve3(outerPts));

        } else {
          // Repulsion: Fields clash and bend up
          // Left Magnet clash
          const lPts = [];
          for (let s = 0; s <= 20; s++) {
            const t = s / 20;
            const angle = t * Math.PI * 0.5; // 0 to 90
            // From A's North (-1.3) bending to center (approx -0.1)
            const x = -1.3 + (1.2 * Math.sin(angle));
            const yOffset = height * t + (t * t * 3);
            lPts.push(new Vector3(x, yOffset * sinT, yOffset * cosT));
          }
          comPaths.push(new CatmullRomCurve3(lPts));

          // Right Magnet clash
          const rPts = [];
          for (let s = 0; s <= 20; s++) {
            const t = s / 20;
            const angle = t * Math.PI * 0.5;
            // From B's North (1.3) bending to center (approx 0.1)
            const x = 1.3 - (1.2 * Math.sin(angle));
            const yOffset = height * t + (t * t * 3);
            rPts.push(new Vector3(x, yOffset * sinT, yOffset * cosT));
          }
          comPaths.push(new CatmullRomCurve3(rPts));
        }
      }
    }

    // Core straight lines bridging gap in attraction phase 3
    if (type === 'attraction') {
      const innerOffsets = [[0, 0], [0, 0.4], [0, -0.4], [0.4, 0], [-0.4, 0]];
      innerOffsets.forEach(([oy, oz]) => {
        // Line from -1.3 to 1.3
        comPaths.push(new CatmullRomCurve3([new Vector3(-1.3, oy, oz), new Vector3(1.3, oy, oz)]));
      });
    }

    return { individual: indPaths, combined: comPaths };
  }, [type]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Slide arrow textures along the field paths 
    flowTexture.offset.x -= delta * 1.5;

    // Cross-fade opacity logic
    indOpacity.current = MathUtils.damp(indOpacity.current, phase === 2 ? 1 : 0, 8, delta);
    comOpacity.current = MathUtils.damp(comOpacity.current, phase >= 3 ? 1 : 0, 8, delta);

    if (indOpacity.current > 0.01 || comOpacity.current > 0.01) {
      groupRef.current.visible = true;
      let childIndex = 0;

      // Update individual lines
      for (let i = 0; i < individual.length; i++) {
        const mesh = groupRef.current.children[childIndex++] as Mesh;
        (mesh.material as any).opacity = indOpacity.current * 0.9;
        mesh.visible = indOpacity.current > 0.01;
      }
      // Update combined lines
      for (let i = 0; i < combined.length; i++) {
        const mesh = groupRef.current.children[childIndex++] as Mesh;
        (mesh.material as any).opacity = comOpacity.current * 0.9;
        mesh.visible = comOpacity.current > 0.01;
      }
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 1. Paint Individual Arrays */}
      {individual.map((p, i) => (
        <mesh key={`ind-${i}`}>
          <tubeGeometry args={[p, 30, 0.02, 5, false]} />
          <meshBasicMaterial color={individualColor} transparent depthWrite={false} blending={2} map={flowTexture} />
        </mesh>
      ))}

      {/* 2. Paint Combined Arrays */}
      {combined.map((p, i) => (
        <mesh key={`com-${i}`}>
          <tubeGeometry args={[p, 30, 0.025, 5, false]} />
          <meshBasicMaterial color={combinedColor} transparent depthWrite={false} blending={2} map={flowTexture} />
        </mesh>
      ))}

      {/* 3D Direction Label */}
      <Text position={[0, 2, 0]} fontSize={0.25} color="#ffffff" anchorX="center" fontWeight="bold">
        {textLabel}
      </Text>
    </group>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export const InteractionModel: React.FC<{ type: 'attraction' | 'repulsion', currentSlide: number }> = ({ type, currentSlide }) => {
  const magnetA = useRef<Group>(null);
  const magnetB = useRef<Group>(null);

  // Initial Rest Positions
  const startA = -2.0;
  const startB = 2.0;

  useFrame((_, delta) => {
    if (!magnetA.current || !magnetB.current) return;

    let targetA = startA;
    let targetB = startB;

    if (currentSlide >= 3) {
      if (type === 'attraction') {
        // Snap Together forcefully!
        targetA = -0.9;
        targetB = 0.9;
      } else {
        // Push apart forcefully!
        targetA = -4.0;
        targetB = 4.0;
      }
    }

    // Apply smooth cinematic spring physics
    magnetA.current.position.x = MathUtils.damp(magnetA.current.position.x, targetA, 5, delta);
    magnetB.current.position.x = MathUtils.damp(magnetB.current.position.x, targetB, 5, delta);

    // Add aggressive vibrating tension on Slide 2 before they release
    if (currentSlide === 2) {
      const tension = type === 'attraction' ? 0.02 : 0.04;
      magnetA.current.position.x += (Math.random() - 0.5) * tension;
      magnetB.current.position.x += (Math.random() - 0.5) * tension;
    }
  });

  return (
    <group scale={0.9}>
      {/* Left Magnet (Always faces inwards with South or North) */}
      {/* Assuming native model points North to +X. Wait, we need to know the Model's Pole orientation.
          Let's assume the native model has North facing left and South facing right.
          We will keep Magnet A default. So South faces East (+X). */}
      <group ref={magnetA} position={[startA, 0, 0]}>
        <BarMagnet />
        <Text position={[0.7, 0.4, 0]} fontSize={0.25} color="#ff3333">N</Text>
        <Text position={[-0.7, 0.4, 0]} fontSize={0.25} color="#3355ff">S</Text>
      </group>

      {/* Right Magnet */}
      {/* For Attraction: We want North (-X) facing South (+X). So we don't rotate it! (Native South faces East, North faces West).
          For Repulsion: We want South (+X) facing South (+X). So we rotate it 180 degrees around Y! */}
      <group ref={magnetB} position={[startB, 0, 0]} rotation={[0, type === 'repulsion' ? Math.PI : 0, 0]}>
        <BarMagnet />
        <Text position={[0.7, 0.4, 0]} fontSize={0.25} color="#ff3333">N</Text>
        <Text position={[-0.7, 0.4, 0]} fontSize={0.25} color="#3355ff">S</Text>
      </group>

      {/* Heavy Field Visualization */}
      <DenseFieldLines type={type} phase={currentSlide} />

    </group>
  );
};
