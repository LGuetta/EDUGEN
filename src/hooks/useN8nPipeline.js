import { useCallback, useState } from "react";
import axios from "axios";

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/edugen-process";
const RETRY_DELAYS = [0, 600, 1200];

function shouldRetry(error) {
  if (!error?.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
}

export function useN8nPipeline() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const processDocument = useCallback(async (payload, options = {}) => {
    const webhookUrl = options.webhookUrl || N8N_WEBHOOK_URL;
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 60000;
    const onAttempt = typeof options.onAttempt === "function" ? options.onAttempt : null;
    const onResponse = typeof options.onResponse === "function" ? options.onResponse : null;
    setIsLoading(true);
    setError(null);
    try {
      let lastError = null;

      for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt += 1) {
        const delay = RETRY_DELAYS[attempt];
        if (delay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }

        onAttempt?.({
          attempt: attempt + 1,
          totalAttempts: RETRY_DELAYS.length,
          retrying: attempt > 0,
          webhookUrl,
          timeoutMs,
          requestId: payload?.requestId || null,
        });

        try {
          const response = await axios.post(webhookUrl, payload, {
            timeout: timeoutMs,
            headers: {
              "Content-Type": "application/json",
            },
          });
          onResponse?.({
            attempt: attempt + 1,
            status: response.status,
            requestId: payload?.requestId || null,
          });
          return response.data;
        } catch (err) {
          lastError = err;
          if (!shouldRetry(err) || attempt === RETRY_DELAYS.length - 1) {
            throw err;
          }
        }
      }

      throw lastError || new Error("n8n request failed");
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { processDocument, isLoading, error };
}
