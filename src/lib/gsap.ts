import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Shared easing curves so every animation across the site feels consistent. */
export const ease = {
  smooth: "power3.out",
  snappy: "power2.inOut",
  soft: "power1.out",
  bounce: "back.out(1.6)",
} as const;

/** Shared durations so every animation across the site feels consistent. */
export const duration = {
  fast: 0.4,
  base: 0.7,
  slow: 1,
} as const;

/**
 * Reveal a group of elements with a staggered fade + slide-up as they
 * scroll into view. Respects prefers-reduced-motion by setting elements
 * to their final state immediately.
 */
export function revealOnScroll(
  targets: string | Element | Element[] | NodeListOf<Element>,
  opts: {
    trigger?: Element | string;
    start?: string;
    end?: string;
    stagger?: number;
    y?: number;
    once?: boolean;
    /**
     * When true, the element animates back out (fade + slide) as soon as it
     * leaves the viewport in EITHER direction — scrolled past below, or
     * scrolled away above — then plays again on re-entry. Takes priority
     * over `once`.
     */
    hideOnExit?: boolean;
  } = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReduced) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return;
  }

  const toggleActions = opts.hideOnExit
    ? "play reverse play reverse"
    : opts.once === false
      ? "play none none reverse"
      : "play none none none";

  gsap.fromTo(
    targets,
    { opacity: 0, y: opts.y ?? 28 },
    {
      opacity: 1,
      y: 0,
      duration: duration.base,
      ease: ease.smooth,
      stagger: opts.stagger ?? 0.12,
      scrollTrigger: {
        trigger: opts.trigger ?? targets,
        start: opts.start ?? "top 85%",
        // Symmetric exit threshold so the fade-out is actually visible
        // instead of firing once the element is already off-screen.
        end: opts.hideOnExit ? opts.end ?? "bottom 15%" : opts.end,
        toggleActions,
        invalidateOnRefresh: true,
      },
    },
  );
}

export { gsap, ScrollTrigger };

