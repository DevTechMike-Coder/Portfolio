import type { SVGProps } from "react";

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* The diagonal line */}
      <line x1="7" y1="17" x2="17" y2="7" />
      {/* The arrowhead */}
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}