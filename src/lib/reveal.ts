/**
 * Tiny scroll/load reveal system built on IntersectionObserver + CSS
 * transitions (see the `.reveal-item` rules in global.css).
 *
 * This replaces GSAP + ScrollTrigger (~110 KiB of JavaScript plus a
 * persistent ticker and scroll listeners) with roughly one kilobyte of
 * code and no third-party dependency.
 */

export interface RevealOptions {
  /** Delay between successive items, in seconds. */
  stagger?: number;
  /** Starting vertical offset in pixels. */
  y?: number;
  /**
   * When true the element fades back out as it leaves the viewport in
   * either direction and plays again on re-entry. Otherwise the reveal
   * happens once and the observer detaches.
   */
  hideOnExit?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function prepare(el: HTMLElement, y: number, index: number, stagger: number) {
  el.classList.add("reveal-item");
  el.style.setProperty("--reveal-y", `${y}px`);
  el.style.setProperty("--reveal-delay", `${(index * stagger).toFixed(2)}s`);
}

function showInstantly(els: HTMLElement[]) {
  for (const el of els) {
    el.classList.add("reveal-item", "reveal-static");
  }
}

/**
 * Reveal above-the-fold elements once, staggered, right after the first
 * painted frame. Used for hero-style entrance animations.
 */
export function revealOnLoad(
  targets: ArrayLike<Element>,
  { stagger = 0.1, y = 24 }: RevealOptions = {},
) {
  const els = Array.from(targets) as HTMLElement[];
  if (!els.length || typeof window === "undefined") return;

  if (prefersReducedMotion()) {
    showInstantly(els);
    return;
  }

  els.forEach((el, index) => prepare(el, y, index, stagger));

  // Double rAF guarantees the hidden state is painted before we flip the
  // class, so the CSS transition actually runs.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const el of els) el.classList.add("is-revealed");
    });
  });
}

/**
 * Reveal elements as they scroll into view. With `hideOnExit` they fade
 * back out near either viewport edge and replay on re-entry.
 */
export function revealOnScroll(
  targets: ArrayLike<Element>,
  { stagger = 0.12, y = 28, hideOnExit = false }: RevealOptions = {},
) {
  const els = Array.from(targets) as HTMLElement[];
  if (!els.length || typeof window === "undefined") return;

  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    showInstantly(els);
    return;
  }

  els.forEach((el, index) => prepare(el, y, index, stagger));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-revealed", entry.isIntersecting);
        if (!hideOnExit && entry.isIntersecting) {
          observer.unobserve(entry.target);
          // Drop the transition scaffolding once revealed for good.
          (entry.target as HTMLElement).classList.remove("reveal-item");
          (entry.target as HTMLElement).classList.add("reveal-static");
        }
      }
    },
    {
      // Symmetric edge margins so hide-on-exit fades out while the element
      // is still partially visible, mirroring the old ScrollTrigger bounds.
      rootMargin: hideOnExit ? "-12% 0px -12% 0px" : "0px 0px -12% 0px",
      threshold: 0.01,
    },
  );

  els.forEach((el) => observer.observe(el));
}
