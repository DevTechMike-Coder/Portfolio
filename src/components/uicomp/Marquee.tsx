import React, { type ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  speed?: number; // duration in seconds
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  direction = "left",
  pauseOnHover = true,
  speed = 20,
  className = "",
}) => {
  return (
    <div className={`overflow-hidden group ${className}`}>
      <div
        className={`flex w-max animate-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationDuration: `${speed}s`,
        }}
      >
        <div className="flex gap-4 pr-4">{children}</div>
        <div className="flex gap-4 pr-4" aria-hidden="true">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};
