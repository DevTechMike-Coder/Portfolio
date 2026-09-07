import React, { useEffect, useRef, useState } from "react";

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

  // The 3D tilt is a hover nicety. On touch devices there is no hover, and the
  // perspective/preserve-3d/translateZ stack can clip the card and swallow taps
  // on the links inside it — so render a plain, fully tappable card there.
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouch(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
    <div style={isTouch ? undefined : { perspective: 1000 }} className="w-full h-full">
      <div
        ref={cardRef}
        onMouseMove={isTouch ? undefined : handleMouseMove}
        onMouseLeave={isTouch ? undefined : handleMouseLeave}
        style={
          isTouch
            ? undefined
            : {
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.15s ease-out",
              }
        }
        className={`relative h-full transition-shadow duration-300 rounded-2xl overflow-hidden ${className}`}
      >
        {/* Dynamic Glare Reflection (hover devices only) */}
        {!isTouch && (
          <div
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-2xl"
            style={{
              background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(16, 185, 129, ${glarePosition.opacity}), transparent 70%)`,
            }}
          />
        )}
        <div
          style={isTouch ? undefined : { transform: "translateZ(16px)" }}
          className="relative z-10 h-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
