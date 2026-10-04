/**
 * Magnetic Button Effect
 *
 * Pulls buttons subtly toward the fine cursor for a tactile feel.
 * Auto-resets on pointer leave, uses requestAnimationFrame for 60fps smoothing,
 * and completely disables on touch / reduced-motion.
 */

export function initMagneticButtons() {
  if (typeof window === "undefined") return;

  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!isFinePointer || prefersReduced) return;

  const buttons = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    const strength = Number(btn.dataset.magneticStrength) || 0.28;
    let animId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovering = false;

    const render = () => {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      btn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

      if (isHovering || Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
        animId = requestAnimationFrame(render);
      } else {
        btn.style.transform = "";
        animId = 0;
      }
    };

    btn.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      isHovering = true;
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      targetX = (e.clientX - centerX) * strength;
      targetY = (e.clientY - centerY) * strength;

      if (!animId) animId = requestAnimationFrame(render);
    });

    btn.addEventListener("pointerleave", () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
    });
  });
}
