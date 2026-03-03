import { motion } from "framer-motion";

const entry = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function CustomPrompt({ value, onChange, disabled }) {
  const inputStyle = {
    backgroundColor: "rgba(10, 10, 15, 0.96)",
    color: "#ffffff",
    WebkitTextFillColor: "#ffffff",
    caretColor: "#ffffff",
  };

  return (
    <motion.section
      variants={entry}
      initial="hidden"
      animate="visible"
      className="panel mt-3 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="section-title">FOCUS PROMPT</p>
          <p className="mt-1 text-[11px] text-textMuted">
            Istruzione di focus per la generazione
          </p>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="rounded-md border border-borderAccent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-textSecondary transition hover:bg-bgHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pulisci
          </button>
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 220))}
        placeholder="Es. Evidenzia i passaggi piu rilevanti per l'argomento"
        disabled={disabled}
        rows={3}
        spellCheck={false}
        autoComplete="off"
        className="settings-input w-full resize-none rounded-lg border border-borderPrimary px-3 py-2 text-sm text-textPrimary outline-none transition placeholder:text-textMuted focus:border-accentPrimary/70 disabled:cursor-not-allowed disabled:opacity-60"
        style={inputStyle}
      />
    </motion.section>
  );
}
