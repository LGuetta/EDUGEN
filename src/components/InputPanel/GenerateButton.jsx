import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

export default function GenerateButton({ canGenerate, status, progress = 0, onClick }) {
  const processing = status === "processing";
  const complete = status === "complete";
  const error = status === "error";

  return (
    <button
      type="button"
      disabled={!canGenerate || processing}
      onClick={onClick}
      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold tracking-[0.05em] transition ${
        !canGenerate
          ? "cursor-not-allowed border-borderPrimary bg-bgTertiary text-textMuted"
          : complete
            ? "border-accentSuccess/70 bg-accentSuccess/20 text-accentSuccess"
            : error
              ? "border-red-400/70 bg-red-500/15 text-red-300"
            : processing
              ? "border-accentWarning/70 bg-accentWarning/20 text-amber-200"
              : "glow-pulse border-accentPrimary/70 bg-accentPrimary/20 text-white hover:bg-accentPrimary/30"
      }`}
    >
      {processing ? <LoaderCircle size={17} className="animate-spin" /> : null}
      {complete ? <CheckCircle2 size={17} /> : null}
      {error ? <AlertCircle size={17} /> : null}
      {!processing && !complete && !error ? <Sparkles size={17} /> : null}
      {processing
        ? `GENERATING... ${Math.round(progress)}%`
        : complete
          ? "COMPLETE!"
          : error
            ? "RETRY GENERATE"
            : "GENERATE"}
    </button>
  );
}
