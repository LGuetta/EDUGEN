import { LoaderCircle, PlugZap, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_WEBHOOK_URL,
} from "../utils/contract";

const DEFAULT_SETTINGS = {
  webhookUrl: DEFAULT_WEBHOOK_URL,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  demoMode: false,
  demoScenario: "fast-success",
};

const DEMO_SCENARIOS = [
  { id: "fast-success", label: "Fast Success" },
  { id: "slow-success", label: "Slow Success" },
  { id: "degraded-media", label: "Degraded Media" },
];

const inputTextStyle = {
  color: "var(--text-primary)",
  WebkitTextFillColor: "var(--text-primary)",
  caretColor: "var(--text-primary)",
};

function validateFormState(formState) {
  const errors = {};
  const trimmedUrl = formState.webhookUrl.trim();

  if (!trimmedUrl) {
    errors.webhookUrl = "Webhook URL obbligatorio.";
  } else {
    try {
      const parsedUrl = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        errors.webhookUrl = "Usa un URL http o https valido.";
      }
    } catch {
      errors.webhookUrl = "URL non valido.";
    }
  }

  const timeout = Number(formState.requestTimeoutMs);
  if (!Number.isFinite(timeout)) {
    errors.requestTimeoutMs = "Timeout non valido.";
  } else if (timeout < 5000) {
    errors.requestTimeoutMs = "Timeout minimo consigliato: 5000 ms.";
  }

  return errors;
}

export default function SettingsModal({
  open,
  onClose,
  demoMode,
  demoScenario,
  integrationSettings,
  onSave,
  onTestConnection,
}) {
  const [formState, setFormState] = useState({
    webhookUrl: integrationSettings.webhookUrl,
    requestTimeoutMs: integrationSettings.requestTimeoutMs,
    demoMode,
    demoScenario,
  });
  const [errors, setErrors] = useState({});
  const [connectionState, setConnectionState] = useState("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setFormState({
      webhookUrl: integrationSettings.webhookUrl,
      requestTimeoutMs: integrationSettings.requestTimeoutMs,
      demoMode,
      demoScenario,
    });
    setErrors({});
    setConnectionState("idle");
    setConnectionMessage("");
  }, [
    open,
    integrationSettings.webhookUrl,
    integrationSettings.requestTimeoutMs,
    demoMode,
    demoScenario,
  ]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors = validateFormState(formState);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      webhookUrl: formState.webhookUrl.trim(),
      requestTimeoutMs: Number(formState.requestTimeoutMs),
      demoMode: Boolean(formState.demoMode),
      demoScenario: formState.demoScenario,
    });
    onClose();
  };

  const handleTestConnection = async () => {
    const nextErrors = validateFormState(formState);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setConnectionState("error");
      setConnectionMessage("Correggi i campi prima del test.");
      return;
    }

    setConnectionState("testing");
    setConnectionMessage("Verifica connessione in corso...");

    const result = await onTestConnection?.({
      webhookUrl: formState.webhookUrl.trim(),
      requestTimeoutMs: Number(formState.requestTimeoutMs),
    });

    setConnectionState(result?.state || "degraded");
    setConnectionMessage(result?.message || "Reachable, contract health non esplicito.");
  };

  const connectionTone = {
    idle: "text-textMuted",
    testing: "text-accentInfo",
    success: "text-accentSuccess",
    degraded: "text-accentWarning",
    error: "text-red-300",
  }[connectionState];

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-[1px]">
      <div className="panel w-[520px] p-4 shadow-deep">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-textPrimary">Settings</p>
            <p className="text-xs text-textMuted">Configurazione runtime UI/n8n</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-borderPrimary p-1.5 text-textMuted hover:bg-bgHover hover:text-textPrimary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-textSecondary">Webhook URL</span>
            <input
              type="text"
              value={formState.webhookUrl}
              onChange={(event) => updateField("webhookUrl", event.target.value)}
              className={`w-full rounded-md border bg-bgPrimary/60 px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentPrimary ${
                errors.webhookUrl ? "border-red-400/80" : "border-borderPrimary"
              }`}
              style={inputTextStyle}
            />
            {errors.webhookUrl ? (
              <span className="mt-1 block text-[11px] text-red-300">{errors.webhookUrl}</span>
            ) : (
              <span className="mt-1 block text-[11px] text-textMuted">
                La UI usera questo endpoint dal prossimo Generate.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-textSecondary">Timeout Request (ms)</span>
            <input
              type="number"
              min={5000}
              step={1000}
              value={formState.requestTimeoutMs}
              onChange={(event) => updateField("requestTimeoutMs", event.target.value)}
              className={`w-full rounded-md border bg-bgPrimary/60 px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentPrimary ${
                errors.requestTimeoutMs ? "border-red-400/80" : "border-borderPrimary"
              }`}
              style={inputTextStyle}
            />
            {errors.requestTimeoutMs ? (
              <span className="mt-1 block text-[11px] text-red-300">
                {errors.requestTimeoutMs}
              </span>
            ) : (
              <span className="mt-1 block text-[11px] text-textMuted">
                Consigliato: 60000 ms per demo locale con n8n.
              </span>
            )}
          </label>

          <label className="flex items-center gap-2 rounded-md border border-borderPrimary bg-bgPrimary/45 px-3 py-2">
            <input
              type="checkbox"
              checked={formState.demoMode}
              onChange={(event) => updateField("demoMode", event.target.checked)}
              className="h-4 w-4 accent-accentPrimary"
            />
            <span className="text-sm text-textSecondary">Demo mode (usa fallback locale)</span>
          </label>

          {formState.demoMode ? (
            <label className="block">
              <span className="mb-1 block text-xs text-textSecondary">Demo Scenario</span>
              <select
                value={formState.demoScenario}
                onChange={(event) => updateField("demoScenario", event.target.value)}
                className="w-full rounded-md border border-borderPrimary bg-bgPrimary/60 px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentPrimary"
                style={inputTextStyle}
              >
                {DEMO_SCENARIOS.map((scenario) => (
                  <option
                    key={scenario.id}
                    value={scenario.id}
                    style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  >
                    {scenario.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="rounded-md border border-borderPrimary bg-bgPrimary/35 px-3 py-2">
            <p className="text-xs text-textSecondary">Connection Check</p>
            <p className={`mt-1 text-[11px] ${connectionTone}`}>{connectionMessage || "Nessun test eseguito."}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-borderPrimary px-3 py-2 text-[11px] font-semibold tracking-[0.05em] text-textSecondary hover:border-borderAccent hover:bg-bgHover hover:text-textPrimary"
            onClick={() => {
              setFormState(DEFAULT_SETTINGS);
              setErrors({});
              setConnectionState("idle");
              setConnectionMessage("");
            }}
          >
            <RotateCcw size={12} />
            RESTORE DEFAULTS
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-borderAccent/80 bg-bgPrimary/55 px-3 py-2 text-[11px] font-semibold tracking-[0.05em] text-textSecondary hover:border-borderAccent hover:bg-bgHover hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleTestConnection}
              disabled={connectionState === "testing"}
            >
              {connectionState === "testing" ? (
                <LoaderCircle size={12} className="animate-spin" />
              ) : (
                <PlugZap size={12} />
              )}
              TEST CONNECTION
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-accentPrimary/70 bg-accentPrimary/15 px-3 py-2 text-xs font-semibold tracking-[0.05em] text-textPrimary hover:bg-accentPrimary/25"
              onClick={handleSave}
            >
              <Save size={13} />
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
