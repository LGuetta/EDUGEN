import { Download, Wrench } from "lucide-react";
import { useState } from "react";

const EXPORT_FORMATS = [
  { id: "storyboard", label: "Storyboard JSON", size: "~2.4 MB", checked: true },
  { id: "audio", label: "Audio MP3", size: "~4.1 MB", checked: true },
  { id: "video", label: "Video MP4", size: "~24 MB", checked: false, wip: true },
  { id: "package", label: "Full Package", size: "~32 MB", checked: false },
];

export default function ExportOptions({
  enabled,
  exportAvailability = {},
  selectedScene = null,
  onExport,
}) {
  const [formats, setFormats] = useState(EXPORT_FORMATS);

  const toggle = (id) => {
    const target = formats.find((item) => item.id === id);
    if (target?.wip) return;
    setFormats((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const canDownload = (id) => {
    const target = formats.find((item) => item.id === id);
    if (target?.wip) return false;
    return Boolean(enabled && exportAvailability[id]);
  };
  const selectedFormats = formats.filter((format) => format.checked && canDownload(format.id));

  return (
    <section className="panel mt-3 p-3">
      <p className="section-title mb-3">EXPORT</p>
      <div className="space-y-2">
        {formats.map((format) => (
          <div
            key={format.id}
            className={`rounded-md border p-2 ${
              format.wip
                ? "border-amber-400/30 bg-amber-400/5"
                : "border-borderPrimary bg-bgPrimary/45"
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                className={`flex items-center gap-2 text-sm ${
                  format.wip ? "cursor-not-allowed text-textMuted" : "cursor-pointer text-textSecondary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={format.wip ? false : format.checked}
                  onChange={() => toggle(format.id)}
                  className="h-4 w-4 accent-accentPrimary"
                  disabled={!enabled || Boolean(format.wip)}
                />
                <span>{format.label}</span>
                {format.wip ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-amber-200">
                    <Wrench size={9} />
                    WIP
                  </span>
                ) : null}
              </label>
              <button
                type="button"
                onClick={() => onExport?.(format.id, { selectedScene, source: "panel" })}
                className={`rounded border p-1.5 ${
                  canDownload(format.id)
                    ? "border-borderAccent text-textSecondary hover:bg-bgHover hover:text-white"
                    : "cursor-not-allowed border-borderPrimary text-textMuted"
                }`}
                disabled={!canDownload(format.id)}
              >
                <Download size={13} />
              </button>
            </div>
            <p className="mt-1 pl-6 text-[11px] text-textMuted">
              {format.wip ? "In sviluppo · non disponibile in demo" : format.size}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onExport?.("all", {
            kinds: selectedFormats.map((format) => format.id),
            selectedScene,
            source: "panel",
          })
        }
        disabled={!selectedFormats.length}
        className={`mt-3 w-full rounded-md border px-3 py-2 text-xs font-semibold tracking-[0.08em] ${
          selectedFormats.length
            ? "border-accentPrimary/70 bg-accentPrimary/15 text-textPrimary hover:bg-accentPrimary/25"
            : "cursor-not-allowed border-borderPrimary bg-bgPrimary/45 text-textMuted"
        }`}
      >
        DOWNLOAD ALL
      </button>
    </section>
  );
}
