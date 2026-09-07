import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls, PerformanceMonitor, Html } from "@react-three/drei";
import * as THREE from "three";
import { LazyCanvasWrapper } from "./LazyCanvasWrapper";

export interface TechItem {
  id: string;
  name: string;
  category: "Frontend" | "Backend" | "Database" | "DevOps & Tools";
  description: string;
  color: string;
}

export const TECH_ITEMS: TechItem[] = [
  { id: "ts", name: "TypeScript", category: "Frontend", description: "Static typing for scalable, bug-resistant architectures.", color: "#3178c6" },
  { id: "js", name: "JavaScript", category: "Frontend", description: "Modern ES6+ standard for dynamic web interactions.", color: "#f7df1e" },
  { id: "react", name: "React", category: "Frontend", description: "Component-driven reactive UIs with concurrent rendering.", color: "#61dafb" },
  { id: "next", name: "Next.js", category: "Frontend", description: "Production SSR, ISR, and full-stack React framework.", color: "#ffffff" },
  { id: "astro", name: "Astro", category: "Frontend", description: "Zero-JS island architecture for blazing fast web performance.", color: "#ff5d01" },
  { id: "tailwind", name: "Tailwind CSS", category: "Frontend", description: "Utility-first design system with minimal bundle footprint.", color: "#38bdf8" },
  { id: "node", name: "Node.js", category: "Backend", description: "High-throughput asynchronous server-side runtime.", color: "#22c55e" },
  { id: "express", name: "Express", category: "Backend", description: "Minimalist REST APIs and hardened security middleware.", color: "#94a3b8" },
  { id: "prisma", name: "Prisma", category: "Database", description: "Type-safe ORM for resilient data modeling and migrations.", color: "#5a67d8" },
  { id: "postgres", name: "PostgreSQL", category: "Database", description: "Reliable relational database with advanced ACID compliance.", color: "#336791" },
  { id: "mongodb", name: "MongoDB", category: "Database", description: "Document database for flexible JSON schemas and scaling.", color: "#47a248" },
  { id: "redis", name: "Redis", category: "Database", description: "In-memory caching, rate-limiting, and session management.", color: "#dc2626" },
  { id: "git", name: "Git", category: "DevOps & Tools", description: "Distributed version control and secure branch management.", color: "#f05032" },
  { id: "supabase", name: "Supabase", category: "Backend", description: "Postgres-backed BaaS with realtime auth and storage.", color: "#3ecf8e" },
];

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
    if (!meshRef.current || isReducedMotion) return;
    const targetZ = isHovered ? position[2] + 0.5 : position[2];
    meshRef.current.position.z = THREE.MathUtils.damp(
      meshRef.current.position.z,
      targetZ,
      6,
      delta
    );
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
      <mesh>
        <sphereGeometry args={[isHovered ? 0.38 : 0.3, 24, 24]} />
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
  const linesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    nodePositions.forEach((pos) => {
      // Connect from origin to each node
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodePositions]);

  return (
    <lineSegments geometry={linesGeometry}>
      <lineBasicMaterial
        color={hoveredIndex !== null ? "#10b981" : "#334155"}
        transparent
        opacity={hoveredIndex !== null ? 0.45 : 0.25}
      />
    </lineSegments>
  );
};

// Tech Ecosystem Canvas Scene
const TechScene: React.FC<{
  selectedTech: TechItem | null;
  setSelectedTech: (tech: TechItem | null) => void;
  isReducedMotion: boolean;
}> = ({ selectedTech, setSelectedTech, isReducedMotion }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { invalidate } = useThree();

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
      const found = TECH_ITEMS.find((t) => t.id === id) || null;
      setSelectedTech(found);
    }
  };

  const hoveredIndex = hoveredId
    ? TECH_ITEMS.findIndex((t) => t.id === hoveredId)
    : null;

  return (
    <>
      <ambientLight intensity={0.7} color="#0f172a" />
      <pointLight position={[0, 0, 0]} intensity={3} color="#10b981" distance={8} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#06b6d4" />
      <pointLight position={[-5, -5, -5]} intensity={1.5} color="#8b5cf6" />

      {/* OrbitControls for user exploration */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!isReducedMotion && hoveredId === null}
        autoRotateSpeed={0.8}
        rotateSpeed={0.6}
        dampingFactor={0.05}
      />

      <Float speed={isReducedMotion ? 0 : 1} rotationIntensity={0.2} floatIntensity={0.3}>
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
    </>
  );
};

export default function TechNetworkScene() {
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(TECH_ITEMS[0]);
  const [dpr, setDpr] = useState(1.5);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Canvas Island */}
      <div className="w-full h-[400px] sm:h-[480px] lg:h-[540px] relative">
        <LazyCanvasWrapper persistent={false} className="w-full h-full">
          {({ isReducedMotion }) => (
            <Canvas
              frameloop="demand"
              camera={{ position: [0, 0, 7.2], fov: 45 }}
              dpr={dpr}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              style={{ width: "100%", height: "100%" }}
            >
              <PerformanceMonitor
                onDecline={() => setDpr(1)}
                onIncline={() => setDpr(Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1.5))}
              />
              <TechScene
                selectedTech={selectedTech}
                setSelectedTech={setSelectedTech}
                isReducedMotion={isReducedMotion}
              />
            </Canvas>
          )}
        </LazyCanvasWrapper>

        {/* Helper instruction overlay */}
        <div className="absolute top-4 right-4 pointer-events-none bg-zinc-950/80 border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono text-zinc-400 backdrop-blur-md hidden sm:block">
          Click + Drag to rotate • Hover nodes
        </div>
      </div>

      {/* Active Technology Inspection Card */}
      {selectedTech && (
        <div className="mt-4 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 backdrop-blur-md flex items-center justify-between gap-4 shadow-xl shadow-emerald-500/5 transition-all">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                {selectedTech.name}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedTech.category}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {selectedTech.description}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex shrink-0 items-center justify-center font-mono font-bold text-sm border shadow-inner"
            style={{
              borderColor: `${selectedTech.color}55`,
              backgroundColor: `${selectedTech.color}15`,
              color: selectedTech.color === "#ffffff" ? "#10b981" : selectedTech.color,
            }}
          >
            {selectedTech.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
