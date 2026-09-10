import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import type { Group } from "three";

interface DragOrbitProps {
  enabled?: boolean;
  autoRotate?: boolean;
  /** Matches three's OrbitControls units: 2.0 ≈ one orbit per 30 s. */
  autoRotateSpeed?: number;
  rotateSpeed?: number;
  dampingFactor?: number;
  enableDamping?: boolean;
  children: ReactNode;
}

/**
 * Minimal local replacement for drei's `OrbitControls`, specialized for the
 * tech network scene: rotate-only (no zoom/pan), damped dragging plus idle
 * auto-rotation. Rotates the scene graph instead of the camera so labels and
 * raycasting stay consistent. Roughly 2 KiB instead of the drei +
 * three-stdlib control stack.
 */
export function DragOrbit({
  enabled = true,
  autoRotate = false,
  autoRotateSpeed = 0.8,
  rotateSpeed = 0.6,
  dampingFactor = 0.05,
  enableDamping = true,
  children,
}: DragOrbitProps) {
  const groupRef = useRef<Group>(null);
  const { gl, invalidate } = useThree();

  // Live props, readable inside stable listeners registered once.
  const settings = useRef({ enabled, autoRotate, autoRotateSpeed, rotateSpeed });
  settings.current = { enabled, autoRotate, autoRotateSpeed, rotateSpeed };

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    targetYaw: 0,
    targetPitch: 0,
    lastInputAt: 0,
  });

  useEffect(() => {
    const element = gl.domElement;
    const s = state.current;

    const onPointerDown = (event: PointerEvent) => {
      if (!settings.current.enabled) return;
      s.dragging = true;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
      s.lastInputAt = performance.now();
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a nicety; dragging still works without it.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!s.dragging || !settings.current.enabled) return;
      const dx = event.clientX - s.lastX;
      const dy = event.clientY - s.lastY;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
      s.targetYaw += dx * 0.005 * settings.current.rotateSpeed;
      s.targetPitch = MathUtils.clamp(
        s.targetPitch + dy * 0.005 * settings.current.rotateSpeed,
        -Math.PI / 3,
        Math.PI / 3,
      );
      s.lastInputAt = performance.now();
      // The frame loop may be in demand mode (reduced motion / hover);
      // request a redraw so the drag is visible immediately.
      invalidate();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      s.lastInputAt = performance.now();
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // See above.
      }
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    // Parity with OrbitControls: drags on the canvas must not scroll the page.
    const previousTouchAction = element.style.touchAction;
    element.style.touchAction = "none";

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      element.style.touchAction = previousTouchAction;
    };
  }, [gl, invalidate]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || !settings.current.enabled) return;
    delta = Math.min(delta, 0.05);

    const s = state.current;
    const idleFor = performance.now() - s.lastInputAt;

    // Resume auto-rotation a beat after the last user interaction.
    if (settings.current.autoRotate && !s.dragging && idleFor > 1000) {
      s.targetYaw += delta * ((Math.PI * 2) / 60) * settings.current.autoRotateSpeed;
    }

    const dYaw = s.targetYaw - group.rotation.y;
    const dPitch = s.targetPitch - group.rotation.x;

    if (Math.abs(dYaw) < 0.0005 && Math.abs(dPitch) < 0.0005 && !settings.current.autoRotate) {
      group.rotation.y = s.targetYaw;
      group.rotation.x = s.targetPitch;
      return;
    }

    if (enableDamping) {
      // Framerate-independent equivalent of OrbitControls' per-frame damping.
      const lambda = -Math.log(1 - MathUtils.clamp(dampingFactor, 0.01, 0.5)) * 60;
      group.rotation.y = MathUtils.damp(group.rotation.y, s.targetYaw, lambda, delta);
      group.rotation.x = MathUtils.damp(group.rotation.x, s.targetPitch, lambda, delta);
    } else {
      group.rotation.y = s.targetYaw;
      group.rotation.x = s.targetPitch;
    }

    // Keep demand-mode frame loops drawing until the motion settles.
    invalidate();
  });

  return <group ref={groupRef}>{children}</group>;
}
