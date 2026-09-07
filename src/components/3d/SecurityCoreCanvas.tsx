import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import type { SceneActivity } from "./LazyCanvasWrapper";
import { SceneCanvas } from "./SceneCanvas";

// Cryptographic Security Gimbal
const SecurityShieldMesh: React.FC<{ isReducedMotion: boolean; isHovered: boolean }> = ({
  isReducedMotion,
  isHovered,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    if (isReducedMotion) return;
    delta = Math.min(delta, 0.05);

    // Smooth tilt towards cursor
    if (groupRef.current) {
      const targetRotX = pointer.y * 0.4;
      const targetRotY = pointer.x * 0.5;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetRotX,
        5,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotY,
        5,
        delta
      );
    }

    const speed = isHovered ? 1.6 : 0.6;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.4 * speed;
      ring1Ref.current.rotation.y += delta * 0.2 * speed;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.35 * speed;
      ring2Ref.current.rotation.z += delta * 0.25 * speed;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5 * speed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Gimbal Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.03, 12, 64]} />
        <meshStandardMaterial
          color={isHovered ? "#34d399" : "#10b981"}
          emissive="#10b981"
          emissiveIntensity={isHovered ? 1.2 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Gimbal Ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[1.4, 0.025, 12, 64]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={isHovered ? 1.4 : 0.6}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Central Cyber Prism / Shield Emblem */}
      <mesh ref={coreRef}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshPhysicalMaterial
          color="#0f172a"
          emissive={isHovered ? "#059669" : "#047857"}
          emissiveIntensity={isHovered ? 1.5 : 0.8}
          roughness={0.15}
          metalness={0.85}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Shield Overlay */}
      <mesh>
        <dodecahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial
          color={isHovered ? "#6ee7b7" : "#34d399"}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Orbiting Sentinel nodes */}
      <mesh position={[1.8, 0, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[-1.4, 0.9, 0.5]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
    </group>
  );
};

const SecuritySceneRoot: React.FC<{ isReducedMotion: boolean }> = ({ isReducedMotion }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <ambientLight intensity={0.6} color="#0f172a" />
      <directionalLight position={[4, 5, 4]} intensity={1.5} color="#e0f2fe" />
      <pointLight position={[-3, 2, 2]} intensity={2} color="#06b6d4" distance={8} />
      <pointLight position={[3, -2, 2]} intensity={2.5} color="#10b981" distance={8} />

      <Float enabled={!isReducedMotion} speed={1.5} rotationIntensity={0.25} floatIntensity={0.5}>
        <group
          onPointerOver={() => {
            setIsHovered(true);
          }}
          onPointerOut={() => {
            setIsHovered(false);
          }}
        >
          <SecurityShieldMesh isReducedMotion={isReducedMotion} isHovered={isHovered} />
        </group>
      </Float>
    </>
  );
};

export default function SecurityCoreCanvas({ isActive, isReducedMotion }: SceneActivity) {
  return (
    <SceneCanvas
      isActive={isActive}
      isReducedMotion={isReducedMotion}
      camera={{ position: [0, 0, 4.8], fov: 42 }}
    >
      <SecuritySceneRoot isReducedMotion={isReducedMotion} />
    </SceneCanvas>
  );
}
