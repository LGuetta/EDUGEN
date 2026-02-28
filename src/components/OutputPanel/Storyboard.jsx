import { useMemo } from "react";
import SceneCard from "./SceneCard";

function SkeletonCard({ index }) {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-lg border border-borderPrimary bg-bgSecondary"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-24 bg-bgHover/55" />
      <div className="space-y-2 p-2">
        <div className="h-2 w-16 rounded bg-bgHover/70" />
        <div className="h-2.5 w-24 rounded bg-bgHover/70" />
      </div>
    </div>
  );
}

export default function Storyboard({ scenes, isLoading, selectedSceneId, onSelectScene }) {
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || null;

  const headline = useMemo(() => {
    if (isLoading) return "Generazione scene in corso";
    if (!scenes.length) return "In attesa di output";
    return `${scenes.length} scenes generated`;
  }, [isLoading, scenes.length]);

  return (
    <section className="panel p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">STORYBOARD</p>
        <p className="text-[11px] text-textMuted">{headline}</p>
      </div>

      <div className="scroll-thin grid max-h-[280px] grid-cols-2 gap-2 overflow-y-auto pr-1">
        {isLoading && !scenes.length
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} index={index} />)
          : null}
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            index={index}
            scene={scene}
            onClick={onSelectScene}
            active={selectedSceneId === scene.id}
          />
        ))}
      </div>

      {selectedScene ? (
        <div className="mt-3 rounded-lg border border-borderPrimary bg-bgPrimary/50 p-3">
          <p className="text-xs font-semibold text-accentInfo">
            Scene {selectedScene.number} · {selectedScene.title}
          </p>
          <p className="scroll-thin mt-2 max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-textSecondary">
            {selectedScene.narrationScript || "Nessuna narrazione disponibile."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
