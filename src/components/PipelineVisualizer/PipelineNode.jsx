import { motion } from "framer-motion";
import {
  Brain,
  Check,
  FileText,
  Image,
  Mic,
  Package,
  Palette,
  ScanText,
  TriangleAlert,
} from "lucide-react";

const ICONS = {
  input: FileText,
  parsing: ScanText,
  llm: Brain,
  style: Palette,
  image: Image,
  voice: Mic,
  output: Package,
};

const NODE_COLORS = {
  input: { solid: "#64748b", soft: "rgba(100, 116, 139, 0.4)" },
  parsing: { solid: "#3b82f6", soft: "rgba(59, 130, 246, 0.4)" },
  llm: { solid: "#8b5cf6", soft: "rgba(139, 92, 246, 0.4)" },
  style: { solid: "#ec4899", soft: "rgba(236, 72, 153, 0.4)" },
  image: { solid: "#f59e0b", soft: "rgba(245, 158, 11, 0.4)" },
  voice: { solid: "#22c55e", soft: "rgba(34, 197, 94, 0.4)" },
  output: { solid: "#06b6d4", soft: "rgba(6, 182, 212, 0.4)" },
};

export default function PipelineNode({ id, label, x, y, state }) {
  const Icon = ICONS[id];
  const color = NODE_COLORS[id] || { solid: "#6366f1", soft: "rgba(99, 102, 241, 0.4)" };
  const active = state === "active";
  const complete = state === "complete";
  const error = state === "error";

  return (
    <motion.div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={
        active
          ? { scale: [1, 1.05, 1], opacity: 1 }
          : { scale: 1, opacity: complete ? 1 : 0.8 }
      }
      transition={active ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
    >
      <div
        className={`relative flex w-[116px] min-h-[80px] flex-col items-center gap-2 rounded-xl border px-3 py-2 shadow-panel transition ${
          complete
            ? "border-transparent"
            : active
              ? "border-accentPrimary/80"
              : error
                ? "border-red-500/70"
                : "border-borderPrimary"
        }`}
        style={{
          background: complete
            ? `linear-gradient(145deg, ${color.soft}, #111827)`
            : "linear-gradient(145deg, rgba(18,18,26,0.95), rgba(12,12,20,0.95))",
          boxShadow: active ? `0 0 26px ${color.soft}` : "none",
        }}
      >
        <div className="grid h-7 w-7 place-items-center rounded-md bg-black/25">
          <Icon size={15} color={complete ? "#ffffff" : color.solid} />
        </div>
        <p className="text-center text-[11px] font-medium text-textPrimary">
          {label.split("\n").map((line, index) => (
            <span key={`${line}_${index}`} className="block leading-tight">
              {line}
            </span>
          ))}
        </p>

        {complete ? (
          <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-accentSuccess text-black">
            <Check size={12} />
          </span>
        ) : null}
        {error ? (
          <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white">
            <TriangleAlert size={12} />
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
