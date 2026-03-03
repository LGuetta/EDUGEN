import { Expand } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export default function Storyboard({
  scenes,
  isLoading,
  selectedSceneId,
  onSelectScene,
  onOpenLightbox,
  archiveInsights = [],
}) {
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || null;
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const headline = useMemo(() => {
    if (isLoading) return "Generazione scene in corso";
    if (!scenes.length) return "In attesa di output";
    return `${scenes.length} scenes generated`;
  }, [isLoading, scenes.length]);

  const previewSources = selectedScene
    ? selectedScene.imageSources?.length
      ? selectedScene.imageSources
      : [selectedScene.imageUrl, selectedScene.fallbackImageUrl].filter(Boolean)
    : [];

  const previewSourceKey = previewSources.join("|");

  useEffect(() => {
    setPreviewImageIndex(0);
  }, [selectedSceneId, previewSourceKey]);

  const resolvedPreviewImage =
    previewSources[previewImageIndex] ||
    selectedScene?.fallbackImageUrl ||
    selectedScene?.imageUrl ||
    null;

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
          <button
            type="button"
            onClick={() => onOpenLightbox?.(selectedScene)}
            className="group relative mb-3 block w-full overflow-hidden rounded-lg border border-borderPrimary"
          >
            <img
              src={resolvedPreviewImage}
              alt={selectedScene.title}
              className="h-36 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              onError={() => {
                if (previewImageIndex < previewSources.length - 1) {
                  setPreviewImageIndex((current) => current + 1);
                }
              }}
            />
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-white">
              <Expand size={10} />
              APRI
            </span>
          </button>
          <p className="text-xs font-semibold text-accentInfo">
            Scene {selectedScene.number} · {selectedScene.title}
          </p>
          <p className="scroll-thin mt-2 max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-textSecondary">
            {selectedScene.narrationScript || "Nessuna narrazione disponibile."}
          </p>
          {archiveInsights.length ? (
            <div className="mt-3 rounded-lg border border-borderPrimary bg-bgPrimary/45 p-2.5">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-textMuted">
                ARCHIVIO VIVO
              </p>
              <div className="mt-2 space-y-2">
                {archiveInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id}>
                    <p className="text-[11px] font-medium text-textPrimary">{insight.label}</p>
                    {insight.description ? (
                      <p className="mt-0.5 text-[10px] leading-relaxed text-textMuted">
                        {insight.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
