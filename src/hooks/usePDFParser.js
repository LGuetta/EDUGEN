import { useCallback } from "react";

async function fileToDataUrl(file) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${file.type || "application/pdf"};base64,${btoa(binary)}`;
}

function detectSubject(fileName = "") {
  const lower = fileName.toLowerCase();
  if (lower.includes("storia") || lower.includes("guerra") || lower.includes("impero")) {
    return { subject: "Storia", complexity: "Medium" };
  }
  if (lower.includes("scienz") || lower.includes("biologia") || lower.includes("chimica")) {
    return { subject: "Scienze", complexity: "Medium" };
  }
  if (lower.includes("arte") || lower.includes("pittura") || lower.includes("museo")) {
    return { subject: "Arte", complexity: "High" };
  }
  return { subject: "Storia", complexity: "Medium" };
}

export function usePDFParser() {
  const parsePDF = useCallback(async (file) => {
    if (!file) {
      throw new Error("Missing file");
    }

    const preview = URL.createObjectURL(file);
    const content = await fileToDataUrl(file);
    const sizeKB = Math.max(1, Math.round(file.size / 1024));
    const pages = Math.max(8, Math.min(24, Math.round(sizeKB / 180) + 8));
    const words = pages * 190 + Math.round((sizeKB % 70) * 4);
    const { subject, complexity } = detectSubject(file.name);

    return {
      file,
      name: file.name,
      pages,
      words,
      size: file.size,
      content,
      preview,
      language: "Italiano",
      subject,
      complexity,
    };
  }, []);

  return { parsePDF };
}
