import express from "express";
import helmet from "helmet";
import routes from "./routes.js";
import { requestLoggingMiddleware } from "./shared/observability/request-logging.middleware.js";
import { globalRateLimiter } from "./shared/security/rate-limiters.js";
import { sendError } from "./shared/http/error-response.js";
import { HttpError } from "./shared/http/http-error.js";

const app = express();

// Behind Vercel's proxy: req.ip is the real client IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// The SPA and this API share one origin, so no CORS is enabled at all —
// browsers on other sites can't read these responses.
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(requestLoggingMiddleware);
app.use("/api", globalRateLimiter, routes);

app.use("/api", (_req, res) => {
  sendError(res, new HttpError(404, "Rota não encontrada."));
});

// Malformed JSON / oversized bodies end up here.
app.use((error, _req, res, _next) => {
  const status = error?.status ?? error?.statusCode;
  sendError(
    res,
    status === 413
      ? new HttpError(413, "Requisição muito grande.")
      : status === 400
        ? new HttpError(400, "Requisição inválida.")
        : error,
  );
});

export default app;
