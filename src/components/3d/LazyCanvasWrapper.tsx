import React, { Component, useEffect, useRef, useState } from "react";
import { ScenePlaceholder } from "./ScenePlaceholder";

export interface SceneActivity {
  isActive: boolean;
  isReducedMotion: boolean;
}

interface LazyCanvasWrapperProps {
  children: (props: SceneActivity) => React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  /** Preserve a mounted canvas, but never keep an offscreen animation running. */
  persistent?: boolean;
  /**
   * When to allow the heavy canvas chunk to load.
   * - "visible" (default): as soon as the wrapper is near the viewport.
   * - "interaction": only after the visitor's first engagement signal
   *   (pointer, wheel, touch, keyboard, focus, or scroll) — with a fallback
   *   timer so completely idle visitors still see the scene eventually.
   *   Intended for above-the-fold scenes whose chunk would otherwise
   *   download and evaluate during initial page load.
   */
  engageOn?: "visible" | "interaction";
}

/** Signals that count as engagement for `engageOn="interaction"`. */
const ENGAGEMENT_EVENTS: Array<[string, AddEventListenerOptions]> = [
  ["pointermove", { passive: true }],
  ["pointerdown", { passive: true }],
  ["wheel", { passive: true }],
  ["touchstart", { passive: true }],
  ["keydown", { passive: true }],
  ["focusin", { passive: true }],
  ["scroll", { passive: true, capture: true }],
];

/** Idle visitors still get the scene after this delay. */
const ENGAGEMENT_FALLBACK_MS = 15_000;

/**
 * Opt out of the engagement gate — used by the automated scene tests, which
 * drive the page programmatically and would otherwise race the hydration.
 */
function engagementForced() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("engageNow");
  } catch {
    return false;
  }
}

let webGLSupport: boolean | undefined;

function supportsWebGL2() {
  if (webGLSupport !== undefined) return webGLSupport;

  // Current Three.js requires WebGL2. Release this temporary context rather than
  // leaving a capability-test context allocated for every island.
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webGLSupport = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webGLSupport = false;
  }

  return webGLSupport;
}

class SceneErrorBoundary extends Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function LazyCanvasWrapper({
  children,
  fallback = <ScenePlaceholder />,
  className = "relative h-full w-full",
  persistent = false,
  engageOn = "visible",
}: LazyCanvasWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // SSR and the first hydration render deliberately contain only the fallback.
  const [isInView, setIsInView] = useState(false);
  const [hasBeenActive, setHasBeenActive] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(true);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [isEngaged, setIsEngaged] = useState(engageOn === "visible" || engagementForced());
  const isActive = isEngaged && isInView && isPageVisible;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setIsReducedMotion(mediaQuery.matches);
    const updateVisibility = () => setIsPageVisible(!document.hidden);

    updateMotion();
    updateVisibility();
    mediaQuery.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      mediaQuery.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  // Engagement gate: keep the heavy canvas chunk off the network (and off the
  // main thread) until the visitor shows intent, then load it immediately.
  useEffect(() => {
    if (engageOn === "visible" || isEngaged) return;

    const engage = () => setIsEngaged(true);
    for (const [type, options] of ENGAGEMENT_EVENTS) {
      window.addEventListener(type, engage, { ...options, once: true });
    }
    const fallbackTimer = window.setTimeout(engage, ENGAGEMENT_FALLBACK_MS);

    return () => {
      for (const [type, options] of ENGAGEMENT_EVENTS) {
        window.removeEventListener(type, engage, options);
      }
      window.clearTimeout(fallbackTimer);
    };
  }, [engageOn, isEngaged]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting && entry.intersectionRatio > 0);
    }, { threshold: 0.01 });

    // Always observe, including persistent canvases. Astro's client:visible may
    // preload an island nearby; GPU work only starts in the actual viewport.
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    setHasBeenActive(true);
    setHasWebGL(supportsWebGL2());
  }, [isActive]);

  const shouldMount = hasWebGL === true && (isActive || (persistent && hasBeenActive));

  return (
    <div ref={containerRef} className={className}>
      {hasWebGL === false ? (
        <ScenePlaceholder unavailable />
      ) : shouldMount ? (
        <SceneErrorBoundary fallback={<ScenePlaceholder unavailable />}>
          {children({ isActive, isReducedMotion })}
        </SceneErrorBoundary>
      ) : fallback}
    </div>
  );
}
