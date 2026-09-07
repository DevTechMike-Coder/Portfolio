import React, { useRef, useState } from "react";

interface ProjectTiltCardProps {
  children: React.ReactNode;
  className?: string;
  isFeatured?: boolean;
}

export const ProjectTiltCard: React.FC<ProjectTiltCardProps> = ({
  children,
  className = "",
  isFeatured = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const maxRotation = isFeatured ? 5 : 8;
    const rX = -((y - centerY) / centerY) * maxRotation;
    const rY = ((x - centerX) / centerX) * maxRotation;

    setRotateX(rX);
    setRotateY(rY);

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setGlarePosition({ x: percentX, y: percentY, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="w-full h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease-out",
        }}
        className={`relative h-full transition-shadow duration-300 rounded-2xl overflow-hidden ${className}`}
      >
        {/* Dynamic Glare Reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-2xl"
          style={{
            background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(16, 185, 129, ${glarePosition.opacity}), transparent 70%)`,
          }}
        />
        <div style={{ transform: "translateZ(16px)" }} className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
