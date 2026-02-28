import express from "express";
import { PDFParse } from "pdf-parse";

const app = express();

const PORT = Number(process.env.PDF_EXTRACTOR_PORT || 4317);
const HOST = process.env.PDF_EXTRACTOR_HOST || "127.0.0.1";
const MAX_CHARS = Number(process.env.PDF_EXTRACTOR_MAX_CHARS || 16000);
const MAX_BODY = process.env.PDF_EXTRACTOR_MAX_BODY || "50mb";

app.use(express.json({ limit: MAX_BODY }));

function buildError(statusCode, code, message, extra = {}) {
  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message,
        ...extra,
      },
    },
  };
}

function stripDataUrlPrefix(pdfBase64 = "") {
  const value = String(pdfBase64 || "").trim();

  if (!value) {
    return "";
  }

  const separatorIndex = value.indexOf(",");
  if (value.startsWith("data:") && separatorIndex !== -1) {
    return value.slice(separatorIndex + 1);
  }

  return value;
}

function normalizeExtractedText(text = "") {
  const normalized = String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();

  return normalized;
}

function countWords(text = "") {
  const matches = String(text || "").match(/\S+/g);
  return matches ? matches.length : 0;
}

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "pdf-text-extractor",
    mode: "live",
    healthy: true,
    limits: {
      maxChars: MAX_CHARS,
      maxBody: MAX_BODY,
    },
  });
});

app.post("/extract-pdf-text", async (req, res) => {
  const { filename = "document.pdf", pdfBase64, pdfContent } = req.body || {};
  const base64Value = stripDataUrlPrefix(pdfBase64 || pdfContent);

  if (!base64Value) {
    const error = buildError(400, "PDF_TEXT_EXTRACTION_FAILED", "Missing pdfBase64 payload");
    return res.status(error.statusCode).json(error.body);
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Value, "base64");
  } catch {
    const error = buildError(400, "PDF_TEXT_EXTRACTION_FAILED", "Invalid base64 PDF payload");
    return res.status(error.statusCode).json(error.body);
  }

  if (!buffer.length) {
    const error = buildError(400, "PDF_TEXT_EXTRACTION_FAILED", "Decoded PDF payload is empty");
    return res.status(error.statusCode).json(error.body);
  }

  try {
    const parser = new PDFParse({ data: buffer });
    let parsed;

    try {
      parsed = await parser.getText();
    } finally {
      await parser.destroy();
    }

    const normalizedText = normalizeExtractedText(parsed.text);

    if (!normalizedText) {
      const error = buildError(
        422,
        "PDF_TEXT_EXTRACTION_EMPTY",
        "PDF contains no extractable text",
        { filename }
      );
      return res.status(error.statusCode).json(error.body);
    }

    const truncated = normalizedText.length > MAX_CHARS;
    const extractedText = truncated ? normalizedText.slice(0, MAX_CHARS).trim() : normalizedText;
    const pageCount = Number(parsed.total || 0);
    const wordCount = countWords(normalizedText);

    return res.json({
      success: true,
      filename,
      text: extractedText,
      pageCount,
      wordCount,
      truncated,
      extractionMethod: "real_text_pdf",
    });
  } catch (error) {
    const payload = buildError(
      422,
      "PDF_TEXT_EXTRACTION_FAILED",
      "Unable to extract text from the provided PDF",
      {
        filename,
        details: error instanceof Error ? error.message : String(error),
      }
    );
    return res.status(payload.statusCode).json(payload.body);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`PDF text extractor listening on http://${HOST}:${PORT}`);
});
