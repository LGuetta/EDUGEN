import axios from "axios";

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/edugen-process";

export const api = axios.create({
  baseURL: N8N_WEBHOOK_URL,
  timeout: 15000,
});

export { N8N_WEBHOOK_URL };
