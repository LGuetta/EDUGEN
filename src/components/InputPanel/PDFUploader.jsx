import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { formatFileSize } from "../../utils/formatters";

export default function PDFUploader({ pdf, onFilePicked, onUseDemoPdf, onRemove, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.includes("pdf")) {
      onFilePicked(file);
    }
  };

  const handleBrowse = (event) => {
    const file = event.target.files?.[0];
    if (file) onFilePicked(file);
  };

  return (
    <section className="panel p-4">
      <p className="section-title mb-3">PDF INPUT</p>

      {!pdf.file ? (
        <div
          className={`group flex min-h-[170px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition ${
            dragOver
              ? "border-accentPrimary bg-accentPrimary/10"
              : "border-borderAccent bg-bgPrimary/40 hover:border-accentPrimary/70"
          } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={disabled ? undefined : handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-lg bg-bgTertiary text-accentPrimary">
            <Upload size={20} />
          </div>
          <p className="text-sm text-textSecondary">Drag PDF here or</p>
          <button
            type="button"
            className="mt-2 rounded-md bg-accentPrimary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accentSecondary"
            disabled={disabled}
          >
            Browse Files
          </button>
          <button
            type="button"
            className="mt-2 text-[11px] font-semibold text-accentInfo transition hover:text-blue-300 disabled:cursor-not-allowed disabled:text-textMuted"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onUseDemoPdf?.();
            }}
          >
            Usa PDF campione
          </button>
          <p className="mt-1 text-[10px] text-textMuted">
            Carica un PDF campione locale pronto per la demo.
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={handleBrowse}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-borderAccent bg-bgPrimary/50 p-3">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-12 shrink-0 place-items-center rounded-md border border-borderAccent bg-bgSecondary text-accentInfo">
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-textPrimary">{pdf.name}</p>
              <p className="mt-1 text-xs text-textSecondary">
                {pdf.pages} pages • {formatFileSize(pdf.size)}
              </p>
              <p className="mt-1 text-[11px] text-textMuted">Ready for analysis</p>
            </div>
            <button
              type="button"
              className="rounded-md border border-borderPrimary p-1.5 text-textMuted transition hover:border-red-400/50 hover:text-red-300"
              onClick={onRemove}
              disabled={disabled}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
