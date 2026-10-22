import { rateLimit } from "express-rate-limit";
import { config } from "../../config/env.js";

// First line of defence, per instance. The backend enforces the
// authoritative, cross-instance limits in Postgres.
function buildLimiter(windowSeconds, max) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: "Muitas requisições. Aguarde um pouco e tente novamente.",
        code: "TOO_MANY_REQUESTS",
        statusCode: 429,
      });
    },
  });
}

export const globalRateLimiter = buildLimiter(
  config.rateLimitWindowSeconds,
  config.rateLimitMax,
);

export const voteRateLimiter = buildLimiter(
  config.voteRateLimitWindowSeconds,
  config.voteRateLimitMax,
);
