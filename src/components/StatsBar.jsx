import { BarChart3, CheckCircle2, Clock3, Palette, Sparkles, TextQuote } from "lucide-react";
import { formatElapsedTime } from "../utils/formatters";

export default function StatsBar({ stats, styleLabel, status }) {
  return (
    <footer className="panel h-full rounded-xl px-3">
      <div className="grid h-full grid-cols-6 items-center gap-2 text-xs">
        <Metric icon={<BarChart3 size={13} />} label="Tokens" value={stats.tokens.toLocaleString("it-IT")} />
        <Metric icon={<Clock3 size={13} />} label="Time" value={formatElapsedTime(stats.elapsedTime)} />
        <Metric icon={<Sparkles size={13} />} label="Scenes" value={stats.scenesGenerated} />
        <Metric icon={<TextQuote size={13} />} label="Battute" value={stats.battute.toLocaleString("it-IT")} />
        <Metric icon={<Palette size={13} />} label="Style" value={styleLabel} />
        <Metric icon={<CheckCircle2 size={13} />} label="Status" value={status} />
      </div>
    </footer>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 truncate rounded-md border border-borderPrimary bg-bgPrimary/35 px-2 py-1.5">
      <span className="text-accentInfo">{icon}</span>
      <span className="text-textMuted">{label}:</span>
      <span className="truncate font-medium text-textPrimary">{value}</span>
    </div>
  );
}
