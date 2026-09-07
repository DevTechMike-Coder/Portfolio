import { lazy, Suspense } from "react";
import { LazyCanvasWrapper } from "./LazyCanvasWrapper";
import { ScenePlaceholder } from "./ScenePlaceholder";

// This module must stay free of static Three.js/R3F/Drei imports. Astro hydrates
// this small shell when idle; the 3D chunk is requested only when it is visible.
const HeroCanvas = lazy(() => import("./HeroCanvas"));

export default function HeroScene() {
  return (
    <LazyCanvasWrapper persistent className="h-[400px] w-full sm:h-[480px] lg:h-[540px]">
      {(activity) => (
        <Suspense fallback={<ScenePlaceholder />}>
          <HeroCanvas {...activity} />
        </Suspense>
      )}
    </LazyCanvasWrapper>
  );
}
