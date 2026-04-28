import { Film, Wrench } from "lucide-react";

// Video output is intentionally disabled in the demo. The backend may still
// emit a videoUrl, but during this client-facing presentation phase we render
// a "Work in progress" placeholder instead of the real player.
export default function VideoPreview() {
  return (
    <section className="panel mt-3 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">VIDEO OUTPUT</p>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-amber-200">
          WORK IN PROGRESS
        </span>
      </div>

      <div className="relative grid h-44 place-items-center overflow-hidden rounded-lg border border-dashed border-amber-400/30 bg-bgPrimary/55">
        <Film
          size={48}
          className="absolute text-amber-300/15"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-amber-200">
            <Wrench size={12} />
            <span>WORK IN PROGRESS</span>
          </div>
          <p className="text-xs text-textSecondary">
            Modulo video in fase di sviluppo
          </p>
          <p className="text-[11px] text-textMuted">
            Non disponibile in questa sessione demo
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-borderPrimary bg-bgPrimary/45 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-textMuted"
      >
        <Wrench size={13} />
        <span>VIDEO WIP</span>
      </button>
    </section>
  );
}
