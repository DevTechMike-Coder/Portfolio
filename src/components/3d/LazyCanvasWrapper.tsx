import React, { useEffect, useRef, useState } from "react";

interface LazyCanvasWrapperProps {
  children: (props: { isReducedMotion: boolean }) => React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  persistent?: boolean;
}

export const LazyCanvasWrapper: React.FC<LazyCanvasWrapperProps> = ({
  children,
  fallback,
  className = "w-full h-full relative",
  rootMargin = "100px",
  persistent = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(persistent);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Check WebGL capability
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver for strict mount/unmount lifecycle to protect WebGL contexts
  useEffect(() => {
    if (persistent) {
      setIsInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // True unmount when out of view to release WebGL context
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin,
        threshold: 0.05,
      }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, persistent]);

  return (
    <div ref={containerRef} className={className}>
      {!hasWebGL ? (
        fallback || (
          <div className="w-full h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs">
                3D
              </div>
              <p className="text-zinc-400 text-xs font-mono">
                WebGL unavailable — standard view active
              </p>
            </div>
          </div>
        )
      ) : isInView ? (
        children({ isReducedMotion })
      ) : (
        fallback || (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <div className="w-12 h-12 rounded-full border border-emerald-500/20 animate-pulse"></div>
          </div>
        )
      )}
    </div>
  );
};
