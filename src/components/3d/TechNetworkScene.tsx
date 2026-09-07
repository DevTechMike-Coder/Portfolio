import { lazy, Suspense, useState } from "react";
import { LazyCanvasWrapper } from "./LazyCanvasWrapper";
import { ScenePlaceholder } from "./ScenePlaceholder";
import { TECH_ITEMS } from "./techItems";
import type { TechItem } from "./techItems";

export { TECH_ITEMS } from "./techItems";
export type { TechItem } from "./techItems";

const TechNetworkCanvas = lazy(() => import("./TechNetworkCanvas"));

export default function TechNetworkScene() {
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(TECH_ITEMS[0]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Canvas Island */}
      <div className="w-full h-[400px] sm:h-[480px] lg:h-[540px] relative">
        <LazyCanvasWrapper className="h-full w-full" fallback={<ScenePlaceholder label="MY_STACK" />}>
          {(activity) => (
            <Suspense fallback={<ScenePlaceholder label="MY_STACK" />}>
              <TechNetworkCanvas {...activity} onSelect={setSelectedTech} />
            </Suspense>
          )}
        </LazyCanvasWrapper>

        {/* Helper instruction overlay */}
        <div className="absolute top-4 right-4 pointer-events-none bg-zinc-950/80 border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono text-zinc-400 backdrop-blur-md hidden sm:block">
          Click + Drag to rotate • Hover nodes
        </div>
      </div>

      {/* Active Technology Inspection Card */}
      {selectedTech && (
        <div data-tech-inspector aria-live="polite" className="mt-4 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 backdrop-blur-md flex items-center justify-between gap-4 shadow-xl shadow-emerald-500/5 transition-all">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                {selectedTech.name}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedTech.category}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {selectedTech.description}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex shrink-0 items-center justify-center font-mono font-bold text-sm border shadow-inner"
            style={{
              borderColor: `${selectedTech.color}55`,
              backgroundColor: `${selectedTech.color}15`,
              color: selectedTech.color === "#ffffff" ? "#10b981" : selectedTech.color,
            }}
          >
            {selectedTech.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
