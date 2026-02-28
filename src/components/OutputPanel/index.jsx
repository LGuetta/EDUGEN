import { useEffect, useMemo, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import ExportOptions from "./ExportOptions";
import Storyboard from "./Storyboard";

export default function OutputPanel({
  scenes,
  audioUrl,
  loading,
  warnings = [],
  exportAvailability,
  onExport,
}) {
  const hasOutput = scenes.length > 0 || Boolean(audioUrl);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [warningsOpen, setWarningsOpen] = useState(false);

  useEffect(() => {
    if (!scenes.length) {
      setSelectedSceneId(null);
      return;
    }
    if (!selectedSceneId || !scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const selectedSceneIndex = useMemo(() => {
    if (!selectedSceneId) return 0;
    const index = scenes.findIndex((scene) => scene.id === selectedSceneId);
    return index < 0 ? 0 : index;
  }, [scenes, selectedSceneId]);

  const handleSelectSceneIndex = (index) => {
    if (!scenes[index]) return;
    setSelectedSceneId(scenes[index].id);
  };

  return (
    <aside className="scroll-thin h-full overflow-y-auto pr-1">
      <Storyboard
        scenes={scenes}
        isLoading={loading}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
      />
      {warnings.length ? (
        <section className="panel mt-3 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setWarningsOpen((prev) => !prev)}
          >
            <p className="section-title">WARNINGS</p>
            <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              {warnings.length}
            </span>
          </button>
          {warningsOpen ? (
            <div className="scroll-thin mt-3 max-h-28 space-y-2 overflow-y-auto pr-1">
              {warnings.map((warning) => (
                <div
                  key={warning.id}
                  className="rounded-md border border-borderPrimary bg-bgPrimary/35 px-2 py-2 text-[11px] text-textSecondary"
                >
                  <p className="font-medium text-amber-200">{warning.message}</p>
                  {warning.sceneNumber ? (
                    <p className="mt-1 text-textMuted">Scene {warning.sceneNumber}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <AudioPlayer
        scenes={scenes}
        selectedSceneIndex={selectedSceneIndex}
        onSelectSceneIndex={handleSelectSceneIndex}
        fallbackAudioUrl={audioUrl}
      />
      <ExportOptions
        enabled={hasOutput}
        exportAvailability={exportAvailability}
        onExport={onExport}
      />
    </aside>
  );
}
