import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

// Same-origin BFF (/api/*). The browser sends the httpOnly session cookie
// on its own (same origin); scripts never see it.
export const httpClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 20000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});
