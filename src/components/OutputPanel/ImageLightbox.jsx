import { X } from "lucide-react";
import { useEffect } from "react";

export default function ImageLightbox({ open, scene, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !scene) return null;

  const imageUrl = scene.imageUrl || scene.fallbackImageUrl || scene.imageSources?.[0] || null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 px-6 py-10"
      onClick={() => onClose?.()}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-borderAccent/70 bg-bgPrimary p-4 shadow-[0_24px_80px_rgba(0,0,0,0.72)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onClose?.()}
          className="absolute right-3 top-3 z-10 rounded-full border border-borderPrimary bg-bgSecondary p-2 text-textSecondary transition hover:bg-bgHover hover:text-textPrimary"
          aria-label="Chiudi anteprima immagine"
        >
          <X size={16} />
        </button>
        <div className="overflow-hidden rounded-xl border border-borderPrimary bg-bgSecondary/70">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={scene.title}
              className="max-h-[75vh] w-full object-contain"
            />
          ) : (
            <div className="grid h-[420px] place-items-center text-sm text-textMuted">
              Anteprima immagine non disponibile.
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm font-semibold text-textPrimary">
            Scene {scene.number} · {scene.title}
          </p>
          {scene.narrationScript ? (
            <p className="mt-1 text-xs leading-relaxed text-textSecondary">
              {scene.narrationScript}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
