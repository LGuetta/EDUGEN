import { Download, Film } from "lucide-react";
import { useState } from "react";

export default function VideoPreview({ videoUrl, posterUrl, onDownload, loading }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(videoUrl);
  const hasPlaceholder = Boolean(posterUrl);
  const statusLabel = loading ? "building" : hasVideo ? "ready" : hasPlaceholder ? "WIP" : "not available";

  return (
    <section className="panel mt-3 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">VIDEO OUTPUT</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${
            hasVideo
              ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
              : hasPlaceholder
                ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
                : "border-borderPrimary bg-bgPrimary/45 text-textMuted"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-borderPrimary bg-bgPrimary/55">
        {hasVideo && !videoFailed ? (
          <video
            className="h-44 w-full bg-black object-cover"
            controls
            preload="metadata"
            poster={posterUrl || undefined}
            onError={() => setVideoFailed(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="relative grid h-44 place-items-center bg-bgSecondary/80">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt="Poster video demo"
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
            ) : null}
            <div className="relative z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-textPrimary">
              <Film size={14} />
              <span>
                {hasVideo
                  ? "Anteprima video in caricamento"
                  : hasPlaceholder
                    ? "Placeholder video disponibile (WIP)"
                    : "Video non disponibile"}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!hasVideo}
        onClick={() => onDownload?.()}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold tracking-[0.08em] ${
          hasVideo
            ? "border-accentPrimary/65 bg-accentPrimary/15 text-textPrimary hover:bg-accentPrimary/25"
            : "cursor-not-allowed border-borderPrimary bg-bgPrimary/45 text-textMuted"
        }`}
      >
        <Download size={13} />
        <span>{hasVideo ? "DOWNLOAD VIDEO MP4" : "VIDEO WIP"}</span>
      </button>
    </section>
  );
}
