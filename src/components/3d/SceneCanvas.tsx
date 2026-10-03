import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { CanvasProps } from "@react-three/fiber";
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

/**
 * Target rate for continuously animating scenes. The decorative motion does
 * not need display-rate rendering; capping at 30 fps halves the main-thread
 * and GPU cost — an even bigger win on 90/120 Hz displays — while remaining
 * visually smooth for slow ambient motion.
 */
export const CONTINUOUS_FPS = 30;

/**
 * Drives a demand-mode canvas at a capped rate. The "always" policy is
 * implemented as `frameloop="demand"` plus this driver: R3F only renders when
 * invalidated, so continuous animation runs at CONTINUOUS_FPS instead of the
 * display refresh rate.
 */
function FrameDriver({ fps }: { fps: number }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const minInterval = 1000 / fps;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last >= minInterval) {
        last = now;
        invalidate();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);

  return null;
}

/**
 * Minimal local replacement for drei's `PerformanceMonitor`. Watches an
 * exponential moving average of the frame rate and reports sustained declines
 * or recoveries a bounded number of times, so adaptive DPR cannot oscillate.
 * Thresholds are relative to the capped frame rate so the autotuner can still
 * recover while the driver limits fps.
 */
function DprAutotuner({
  fps,
  onDecline,
  onIncline,
}: {
  fps: number;
  onDecline: () => void;
  onIncline: () => void;
}) {
  const monitor = useRef({
    emaFps: fps,
    slowFor: 0,
    fastFor: 0,
    flipflops: 0,
    declined: false,
  });

  useFrame((_, delta) => {
    const m = monitor.current;
    if (m.flipflops > 3) return;

    m.emaFps += (1 / Math.max(delta, 0.0001) - m.emaFps) * 0.08;

    if (m.emaFps < fps * 0.72) {
      m.slowFor += delta;
      m.fastFor = 0;
    } else if (m.emaFps > fps * 0.88) {
      m.fastFor += delta;
      m.slowFor = 0;
    } else {
      m.slowFor = Math.max(0, m.slowFor - delta);
      m.fastFor = Math.max(0, m.fastFor - delta);
    }

    if (m.slowFor > 1) {
      m.slowFor = 0;
      m.flipflops += 1;
      m.declined = true;
      onDecline();
    } else if (m.fastFor > 2 && m.declined) {
      m.fastFor = 0;
      m.flipflops += 1;
      m.declined = false;
      onIncline();
    }
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

  // The reported policy keeps its three states ("always" = continuously
  // animating, "demand" = redraw on interaction/state change, "never" =
  // offscreen/hidden). The "always" state is implemented as a demand-mode
  // canvas driven by FrameDriver at a capped rate instead of R3F's native
  // "always", which would render at the full display refresh rate.
  const policy = !isActive ? "never" : isAnimating ? "always" : "demand";
  const frameloop = policy === "never" ? "never" : "demand";

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
        // R3F v9 renders `fallback` as DOM children of the <canvas> element,
        // shown only by browsers that cannot paint a canvas at all. It must
        // not carry role="status": while WebGL works the node still sits in
        // the accessibility tree and would falsely announce "3D unavailable".
        // Real WebGL failures are caught by the wrapper's capability gate and
        // SceneErrorBoundary, both rendering ScenePlaceholder with unavailable.
        fallback={<ScenePlaceholder label={placeholderLabel} />}
        data-frameloop={policy}
      >
        {/* The "always" policy renders through a capped driver instead of the
            display-rate loop. Don't interpret the capped pace as poor frame-rate
            performance: the autotuner thresholds track the same cap. */}
        {policy === "always" && <FrameDriver fps={CONTINUOUS_FPS} />}
        {isAnimating && (
          <DprAutotuner
            fps={CONTINUOUS_FPS}
            onDecline={() => setDpr(1)}
            onIncline={() => setDpr(maxDpr)}
          />
        )}
        {!hasRenderedFrame && <FirstFrame onReady={() => setHasRenderedFrame(true)} />}
        {children}
      </Canvas>
    </div>
  );
}
