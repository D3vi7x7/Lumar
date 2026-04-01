import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, Group, MathUtils, Mesh } from 'three';

// ─── 1. Iron Core ─────────────────────────────────────────────────────────────
const IronCore = () => (
  <group position={[0, 0.22, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[0.09, 0.09, 3.6, 32]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.35} metalness={0.92} />
    </mesh>
    {[-1.8, 1.8].map((x, i) => (
      <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.095, 0.095, 0.05, 32]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.35} metalness={0.92} />
      </mesh>
    ))}
  </group>
);

// ─── 2. Power Supply Unit (PSU) ───────────────────────────────────────────────
const PSU = ({ position, isLeft, phase }: { position: [number, number, number], isLeft: boolean, phase: number }) => {
  // Screen glows bright green when power is connected (Slide 3)
  const screenGlow = phase >= 2 ? 0.8 : 0;
  
  return (
    <group position={position}>
      {/* Heavy Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.7, 1.1]} />
        <meshStandardMaterial color="#1c2030" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Faceplate */}
      <mesh position={[0.805 * (isLeft ? 1 : -1), 0, 0]} rotation={[0, (isLeft ? -1 : 1) * Math.PI / 2, 0]}>
        <planeGeometry args={[1.56, 0.66]} />
        <meshStandardMaterial color="#2a3050" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Digital Screen */}
      <mesh position={[0.811 * (isLeft ? 1 : -1), 0.1, -0.1]} rotation={[0, (isLeft ? -1 : 1) * Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshStandardMaterial color={phase >= 2 ? "#00ff88" : "#052211"} roughness={0.1} emissive="#00ff88" emissiveIntensity={screenGlow} />
      </mesh>
    </group>
  );
};

// ─── 2b. Lead Wires ───────────────────────────────────────────────────────────
const LeadWires = ({ phase }: { phase: number }) => {
  const leftPath = useMemo(() => new CatmullRomCurve3([[-1.5, 0.22, 0], [-2.0, 0.4, 0], [-2.8, 0.5, 0], [-3.5, 0.5, -0.5], [-4.0, 0.3, -1.0]].map(p => new Vector3(...p))), []);
  const rightPath = useMemo(() => new CatmullRomCurve3([[1.5, 0.22, 0], [2.0, 0.4, 0], [2.8, 0.5, 0], [3.5, 0.5, -0.5], [4.0, 0.3, -1.0]].map(p => new Vector3(...p))), []);

  return (
    <group visible={phase >= 2}>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[leftPath, 40, 0.022, 8, false]} />
        <meshStandardMaterial color="#c87533" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[rightPath, 40, 0.022, 8, false]} />
        <meshStandardMaterial color="#c87533" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
};

// ─── 3. Copper Coil & Leads ───────────────────────────────────────────────────
const TURNS = 36;
const COIL_LENGTH = 3.0;
const COIL_RADIUS = 0.175;

const CopperCoil = ({ phase }: { phase: number }) => {
  const meshRef = useRef<Mesh>(null);
  const coilProgress = useRef(0);
  const currentStrength = useRef(0);

  // Generate Coil Path
  const coilGeo = useMemo(() => {
    const pts = [];
    const totalSteps = TURNS * 64;
    for (let i = 0; i <= totalSteps; i++) {
        const t = i / totalSteps;
        const angle = t * TURNS * Math.PI * 2;
        const x = (t - 0.5) * COIL_LENGTH;
        pts.push(new Vector3(x, COIL_RADIUS * Math.sin(angle) + 0.22, COIL_RADIUS * Math.cos(angle)));
    }
    const path = new CatmullRomCurve3(pts);
    return { path, totalSteps };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Animate drawing the coil when phase >= 1 (Wrap)
    const targetProgress = phase >= 1 ? 1 : 0;
    coilProgress.current = MathUtils.damp(coilProgress.current, targetProgress, 4, delta);
    
    // Update DrawRange (like stroke-dasharray)
    const geo = meshRef.current.geometry;
    const count = geo.index ? geo.index.count : geo.attributes.position.count;
    geo.setDrawRange(0, Math.floor(coilProgress.current * count));

    // Animate Current Intensity when phase >= 2 (Connect)
    const targetStrength = phase >= 2 ? 1 : 0;
    currentStrength.current = MathUtils.damp(currentStrength.current, targetStrength, 2, delta);
    
    // Pulsing Glow when active
    const glowBase = phase >= 3 ? 1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.3 : 0;
    const material = meshRef.current.material as any;
    material.emissiveIntensity = currentStrength.current * glowBase;
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow visible={phase >= 1}>
        <tubeGeometry args={[coilGeo.path, coilGeo.totalSteps, 0.018, 8, false]} />
        <meshStandardMaterial color="#c87533" roughness={0.15} metalness={0.95} emissive="#ff6600" emissiveIntensity={0} />
      </mesh>
    </group>
  );
};

// ─── 4. Magnetic Field Lines ──────────────────────────────────────────────────
const MagneticField = ({ phase }: { phase: number }) => {
  const groupRef = useRef<Group>(null);
  const strength = useRef(0);

  const arcs = useMemo(() => {
    const lines = [];
    // Calculate arc paths
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pts = [];
      for (let s = 0; s <= 40; s++) {
        const t = s / 40;
        const a = t * Math.PI;
        const x = Math.cos(Math.PI + a) * 2.0;
        const y = 0.22 + Math.sin(a) * (0.8 + i * 0.25);
        const z = Math.sin(angle) * 0.3;
        pts.push(new Vector3(x, y, z));
      }
      lines.push(new CatmullRomCurve3(pts));
    }
    return lines;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Activate only in fully active phase (3)
    const targetStrength = phase >= 3 ? 1 : 0;
    strength.current = MathUtils.damp(strength.current, targetStrength, 2, delta);
    
    if (strength.current > 0.01) {
      groupRef.current.visible = true;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
      groupRef.current.children.forEach((child, i) => {
        (child as Mesh).rotation.x = state.clock.elapsedTime * 0.4 * (i % 2 === 0 ? 1 : -1) * 0.15;
        const mat = (child as Mesh).material as any;
        mat.opacity = strength.current * (0.4 + 0.1 * Math.sin(state.clock.elapsedTime * 3 + i * 0.7));
      });
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {arcs.map((path, i) => (
        <mesh key={i}>
          <tubeGeometry args={[path, 40, 0.007, 6, false]} />
          <meshBasicMaterial color="#4488ff" transparent depthWrite={false} blending={2} opacity={0} side={2} />
        </mesh>
      ))}
    </group>
  );
};

// ─── 5. Dynamic Nails (FSM Physics) ───────────────────────────────────────────
const NailsSwarm = ({ phase }: { phase: number }) => {
  const NAIL_COUNT = 22;
  const groupRef = useRef<Group>(null);
  
  // Initialize nail physical states
  const nailStates = useMemo(() => {
    return Array.from({ length: NAIL_COUNT }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.4 + Math.random() * 2.2;
      return {
        startX: Math.cos(angle) * dist,
        startZ: Math.sin(angle) * dist * 0.6,
        startY: -0.1, // Wait, Table was at -0.09. Without table, let them sit at Y= -0.1 or so.
        restZ: Math.PI / 2 + (Math.random() - 0.5) * 0.3,
        attractT: 0,
        attracting: false,
        attracted: false
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const isMagnetActive = phase >= 3;

    groupRef.current.children.forEach((mesh, index) => {
      const st = nailStates[index];
      
      // Update Attraction Trigger
      if (isMagnetActive && !st.attracting && !st.attracted) {
        st.attracting = true;
      } else if (!isMagnetActive && (st.attracting || st.attracted)) {
        st.attracting = false;
        st.attracted = false;
        st.attractT = 0; // instantly fall back
      }

      // Calculate smooth flight physics
      if (st.attracting) {
        st.attractT = Math.min(st.attractT + delta * 1.5, 1);
        if (st.attractT >= 1) {
            st.attracting = false;
            st.attracted = true;
        }
      }

      // Linear physics transforms based on attractT (0 = floor, 1 = attached to core)
      if (st.attractT > 0 || st.attracted) {
        const targetX = st.startX * 0.2; // suck inwards
        const targetY = 0.22; // core height
        const targetZ = st.startZ * 0.1;

        mesh.position.x = MathUtils.lerp(st.startX, targetX, st.attractT);
        mesh.position.y = MathUtils.lerp(st.startY, targetY, st.attractT * st.attractT); // parabolic rise
        mesh.position.z = MathUtils.lerp(st.startZ, targetZ, st.attractT);
        
        // Wobble when attached
        if (st.attracted) {
            mesh.position.y = targetY + Math.sin(state.clock.elapsedTime * 15 + st.startX) * 0.005;
        }

        const targetRotZ = Math.PI / 2 + Math.sin(st.attractT * Math.PI) * 0.4;
        mesh.rotation.z = MathUtils.lerp(st.restZ, targetRotZ, st.attractT);
      } else {
        // Resting on floor
        mesh.position.set(st.startX, st.startY, st.startZ);
        mesh.rotation.z = st.restZ;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {nailStates.map((st, i) => (
        <group key={i} position={[st.startX, st.startY, st.startZ]} rotation={[0, 0, st.restZ]}>
          <mesh castShadow name="shaft">
            <cylinderGeometry args={[0.012, 0.007, 0.3, 8]} />
            <meshStandardMaterial color="#555565" roughness={0.4} metalness={0.88} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow name="head">
            <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
            <meshStandardMaterial color="#666677" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─── Main Solenoid Assembly Export ────────────────────────────────────────────
export const SolenoidModel: React.FC<{ currentSlide: number }> = ({ currentSlide }) => {
  return (
    <group scale={0.5} position={[0, 0, 0]}>
      {/* Structural Components */}
      <IronCore />
      <PSU position={[-4.5, 0.18, -1.2]} isLeft={true} phase={currentSlide} />
      <PSU position={[4.2, 0.18, -1.2]} isLeft={false} phase={currentSlide} />
      
      {/* Dynamic Physics Components driven by currentSlide */}
      <LeadWires phase={currentSlide} />
      <CopperCoil phase={currentSlide} />
      <MagneticField phase={currentSlide} />
      <NailsSwarm phase={currentSlide} />
    </group>
  );
};
