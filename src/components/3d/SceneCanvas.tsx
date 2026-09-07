import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { CanvasProps } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { SceneActivity } from "./LazyCanvasWrapper";
import { ScenePlaceholder } from "./ScenePlaceholder";

interface SceneCanvasProps extends SceneActivity {
  children: ReactNode;
  camera: CanvasProps["camera"];
  /** False while inspecting a technology node; interactions can still redraw. */
  animate?: boolean;
  placeholderLabel?: string;
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    // React commits this update after the synchronous WebGL render completes.
    onReady();
  });
  return null;
}

/** Shared render policy. Only dynamically imported canvas modules import this file. */
export function SceneCanvas({
  children,
  camera,
  isActive,
  isReducedMotion,
  animate = true,
  placeholderLabel = "SECURITY_CORE",
}: SceneCanvasProps) {
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const [dpr, setDpr] = useState(1);
  const [maxDpr, setMaxDpr] = useState(1);
  const isAnimating = isActive && !isReducedMotion && animate;

  // Continuous animation really is continuous. Reserve demand mode for static
  // scenes/interactions, and prevent even invalidated draws while offscreen.
  const frameloop = !isActive ? "never" : isAnimating ? "always" : "demand";

  useEffect(() => {
    const mobile = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    const updateLimit = () => {
      const limit = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1 : 1.5);
      setMaxDpr(limit);
      setDpr((current) => Math.min(current, limit));
    };

    updateLimit();
    mobile.addEventListener("change", updateLimit);
    window.addEventListener("resize", updateLimit, { passive: true });
    return () => {
      mobile.removeEventListener("change", updateLimit);
      window.removeEventListener("resize", updateLimit);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      {!hasRenderedFrame && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <ScenePlaceholder label={placeholderLabel} />
        </div>
      )}
      <Canvas
        frameloop={frameloop}
        camera={camera}
        dpr={Math.min(dpr, maxDpr)}
        gl={{
          antialias: false,
          alpha: true,
          // "high-performance" asks for the discrete GPU on every canvas; on mobile
          // that exhausts the context pool and triggers "Context Lost". Default lets
          // the browser share the integrated GPU across the page's multiple canvases.
          powerPreference: "default",
        }}
        style={{ width: "100%", height: "100%" }}
        fallback={<ScenePlaceholder label={placeholderLabel} unavailable />}
        data-frameloop={frameloop}
      >
        {/* Don't interpret a paused/on-demand canvas as poor frame-rate performance. */}
        {isAnimating && (
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => setDpr(1)}
            onIncline={() => setDpr(maxDpr)}
            onFallback={() => setDpr(1)}
          />
        )}
        {!hasRenderedFrame && <FirstFrame onReady={() => setHasRenderedFrame(true)} />}
        {children}
      </Canvas>
    </div>
  );
}
