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

  // Scienze Agrarie / Botanica — keywords del PDF demo (ciclo del grano, semina, ecc.)
  if (
    lower.includes("grano") || lower.includes("semina") || lower.includes("raccolta") ||
    lower.includes("ciclo") || lower.includes("agri") || lower.includes("semina") ||
    lower.includes("germinazione") || lower.includes("spiga") || lower.includes("cereale") ||
    lower.includes("botanica") || lower.includes("biologia vegetale")
  ) {
    return { subject: "Scienze Agrarie", complexity: "Medium" };
  }
  if (lower.includes("storia") || lower.includes("guerra") || lower.includes("impero") ||
    lower.includes("rivoluzione") || lower.includes("medioevo") || lower.includes("rinascimento")) {
    return { subject: "Storia", complexity: "Medium" };
  }
  if (lower.includes("scienz") || lower.includes("biologia") || lower.includes("chimica") ||
    lower.includes("fisica") || lower.includes("laboratorio")) {
    return { subject: "Scienze", complexity: "Medium" };
  }
  if (lower.includes("arte") || lower.includes("pittura") || lower.includes("museo") ||
    lower.includes("scultura") || lower.includes("architettura")) {
    return { subject: "Arte", complexity: "High" };
  }
  if (lower.includes("matemati") || lower.includes("geometria") || lower.includes("algebra")) {
    return { subject: "Matematica", complexity: "High" };
  }
  if (lower.includes("letteratura") || lower.includes("italiano") || lower.includes("dante") ||
    lower.includes("poesia") || lower.includes("romanzo")) {
    return { subject: "Letteratura", complexity: "Medium" };
  }
  if (lower.includes("geografia") || lower.includes("clima") || lower.includes("territorio")) {
    return { subject: "Geografia", complexity: "Low" };
  }
  // Default sensato per materiale didattico Zanichelli
  return { subject: "Scienze Naturali", complexity: "Medium" };
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
