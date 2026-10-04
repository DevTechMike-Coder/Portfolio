/**
 * Smooth Number Counter Animation
 *
 * Counts up numbers with an ease-out exponential curve.
 * Fully accessible, lightweight, and respects `prefers-reduced-motion`.
 */

export interface CounterOptions {
  duration?: number;
  format?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Easing function: easeOutExpo for a punchy start and smooth deceleration
 */
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Smoothly animates a numeric element from start (or 0) to target.
 */
export function animateCounter(
  el: HTMLElement,
  targetValue: number,
  options: CounterOptions = {},
): Promise<void> {
  const { duration = 1200, format = true } = options;

  if (prefersReducedMotion()) {
    el.textContent = format ? targetValue.toLocaleString() : String(targetValue);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutExpo(progress);

      const current = Math.round(easedProgress * targetValue);
      el.textContent = format ? current.toLocaleString() : String(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = format ? targetValue.toLocaleString() : String(targetValue);
        resolve();
      }
    };

    requestAnimationFrame(frame);
  });
}

/**
 * Automatically initializes counter animation on elements with `[data-counter-target]`.
 */
export function initCounters() {
  if (typeof window === "undefined") return;

  const elements = document.querySelectorAll<HTMLElement>("[data-counter-target]");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const target = Number(el.dataset.counterTarget);
          const duration = Number(el.dataset.counterDuration) || 1200;
          const format = el.dataset.counterFormat !== "false";

          if (!Number.isNaN(target)) {
            void animateCounter(el, target, { duration, format });
          }
          observer.unobserve(el);
        }
      }
    },
    { threshold: 0.2 }
  );

  elements.forEach((el) => observer.observe(el));
}
