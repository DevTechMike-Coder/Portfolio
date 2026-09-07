import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import type { SceneActivity } from "./LazyCanvasWrapper";
import { SceneCanvas } from "./SceneCanvas";

// Central Security Cyber-Core
const GeometricSecurityCore: React.FC<{ isReducedMotion: boolean }> = ({ isReducedMotion }) => {
  const coreRef = useRef<THREE.Group>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const outerWireRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const pointer = useThree((state) => state.pointer);

  // Smooth mouse tilt targets
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (isReducedMotion) return;
    delta = Math.min(delta, 0.05);

    // Smooth subtle mouse follow
    targetRotation.current.x = pointer.y * 0.3;
    targetRotation.current.y = pointer.x * 0.4;

    if (coreRef.current) {
      coreRef.current.rotation.x = THREE.MathUtils.damp(
        coreRef.current.rotation.x,
        targetRotation.current.x,
        4,
        delta
      );
      coreRef.current.rotation.y = THREE.MathUtils.damp(
        coreRef.current.rotation.y,
        targetRotation.current.y,
        4,
        delta
      );
    }

    // Steady subtle rotation
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y += delta * 0.35;
      innerMeshRef.current.rotation.x += delta * 0.15;
    }
    if (outerWireRef.current) {
      outerWireRef.current.rotation.y -= delta * 0.2;
      outerWireRef.current.rotation.z += delta * 0.15;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.4;
      ringRef1.current.rotation.x += delta * 0.15;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.3;
      ringRef2.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Outer Cryptographic Orbit Ring 1 */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.2, 0.02, 12, 48]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer Cryptographic Orbit Ring 2 */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.5, 0.015, 12, 48]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Orbiting Satellite Node 1 */}
      <mesh position={[2.2, 0, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.5} />
      </mesh>

      {/* Orbiting Satellite Node 2 */}
      <mesh position={[-1.7, 1.4, -0.6]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#06b6d4" emissiveIntensity={1.5} />
      </mesh>

      {/* Outer Wireframe Icosahedron */}
      <mesh ref={outerWireRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          color="#10b981"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Translucent Solid Geometric Core */}
      <mesh ref={innerMeshRef}>
        <octahedronGeometry args={[1.0, 0]} />
        <meshPhysicalMaterial
          color="#042f2e"
          emissive="#064e3b"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.8}
          transmission={0.4}
          ior={1.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Inner Radiant Pulsing Core Point */}
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
    </group>
  );
};

// Ambient Floating Particles
const FloatingDataParticles: React.FC<{ count?: number; isReducedMotion: boolean }> = ({
  count = 50,
  isReducedMotion,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 2.8 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (isReducedMotion || !pointsRef.current) return;
    delta = Math.min(delta, 0.05);
    pointsRef.current.rotation.y += delta * 0.05;
    pointsRef.current.rotation.x -= delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#34d399"
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// The canvas owns the animation loop; no global pointer listeners are needed.
const SceneRoot: React.FC<{ isReducedMotion: boolean }> = ({ isReducedMotion }) => {
  return (
    <>
      <ambientLight intensity={0.8} color="#0f172a" />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#e0f2fe" />
      <pointLight position={[-4, -3, 2]} intensity={2.0} color="#06b6d4" distance={10} />
      <pointLight position={[3, 4, 3]} intensity={2.5} color="#10b981" distance={12} />

      <Float enabled={!isReducedMotion} speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
        <GeometricSecurityCore isReducedMotion={isReducedMotion} />
      </Float>

      <FloatingDataParticles count={50} isReducedMotion={isReducedMotion} />
    </>
  );
};

export default function HeroCanvas({ isActive, isReducedMotion }: SceneActivity) {
  return (
    <SceneCanvas
      isActive={isActive}
      isReducedMotion={isReducedMotion}
      camera={{ position: [0, 0, 5.5], fov: 45 }}
    >
      <SceneRoot isReducedMotion={isReducedMotion} />
    </SceneCanvas>
  );
}
