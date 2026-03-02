import { Download } from "lucide-react";

export default function ExportMenu({ open, onExport }) {
  if (!open) return null;

  return (
    <div
      data-export-menu="true"
      className="fixed right-4 top-[72px] z-50 w-[280px] rounded-xl border border-borderAccent/70 bg-bgPrimary p-3 shadow-[0_18px_48px_rgba(0,0,0,0.6)]"
    >
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-textMuted">
        EXPORT
      </p>
      <MenuButton label="Storyboard JSON" onClick={() => onExport("storyboard")} />
      <MenuButton label="System Log TXT" onClick={() => onExport("logs")} />
      <MenuButton label="Session Snapshot" onClick={() => onExport("session")} />
    </div>
  );
}

function MenuButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 text-left text-xs font-medium text-textSecondary transition hover:border-borderPrimary hover:bg-bgSecondary hover:text-textPrimary"
    >
      <Download size={12} />
      <span>{label}</span>
    </button>
  );
}
