import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { Group, PerspectiveCamera } from "three";

interface HtmlLabelProps {
  /** Position in the local coordinate space of the surrounding scene graph. */
  position?: [number, number, number];
  /**
   * Distance-based scaling, matching drei's `distanceFactor` semantics:
   * scale = distanceFactor / (2 * tan(fov / 2) * distanceToCamera).
   */
  distanceFactor?: number;
  className?: string;
  children: ReactNode;
}

// Shared scratch vectors; frame callbacks run sequentially on one thread.
const worldPosition = new Vector3();
const projected = new Vector3();

/**
 * Minimal local replacement for drei's `Html` (centered, distance-scaled).
 * Renders DOM children into an overlay div that tracks a 3D anchor point,
 * without importing the drei package.
 */
export function HtmlLabel({ position = [0, 0, 0], distanceFactor, className, children }: HtmlLabelProps) {
  const { camera, size, gl } = useThree();

  // Invisible scene-graph anchor so ancestor transforms (floating, drag
  // rotation, node positions) are picked up through the world matrix.
  const anchorRef = useRef<Group>(null);

  const overlay = useMemo(() => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.left = "0";
    el.style.pointerEvents = "none";
    el.style.willChange = "transform";
    el.style.zIndex = "1";
    return el;
  }, []);

  const parent = gl.domElement.parentElement;

  useEffect(() => {
    parent?.appendChild(overlay);
    return () => overlay.remove();
  }, [overlay, parent]);

  useFrame(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    anchor.getWorldPosition(worldPosition);
    projected.copy(worldPosition).project(camera);

    // Behind the camera — hide instead of mirroring across the screen.
    if (projected.z > 1) {
      if (overlay.style.display !== "none") overlay.style.display = "none";
      return;
    }
    if (overlay.style.display === "none") overlay.style.display = "";

    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;

    let scale = 1;
    if (distanceFactor !== undefined && (camera as PerspectiveCamera).isPerspectiveCamera) {
      const perspective = camera as PerspectiveCamera;
      const distance = camera.position.distanceTo(worldPosition);
      scale = distanceFactor / (2 * Math.tan(MathUtils.degToRad(perspective.fov) / 2) * distance);
    }

    overlay.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) scale(${scale.toFixed(4)})`;
  });

  return (
    <>
      <group ref={anchorRef} position={position} />
      {createPortal(<div className={className}>{children}</div>, overlay)}
    </>
  );
}
