export const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/edugen-process";
export const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
export const ALLOWED_RUNTIME_MODES = ["live", "demo"];
export const CANONICAL_STAGE_IDS = ["input", "parsing", "llm", "style", "voice", "image", "output"];

export function buildN8nPayload({ pdfPath, pdfContent, styleModule, videoPreset }) {
  return {
    requestId: `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    pdfContent: pdfContent || "",
    pdfPath,
    styleModule,
    videoPreset,
    sentAt: new Date().toISOString(),
    uiSource: "edugen-ui",
  };
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateN8nResponseShape(payload) {
  const errors = [];
  if (!isObject(payload)) {
    return { valid: false, errors: ["Response is not an object"] };
  }

  if (typeof payload.success !== "boolean") {
    errors.push("Missing/invalid `success` (boolean)");
  }
  if (typeof payload.requestId !== "string" || payload.requestId.trim().length === 0) {
    errors.push("Missing/invalid `requestId` (string)");
  }
  if (!ALLOWED_RUNTIME_MODES.includes(payload.mode)) {
    errors.push("Missing/invalid `mode` (live|demo)");
  }
  if (!isObject(payload.data)) {
    errors.push("Missing/invalid `data` object");
  }
  if (!isObject(payload.data?.storyboard)) {
    errors.push("Missing/invalid `data.storyboard` object");
  }

  const storyboard = payload.data?.storyboard;
  if (storyboard) {
    if (!Array.isArray(storyboard.scenes)) {
      errors.push("Missing/invalid `data.storyboard.scenes` (array)");
    } else {
      storyboard.scenes.forEach((scene, index) => {
        if (!isObject(scene)) {
          errors.push(`Scene ${index + 1}: not an object`);
          return;
        }
        if (typeof scene.sceneNumber !== "number") {
          errors.push(`Scene ${index + 1}: missing/invalid sceneNumber`);
        }
      });
    }
  }

  if (payload.logs && !Array.isArray(payload.logs)) {
    errors.push("Invalid `logs` field (must be array if present)");
  }
  if (payload.warnings && !Array.isArray(payload.warnings)) {
    errors.push("Invalid `warnings` field (must be array if present)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeInboundLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs
    .filter((entry) => isObject(entry))
    .map((entry) => ({
      time: entry.time || new Date().toLocaleTimeString("it-IT", { hour12: false }),
      type: entry.type || "info",
      message: entry.message || "",
    }));
}

export function normalizeInboundWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];
  return warnings
    .filter((entry) => isObject(entry) && typeof entry.message === "string" && entry.message.trim())
    .map((entry, index) => ({
      id:
        entry.id ||
        `warning_${index}_${Math.random().toString(16).slice(2, 7)}`,
      code: typeof entry.code === "string" ? entry.code : "BACKEND_WARNING",
      message: entry.message.trim(),
      sceneNumber: Number.isFinite(entry.sceneNumber) ? entry.sceneNumber : null,
      severity: entry.severity === "error" ? "error" : "warning",
      source: "backend",
    }));
}

export function isValidProgressTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) return false;
  return trace.every(
    (entry) =>
      isObject(entry) &&
      CANONICAL_STAGE_IDS.includes(entry.stage) &&
      ["idle", "active", "complete", "error"].includes(entry.status),
  );
}
