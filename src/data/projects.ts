export interface ProjectItem {
  id: string;
  year: string;
  status: "ACTIVE" | "COMPLETED" | "IN PROGRESS";
  title: string;
  description: string;
  tech: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  featured?: boolean;
}

export const projects: ProjectItem[] = [
  {
    id: "01",
    year: "2026",
    status: "ACTIVE",
    title: "VERTEX CANVAS",
    description:
      "A premium, high-performance workspace and productivity application designed for developers, creators, and teams to map workflows, track tasks, and collaborate in real-time.",
    tech: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"],
    githubUrl: "https://github.com/DevTechMike-Coder/KanbanTool",
    liveUrl: "https://vertexcanvas.vercel.app",
    featured: true,
  },
  {
    id: "02",
    year: "2025",
    status: "COMPLETED",
    title: "NEXT HUB ECOMMERCE",
    description:
      "A high-performance e-commerce platform built with Next.js, featuring a seamless shopping experience, reactive state pipelines, and robust backend integration.",
    tech: ["Next.js", "TypeScript", "React", "Tailwind CSS"],
    githubUrl: "https://github.com/DevTechMike-Coder/Ecommerce",
    liveUrl: "https://ecommerce-three-omega-39.vercel.app/",
    featured: true,
  },
  {
    id: "03",
    year: "2025",
    status: "COMPLETED",
    title: "DOCTOR APPOINTMENT SERVICE",
    description:
      "A doctor appointment booking platform: Next.js frontend on top of a Spring Boot REST API with JWT authentication, rate limiting, and PostgreSQL migrations.",
    tech: ["Next.js", "Spring Boot", "Java", "PostgreSQL", "JWT"],
    githubUrl:
      "https://github.com/DevTechMike-Coder/DoctorAppointmentService_Frontend",
    liveUrl: "https://doctor-appointment-service-frontend.vercel.app",
    featured: true,
  },
  {
    id: "04",
    year: "2025",
    status: "COMPLETED",
    title: "ZEROJS BLOG ENGINE",
    description:
      "A zero-JS markdown/MDX blog engine built on Astro with type-safe content collections, syntax highlighting, and RSS generation.",
    tech: ["Astro", "TypeScript", "MDX", "Tailwind CSS"],
    githubUrl: "https://github.com/DevTechMike-Coder/ZeroJs_Blog",
    liveUrl: "https://zero-js-blog.vercel.app",
    featured: false,
  },
  {
    id: "05",
    year: "2025",
    status: "IN PROGRESS",
    title: "DEVSEC SCANNER CLI",
    description:
      "A security command-line tool that inspects network services for open ports and vulnerable configurations, generating actionable hardening reports.",
    tech: ["Python", "Network Protocols", "Security Analysis"],
    githubUrl: null,
    liveUrl: null,
    featured: false,
  },
];
