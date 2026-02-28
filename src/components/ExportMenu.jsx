import { Download } from "lucide-react";

export default function ExportMenu({ open, onExport }) {
  if (!open) return null;

  return (
    <div
      data-export-menu="true"
      className="absolute right-5 top-[68px] z-30 w-[220px] rounded-lg border border-borderPrimary bg-bgSecondary/95 p-2 shadow-deep"
    >
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
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-textSecondary transition hover:bg-bgHover hover:text-textPrimary"
    >
      <Download size={12} />
      <span>{label}</span>
    </button>
  );
}
