import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsModal({
  open,
  onClose,
  demoMode,
  integrationSettings,
  onSave,
}) {
  const [formState, setFormState] = useState({
    webhookUrl: integrationSettings.webhookUrl,
    requestTimeoutMs: integrationSettings.requestTimeoutMs,
    demoMode,
  });

  useEffect(() => {
    if (!open) return;
    setFormState({
      webhookUrl: integrationSettings.webhookUrl,
      requestTimeoutMs: integrationSettings.requestTimeoutMs,
      demoMode,
    });
  }, [open, integrationSettings, demoMode]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-[1px]">
      <div className="panel w-[520px] p-4">
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
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, webhookUrl: event.target.value }))
              }
              className="w-full rounded-md border border-borderPrimary bg-bgPrimary/60 px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentPrimary"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-textSecondary">Timeout Request (ms)</span>
            <input
              type="number"
              min={5000}
              step={1000}
              value={formState.requestTimeoutMs}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  requestTimeoutMs: Number(event.target.value) || 60000,
                }))
              }
              className="w-full rounded-md border border-borderPrimary bg-bgPrimary/60 px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentPrimary"
            />
          </label>

          <label className="flex items-center gap-2 rounded-md border border-borderPrimary bg-bgPrimary/45 px-3 py-2">
            <input
              type="checkbox"
              checked={formState.demoMode}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, demoMode: event.target.checked }))
              }
              className="h-4 w-4 accent-accentPrimary"
            />
            <span className="text-sm text-textSecondary">Demo mode (usa fallback locale)</span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-accentPrimary/70 bg-accentPrimary/15 px-3 py-2 text-xs font-semibold tracking-[0.05em] text-textPrimary hover:bg-accentPrimary/25"
            onClick={() => {
              onSave(formState);
              onClose();
            }}
          >
            <Save size={13} />
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
