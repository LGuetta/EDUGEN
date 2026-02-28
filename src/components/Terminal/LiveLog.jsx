import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Minus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

const icons = {
  info: <Info size={12} />,
  success: <CheckCircle2 size={12} />,
  warning: <AlertTriangle size={12} />,
  error: <AlertTriangle size={12} />,
};

const colors = {
  info: "text-accentInfo",
  success: "text-accentSuccess",
  warning: "text-accentWarning",
  error: "text-red-400",
};

const logEntry = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export default function LiveLog({ logs, collapsed, onToggle, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, collapsed]);

  return (
    <section className="panel h-full overflow-hidden">
      <div className="flex h-10 items-center justify-between border-b border-borderPrimary px-3">
        <p className="text-xs font-semibold tracking-[0.08em] text-textSecondary">SYSTEM LOG</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-borderPrimary p-1 text-textMuted hover:border-borderAccent hover:text-textSecondary"
            onClick={onToggle}
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            className="rounded border border-borderPrimary p-1 text-textMuted hover:border-borderAccent hover:text-textSecondary"
            onClick={onClear}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div
          ref={scrollRef}
          className="scroll-thin h-[calc(100%-40px)] overflow-y-auto bg-black/25 px-3 py-2"
        >
          {logs.length ? (
            logs.map((log) => (
              <motion.div
                key={log.id}
                variants={logEntry}
                initial="hidden"
                animate="visible"
                className="mb-1.5 flex items-start gap-2 font-mono text-xs"
              >
                <span className="text-textMuted">[{log.timestamp}]</span>
                <span className={`mt-[1px] ${colors[log.type] || "text-textSecondary"}`}>
                  {icons[log.type] || icons.info}
                </span>
                <span className="text-textSecondary">{log.message}</span>
              </motion.div>
            ))
          ) : (
            <p className="font-mono text-xs text-textMuted">No log entries yet.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
