export const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/edugen-process";
export const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

export function buildN8nPayload({ pdfPath, styleModule, videoPreset }) {
  return {
    pdfPath,
    styleModule,
    videoPreset,
    requestId: `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
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
