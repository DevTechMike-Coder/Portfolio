import { lazy, Suspense } from "react";
import { LazyCanvasWrapper } from "./LazyCanvasWrapper";
import { ScenePlaceholder } from "./ScenePlaceholder";

const SecurityCoreCanvas = lazy(() => import("./SecurityCoreCanvas"));

export default function SecurityCoreScene() {
  return (
    <LazyCanvasWrapper className="h-[320px] w-full sm:h-[400px] lg:h-[440px]">
      {(activity) => (
        <Suspense fallback={<ScenePlaceholder />}>
          <SecurityCoreCanvas {...activity} />
        </Suspense>
      )}
    </LazyCanvasWrapper>
  );
}
