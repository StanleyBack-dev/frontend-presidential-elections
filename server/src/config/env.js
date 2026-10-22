import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: resolve(serverRoot, ".env.local") });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

const isProduction =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const config = {
  isProduction,
  port: toNumber(process.env.BFF_PORT, 5000),
  backendGraphqlUrl:
    process.env.BACKEND_GRAPHQL_URL || "http://localhost:4000/graphql",
  internalApiSecret: process.env.INTERNAL_API_SECRET || "",
  graphqlRequestTimeoutMs: toNumber(process.env.BFF_GRAPHQL_TIMEOUT_MS, 15000),
  rateLimitWindowSeconds: toNumber(
    process.env.BFF_RATE_LIMIT_WINDOW_SECONDS,
    60,
  ),
  rateLimitMax: toNumber(process.env.BFF_RATE_LIMIT_MAX, 120),
  voteRateLimitWindowSeconds: toNumber(
    process.env.BFF_VOTE_RATE_LIMIT_WINDOW_SECONDS,
    600,
  ),
  voteRateLimitMax: toNumber(process.env.BFF_VOTE_RATE_LIMIT_MAX, 10),
  observabilityLogsEnabled: toBoolean(
    process.env.BFF_OBSERVABILITY_LOGS_ENABLED,
    true,
  ),
  observabilityLogPayloadMaxChars: toNumber(
    process.env.BFF_OBSERVABILITY_LOG_PAYLOAD_MAX_CHARS,
    1500,
  ),
};

if (isProduction && config.internalApiSecret.length < 32) {
  throw new Error(
    "INTERNAL_API_SECRET must be set (>= 32 chars) in production.",
  );
}
