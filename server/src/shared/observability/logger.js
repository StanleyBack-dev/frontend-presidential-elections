import { config } from "../../config/env.js";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "email",
  "idtoken",
  "sessiontoken",
  "captchatoken",
  "x-internal-secret",
]);

function truncateString(
  value,
  maxLength = config.observabilityLogPayloadMaxChars,
) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`;
}

function sanitizeValue(value, depth = 0) {
  if (depth > 4) {
    return "[MaxDepthReached]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    const limited = value
      .slice(0, 20)
      .map((item) => sanitizeValue(item, depth + 1));
    if (value.length > 20) {
      limited.push(`... [${value.length - 20} more items]`);
    }

    return limited;
  }

  if (typeof value === "object") {
    const output = {};

    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        output[key] = "[REDACTED]";
        continue;
      }

      if (
        key.toLowerCase() === "cookie" ||
        key.toLowerCase() === "set-cookie"
      ) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = sanitizeValue(entry, depth + 1);
    }

    return output;
  }

  return String(value);
}

function getLogMethod(level) {
  if (level === "error") {
    return console.error;
  }

  if (level === "warn") {
    return console.warn;
  }

  return console.log;
}

export function logEvent(level, event, context = {}) {
  if (!config.observabilityLogsEnabled) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    context: sanitizeValue(context),
  };

  getLogMethod(level)(JSON.stringify(payload));
}

export function summarizePayload(value) {
  return sanitizeValue(value);
}
