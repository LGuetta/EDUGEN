import { ChevronLeft, ChevronRight, Download, Pause, Play, Volume2 } from "lucide-react";
import { useMemo } from "react";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

function formatClock(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = String(Math.floor(value % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function AudioPlayer({
  scenes,
  selectedSceneIndex,
  onSelectSceneIndex,
  fallbackAudioUrl,
}) {
  const safeIndex = Math.max(0, Math.min(selectedSceneIndex, scenes.length - 1));
  const selectedScene = scenes[safeIndex] || null;
  const selectedAudioUrl = selectedScene?.audioPath || fallbackAudioUrl || null;
  const hasMultiSceneAudio = scenes.length > 1;

  const narrationLabel = useMemo(() => {
    if (!selectedScene) return "Nessuna traccia caricata";
    return `Scene ${selectedScene.number} · ${selectedScene.title}`;
  }, [selectedScene]);

  const { audioRef, isPlaying, currentTime, duration, volume, setVolume, togglePlay, seek } =
    useAudioPlayer(selectedAudioUrl);

  const disabled = !selectedAudioUrl;

  return (
    <section className="panel mt-3 p-3">
      <p className="section-title mb-3">NARRAZIONE</p>
      <audio ref={audioRef} src={selectedAudioUrl ?? undefined} preload="metadata" />

      <div className="rounded-lg border border-borderPrimary bg-bgPrimary/50 p-3">
        <p className="mb-2 truncate text-[11px] text-textSecondary">{narrationLabel}</p>
        {hasMultiSceneAudio ? (
          <div className="mb-3 flex items-center justify-between rounded-md border border-borderPrimary px-2 py-1.5">
            <button
              type="button"
              className="rounded border border-borderAccent p-1 text-textSecondary disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onSelectSceneIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] text-textMuted">
              Traccia {safeIndex + 1}/{scenes.length}
            </span>
            <button
              type="button"
              className="rounded border border-borderAccent p-1 text-textSecondary disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onSelectSceneIndex(Math.min(scenes.length - 1, safeIndex + 1))}
              disabled={safeIndex >= scenes.length - 1}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`grid h-9 w-9 place-items-center rounded-full border ${
              disabled
                ? "cursor-not-allowed border-borderPrimary text-textMuted"
                : "border-accentInfo/60 bg-accentInfo/15 text-accentInfo"
            }`}
            onClick={togglePlay}
            disabled={disabled}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <input
            className="h-1.5 w-full cursor-pointer appearance-none rounded bg-bgHover"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={disabled}
          />
          <span className="w-20 text-right text-xs text-textSecondary">
            {formatClock(currentTime)} / {formatClock(duration)}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Volume2 size={14} className="text-textMuted" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded bg-bgHover"
            disabled={disabled}
          />
          <a
            href={selectedAudioUrl ?? undefined}
            download={`narrazione-scena-${selectedScene?.number || 1}.wav`}
            className={`grid h-8 w-8 place-items-center rounded border ${
              disabled
                ? "pointer-events-none border-borderPrimary text-textMuted"
                : "border-accentPrimary/60 text-accentPrimary hover:bg-accentPrimary/15"
            }`}
          >
            <Download size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
