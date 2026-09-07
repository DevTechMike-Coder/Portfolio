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
