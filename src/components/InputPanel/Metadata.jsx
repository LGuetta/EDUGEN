import { motion } from "framer-motion";

const entry = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Metadata({ pdf, analysis }) {
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
