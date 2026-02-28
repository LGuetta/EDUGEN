import { useCallback, useState } from "react";
import axios from "axios";
import { DEFAULT_REQUEST_TIMEOUT_MS, DEFAULT_WEBHOOK_URL } from "../utils/contract";

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
    const webhookUrl = options.webhookUrl || DEFAULT_WEBHOOK_URL;
    const timeoutMs =
      Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_REQUEST_TIMEOUT_MS;
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

  const testConnection = useCallback(async ({ webhookUrl, timeoutMs }) => {
    const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
    const resolvedTimeout =
      Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_REQUEST_TIMEOUT_MS;

    setError(null);

    try {
      const response = await axios.post(
        targetUrl,
        {
          healthCheck: true,
          source: "edugen-ui",
          sentAt: new Date().toISOString(),
        },
        {
          timeout: resolvedTimeout,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const payload = response.data;
      if (payload?.healthy === true && payload?.success === true) {
        return {
          state: "success",
          message: `Reachable (${response.status}) · servizio confermato`,
          payload,
        };
      }

      return {
        state: "degraded",
        message: `Reachable (${response.status}) · contract health non esplicito`,
        payload,
      };
    } catch (err) {
      setError(err);
      if (err?.code === "ECONNABORTED") {
        return {
          state: "error",
          message: "Timeout durante il test di connessione.",
          payload: null,
        };
      }

      return {
        state: "error",
        message: err?.message || "Webhook non raggiungibile.",
        payload: err?.response?.data || null,
      };
    }
  }, []);

  return { processDocument, testConnection, isLoading, error };
}
