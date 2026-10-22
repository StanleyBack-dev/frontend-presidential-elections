import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

// Same-origin BFF (/api/*); no cookies or auth are ever sent.
export const httpClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 20000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});
