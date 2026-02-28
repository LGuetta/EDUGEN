import { Download, Settings } from "lucide-react";

const STATUS_MAP = {
  idle: { label: "Ready", color: "bg-accentInfo" },
  processing: { label: "Processing", color: "bg-accentWarning" },
  complete: { label: "Complete", color: "bg-accentSuccess" },
  error: { label: "Error", color: "bg-red-500" },
};

export default function Header({
  status,
  onOpenSettings,
  onToggleExportMenu,
  isExportMenuOpen = false,
  canExport = false,
}) {
  const statusData = STATUS_MAP[status] || STATUS_MAP.idle;

  return (
    <header className="h-[60px] border-b border-borderPrimary bg-bgSecondary/90 px-5">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accentPrimary/20 text-accentPrimary">
            <span className="text-xs font-bold">AI</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.02em] text-textPrimary">EDUGEN AI Studio</p>
            <p className="text-[11px] text-textMuted">Zanichelli Demo Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-borderAccent px-3 py-1.5 text-xs">
            <span className={`status-dot ${statusData.color}`} />
            <span className="text-textSecondary">{statusData.label}</span>
          </div>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-amber-300">
            DEMO WIP
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-md border border-borderPrimary bg-bgTertiary p-2 text-textSecondary transition hover:bg-bgHover hover:text-textPrimary"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleExportMenu}
            disabled={!canExport}
            className={`rounded-md border p-2 transition ${
              canExport
                ? isExportMenuOpen
                  ? "border-accentPrimary bg-accentPrimary/15 text-accentInfo"
                  : "border-borderPrimary bg-bgTertiary text-textSecondary hover:bg-bgHover hover:text-textPrimary"
                : "cursor-not-allowed border-borderPrimary bg-bgTertiary/70 text-textMuted"
            }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
