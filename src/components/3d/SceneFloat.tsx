import { useRef } from "react";
import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface SceneFloatProps {
  enabled?: boolean;
  speed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  children: ReactNode;
}

/**
 * Minimal local replacement for drei's `Float` (~3 KiB here versus pulling
 * in the drei package graph). Applies a gentle sine drift to a wrapper
 * group and eases motion on/off instead of snapping when `enabled` toggles.
 */
export function SceneFloat({
  enabled = true,
  speed = 1,
  rotationIntensity = 1,
  floatIntensity = 1,
  children,
}: SceneFloatProps) {
  const groupRef = useRef<Group>(null);
  const clock = useRef(0);
  const blend = useRef(1);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    delta = Math.min(delta, 0.05);

    blend.current += ((enabled ? 1 : 0) - blend.current) * Math.min(1, delta * 4);
    const blendAmount = blend.current;

    if (blendAmount < 0.002 && !enabled) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      return;
    }

    clock.current += delta * speed * blendAmount;
    const t = clock.current;

    group.position.set(
      Math.sin(t * 0.8) * 0.08 * floatIntensity * blendAmount,
      Math.sin(t) * 0.12 * floatIntensity * blendAmount,
      Math.cos(t * 0.9) * 0.06 * floatIntensity * blendAmount,
    );
    group.rotation.set(
      Math.sin(t * 0.9) * 0.18 * rotationIntensity * blendAmount,
      Math.sin(t * 0.7) * 0.18 * rotationIntensity * blendAmount,
      Math.cos(t * 0.8) * 0.12 * rotationIntensity * blendAmount,
    );
  });

  return <group ref={groupRef}>{children}</group>;
}
