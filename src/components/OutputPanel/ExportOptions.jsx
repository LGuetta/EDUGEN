import { Download } from "lucide-react";
import { useState } from "react";

const EXPORT_FORMATS = [
  { id: "storyboard", label: "Storyboard PDF", size: "~2.4 MB", checked: true },
  { id: "audio", label: "Audio MP3", size: "~4.1 MB", checked: true },
  { id: "video", label: "Video MP4", size: "~24 MB", checked: false },
  { id: "package", label: "Full Package", size: "~32 MB", checked: false },
];

export default function ExportOptions({ enabled }) {
  const [formats, setFormats] = useState(EXPORT_FORMATS);

  const toggle = (id) =>
    setFormats((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );

  return (
    <section className="panel mt-3 p-3">
      <p className="section-title mb-3">EXPORT</p>
      <div className="space-y-2">
        {formats.map((format) => (
          <div key={format.id} className="rounded-md border border-borderPrimary bg-bgPrimary/45 p-2">
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-textSecondary">
                <input
                  type="checkbox"
                  checked={format.checked}
                  onChange={() => toggle(format.id)}
                  className="h-4 w-4 accent-accentPrimary"
                  disabled={!enabled}
                />
                <span>{format.label}</span>
              </label>
              <button
                type="button"
                className={`rounded border p-1.5 ${
                  enabled
                    ? "border-borderAccent text-textSecondary hover:bg-bgHover hover:text-white"
                    : "cursor-not-allowed border-borderPrimary text-textMuted"
                }`}
                disabled={!enabled}
              >
                <Download size={13} />
              </button>
            </div>
            <p className="mt-1 pl-6 text-[11px] text-textMuted">{format.size}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!enabled}
        className={`mt-3 w-full rounded-md border px-3 py-2 text-xs font-semibold tracking-[0.08em] ${
          enabled
            ? "border-accentPrimary/70 bg-accentPrimary/15 text-textPrimary hover:bg-accentPrimary/25"
            : "cursor-not-allowed border-borderPrimary bg-bgPrimary/45 text-textMuted"
        }`}
      >
        DOWNLOAD ALL
      </button>
    </section>
  );
}
