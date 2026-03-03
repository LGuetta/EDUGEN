import { motion } from "framer-motion";

const entry = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Metadata({ pdf, analysis, archiveInsights = [] }) {
  if (!pdf.file) return null;

  return (
    <motion.section
      variants={entry}
      initial="hidden"
      animate="visible"
      className="panel mt-3 p-4"
    >
      <p className="section-title mb-3">DOCUMENT ANALYSIS</p>
      <div className="space-y-2 text-sm">
        <Row label="Pages" value={pdf.pages} />
        <Row label="Words" value={pdf.words.toLocaleString("it-IT")} />
        <Row label="Subject" value={analysis.subject} highlight />
        <Row label="Language" value={analysis.language} />
        <Row label="Complexity" value={analysis.complexity} />
        <div className="rounded-md border border-borderPrimary bg-bgPrimary/45 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-textSecondary">Archivio Vivo</span>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              In Test
            </span>
          </div>
          <p className="mt-1 text-[11px] text-textMuted">
            Modulo in fase di sviluppo — non attivo in questa sessione demo
          </p>
          <p className="mt-2 text-[11px] font-medium text-amber-400/70">
            ⚠ riferimenti contestuali non disponibili
          </p>
          {archiveInsights.length ? (
            <div className="mt-2 space-y-1">
              {archiveInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="rounded-md bg-bgPrimary/55 px-2 py-1.5">
                  <p className="text-[11px] font-medium text-textPrimary">{insight.label}</p>
                  {insight.description ? (
                    <p className="mt-0.5 text-[10px] leading-relaxed text-textMuted">
                      {insight.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}

function Row({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 hover:border-borderPrimary">
      <span className="text-textSecondary">{label}</span>
      <span
        className={`font-medium ${highlight ? "rounded-full bg-accentPrimary/15 px-2 py-0.5 text-accentInfo" : "text-textPrimary"}`}
      >
        {value}
      </span>
    </div>
  );
}
