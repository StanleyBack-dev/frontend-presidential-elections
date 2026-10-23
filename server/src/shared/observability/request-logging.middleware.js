import { randomUUID } from "node:crypto";
import { logEvent } from "./logger.js";

function getDurationMs(startNs) {
  const durationNs = process.hrtime.bigint() - startNs;
  return Number(durationNs) / 1_000_000;
}

function resolveRoute(req) {
  const [path] = (req.originalUrl || req.url || "").split("?");
  return path || "/";
}

// Logs method/route/status/timing only. Request and response bodies are never
// logged: they carry Google credentials and session tokens.
export function requestLoggingMiddleware(req, res, next) {
  const requestId = randomUUID();
  const startedAtNs = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    logEvent("info", "http.request.completed", {
      requestId,
      method: req.method,
      route: resolveRoute(req),
      statusCode: res.statusCode,
      durationMs: Number(getDurationMs(startedAtNs).toFixed(2)),
    });
  });

  next();
}
