export type ClientWorkKind = "CLIENT" | "COLLAB";

export interface ClientWorkItem {
  id: string;
  kind: ClientWorkKind;
  title: string;
  /** Who the work was for (client) or who it was built with (collab). */
  client: string;
  /** Your role on the engagement. */
  role: string;
  summary: string;
  /** Concrete deliverables / engineering decisions. Keep each to one line. */
  highlights: string[];
  tech: string[];
  monogram: string;
  /** Tailwind gradient classes for the preview panel. */
  gradient: string;
  liveUrl?: string;
  githubUrl?: string;
  /** Collab only: people you built it with. */
  collaborators?: { name: string; url?: string }[];
}

export const clientWork: ClientWorkItem[] = [
  {
    id: "01",
    kind: "CLIENT",
    title: "E&A Atelier",
    client: "E&A Atelier",
    role: "Full-Stack Developer",
    summary:
      "Editorial e-commerce platform for a slow-luxury crochet studio: multi-currency storefront, Paystack checkout, bespoke commission intake, and a private admin studio for managing the catalog and orders.",
    highlights: [
      "Paystack checkout with server-side verification and webhook handling",
      "NGN / USD / EUR / GBP currency switching with FX snapshot stored per order",
      "Admin studio: products, orders ledger, patrons, and commissions",
      "Google OAuth sign-in and Server Actions for auth, orders, and inquiries",
    ],
    tech: ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS", "Paystack"],
    monogram: "EA",
    gradient: "from-amber-400 via-orange-500 to-rose-600",
    liveUrl: "https://eaatelier.vercel.app/",
    githubUrl: "https://github.com/DevTechMike-Coder/E-A_Atelier",
  },
];
