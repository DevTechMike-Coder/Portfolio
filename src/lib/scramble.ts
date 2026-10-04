/**
 * Cyber Decrypt Text Scrambler
 *
 * Cycles random cryptographic / hex / terminal glyphs before decrypting
 * into the final target string. Designed for cybersecurity / dev aesthetic.
 *
 * Zero third-party dependencies, accessible, cancellable, and respects
 * `prefers-reduced-motion`.
 */

export interface ScrambleOptions {
  /** Total animation duration in milliseconds. Defaults to 650ms. */
  duration?: number;
  /** Custom character set to draw random glyphs from. */
  glyphs?: string;
  /** Delay before scramble starts, in ms. */
  delay?: number;
}

const DEFAULT_GLYPHS = "0123456789ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>?~/";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// WeakMap prevents parallel running animations on the same DOM element
const runningAnimations = new WeakMap<HTMLElement, { cancel: () => void }>();

/**
 * Scrambles and decrypts an element's text content.
 */
export function scrambleText(
  el: HTMLElement,
  options: ScrambleOptions = {},
): Promise<void> {
  const {
    duration = 650,
    glyphs = DEFAULT_GLYPHS,
    delay = 0,
  } = options;

  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  // Cancel any currently running scramble on this element
  const current = runningAnimations.get(el);
  if (current) {
    current.cancel();
    runningAnimations.delete(el);
  }

  // Store the original text as source of truth
  const originalText = el.dataset.scrambleOriginal || el.textContent?.trim() || "";
  if (!el.dataset.scrambleOriginal) {
    el.dataset.scrambleOriginal = originalText;
    // Set aria-label to guarantee screen readers always hear original text
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", originalText);
    }
  }

  return new Promise((resolve) => {
    let animFrameId = 0;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const cancel = () => {
      cancelled = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timerId) clearTimeout(timerId);
      el.textContent = originalText;
      runningAnimations.delete(el);
      resolve();
    };

    runningAnimations.set(el, { cancel });

    timerId = setTimeout(() => {
      const startTime = performance.now();
      const length = originalText.length;

      const frame = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Calculate how many characters are fully resolved from left to right
        const resolvedChars = Math.floor(progress * length);

        let output = "";
        for (let i = 0; i < length; i++) {
          const char = originalText[i];
          if (char === " " || char === "\n") {
            output += char;
          } else if (i < resolvedChars) {
            output += char;
          } else {
            // Pick a random cyber glyph
            const randomGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
            output += randomGlyph;
          }
        }

        el.textContent = output;

        if (progress < 1) {
          animFrameId = requestAnimationFrame(frame);
        } else {
          el.textContent = originalText;
          runningAnimations.delete(el);
          resolve();
        }
      };

      animFrameId = requestAnimationFrame(frame);
    }, delay);
  });
}

/**
 * Automatically initializes text scrambling on elements with `[data-scramble]`.
 * Supports `data-scramble-on="hover"`, `"visible"`, or both (default).
 */
export function initAutoScramble() {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const elements = document.querySelectorAll<HTMLElement>("[data-scramble]");
  if (!elements.length) return;

  const visibleObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          void scrambleText(target, {
            duration: Number(target.dataset.scrambleDuration) || 700,
            delay: Number(target.dataset.scrambleDelay) || 100,
          });
          visibleObserver.unobserve(target);
        }
      }
    },
    { threshold: 0.1 }
  );

  elements.forEach((el) => {
    // Preserve initial text
    if (!el.dataset.scrambleOriginal) {
      el.dataset.scrambleOriginal = el.textContent?.trim() || "";
    }

    const trigger = el.dataset.scrambleOn || "both";

    if (trigger === "visible" || trigger === "both") {
      visibleObserver.observe(el);
    }

    if (trigger === "hover" || trigger === "both") {
      el.addEventListener("mouseenter", () => {
        void scrambleText(el, {
          duration: Number(el.dataset.scrambleDuration) || 500,
        });
      });
    }
  });
}
