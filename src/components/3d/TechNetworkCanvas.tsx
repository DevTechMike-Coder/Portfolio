import React, { useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { SceneActivity } from "./LazyCanvasWrapper";
import { SceneCanvas } from "./SceneCanvas";
import { TECH_ITEMS } from "./techItems";
import type { TechItem } from "./techItems";

// Single Technology Node in 3D Space
const TechNode: React.FC<{
  tech: TechItem;
  position: [number, number, number];
  isHovered: boolean;
  onHover: (id: string | null) => void;
  isReducedMotion: boolean;
}> = ({ tech, position, isHovered, onHover, isReducedMotion }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetZ = isHovered ? position[2] + 0.5 : position[2];
    const distance = targetZ - meshRef.current.position.z;

    if (isReducedMotion || Math.abs(distance) < 0.001) {
      meshRef.current.position.z = targetZ;
      return;
    }

    meshRef.current.position.z = THREE.MathUtils.damp(
      meshRef.current.position.z,
      targetZ,
      6,
      Math.min(delta, 0.05)
    );
    // Continue only until this hover transition settles, not forever per node.
    invalidate();
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(tech.id);
        invalidate();
      }}
      onPointerOut={() => {
        onHover(null);
        invalidate();
      }}
    >
      {/* Node Sphere */}
      <mesh scale={isHovered ? 0.38 / 0.3 : 1}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={isHovered ? tech.color : "#1e293b"}
          emissive={tech.color}
          emissiveIntensity={isHovered ? 1.2 : 0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Halo on Hover */}
      {isHovered && (
        <mesh>
          <sphereGeometry args={[0.48, 16, 16]} />
          <meshBasicMaterial
            color={tech.color}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Compact Monospace Label */}
      <Html
        position={[0, -0.45, 0]}
        center
        distanceFactor={9}
        className="pointer-events-none select-none transition-transform duration-200"
      >
        <div
          data-tech-node={tech.id}
          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
            isHovered
              ? "bg-zinc-950 text-emerald-400 border border-emerald-500/50 shadow-lg scale-110"
              : "bg-zinc-950/80 text-zinc-300 border border-white/10"
          }`}
        >
          {tech.name}
        </div>
      </Html>
    </group>
  );
};

// Network Connection Lines connecting Central Core to Nodes
const NetworkLines: React.FC<{
  nodePositions: [number, number, number][];
  hoveredIndex: number | null;
}> = ({ nodePositions, hoveredIndex }) => {
  const positions = useMemo(
    () => new Float32Array(nodePositions.flatMap((pos) => [0, 0, 0, ...pos])),
    [nodePositions]
  );

  return (
    <lineSegments>
      {/* Declarative geometry is disposed by R3F when this canvas unmounts. */}
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={hoveredIndex !== null ? "#10b981" : "#334155"}
        transparent
        opacity={hoveredIndex !== null ? 0.45 : 0.25}
      />
    </lineSegments>
  );
};

// Tech Ecosystem Canvas Scene
interface TechNetworkCanvasProps extends SceneActivity {
  onSelect: (tech: TechItem) => void;
}

export default function TechNetworkCanvas({
  onSelect,
  isActive,
  isReducedMotion,
}: TechNetworkCanvasProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Distribute 14 nodes in a spherical fibonacci cloud around center
  const nodePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = TECH_ITEMS.length;
    const radius = 3.2;

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.75; // flatten slightly vertically
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positions.push([x, y, z]);
    }
    return positions;
  }, []);

  const handleHover = (id: string | null) => {
    setHoveredId(id);
    if (id) {
      const found = TECH_ITEMS.find((t) => t.id === id);
      if (found) onSelect(found);
    }
  };

  const hoveredIndex = hoveredId
    ? TECH_ITEMS.findIndex((t) => t.id === hoveredId)
    : null;

  return (
    <SceneCanvas
      isActive={isActive}
      isReducedMotion={isReducedMotion}
      animate={hoveredId === null}
      placeholderLabel="MY_STACK"
      camera={{ position: [0, 0, 7.2], fov: 45 }}
    >
      <ambientLight intensity={0.7} color="#0f172a" />
      <pointLight position={[0, 0, 0]} intensity={3} color="#10b981" distance={8} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#06b6d4" />
      <pointLight position={[-5, -5, -5]} intensity={1.5} color="#8b5cf6" />

      {/* OrbitControls for user exploration */}
      <OrbitControls
        enabled={isActive}
        enableDamping={!isReducedMotion}
        enableZoom={false}
        enablePan={false}
        autoRotate={isActive && !isReducedMotion && hoveredId === null}
        autoRotateSpeed={0.8}
        rotateSpeed={0.6}
        dampingFactor={0.05}
      />

      <Float
        enabled={isActive && !isReducedMotion && hoveredId === null}
        speed={1}
        rotationIntensity={0.2}
        floatIntensity={0.3}
      >
        {/* Central Core: "MY STACK" */}
        <group position={[0, 0, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.85, 1]} />
            <meshStandardMaterial
              color="#042f2e"
              emissive="#10b981"
              emissiveIntensity={0.6}
              roughness={0.3}
              wireframe={false}
            />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.95, 0]} />
            <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.4} />
          </mesh>
          <Html center distanceFactor={8} className="pointer-events-none select-none">
            <div className="bg-zinc-950/90 text-emerald-400 font-mono text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap">
              MY_STACK
            </div>
          </Html>
        </group>

        {/* Network Connection Lines */}
        <NetworkLines
          nodePositions={nodePositions}
          hoveredIndex={hoveredIndex !== -1 ? hoveredIndex : null}
        />

        {/* Orbiting Technology Nodes */}
        {TECH_ITEMS.map((tech, index) => (
          <TechNode
            key={tech.id}
            tech={tech}
            position={nodePositions[index]}
            isHovered={hoveredId === tech.id}
            onHover={handleHover}
            isReducedMotion={isReducedMotion}
          />
        ))}
      </Float>
    </SceneCanvas>
  );
}
