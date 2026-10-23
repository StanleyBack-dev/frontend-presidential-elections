import axios from "axios";
import { config } from "../../config/env.js";
import { HttpError } from "./http-error.js";
import { logEvent } from "../observability/logger.js";

const graphqlHttp = axios.create({
  baseURL: config.backendGraphqlUrl,
  timeout: config.graphqlRequestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
  // Upstream GraphQL errors come back as 4xx/5xx with a JSON body we parse.
  validateStatus: () => true,
});

function isObject(value) {
  return typeof value === "object" && value !== null;
}

function extractGraphqlError(payload, fallbackStatus) {
  const firstError = Array.isArray(payload?.errors)
    ? payload.errors[0]
    : undefined;
  const extensions = isObject(firstError?.extensions)
    ? firstError.extensions
    : {};

  return {
    message:
      typeof firstError?.message === "string"
        ? firstError.message
        : "Erro ao processar a requisição.",
    statusCode:
      typeof extensions.statusCode === "number"
        ? extensions.statusCode
        : fallbackStatus,
    code: typeof extensions.code === "string" ? extensions.code : undefined,
  };
}

function getOperationName(query) {
  const match = query.match(/(query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[2] || "anonymous_operation";
}

/**
 * Calls the backend server-to-server. The shared secret proves the call
 * comes from this BFF, which is what lets the backend trust `x-client-ip`
 * for per-user rate limiting. `sessionToken` (from the httpOnly cookie)
 * identifies the signed-in voter.
 */
export async function executeGraphql({
  query,
  variables,
  clientIp,
  requestId,
  sessionToken,
}) {
  const operationName = getOperationName(query);
  const startedAt = Date.now();

  let response;
  try {
    response = await graphqlHttp.post(
      "",
      { query, variables },
      {
        headers: {
          ...(config.internalApiSecret
            ? { "x-internal-secret": config.internalApiSecret }
            : {}),
          ...(clientIp ? { "x-client-ip": clientIp } : {}),
          ...(requestId ? { "x-request-id": requestId } : {}),
          ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
        },
      },
    );
  } catch (error) {
    logEvent("error", "graphql.request.failed", {
      requestId,
      operationName,
      message: error?.message,
    });
    throw new HttpError(502, "Serviço indisponível. Tente novamente.");
  }

  const payload = response.data;
  const durationMs = Date.now() - startedAt;

  if (payload?.errors?.length || !payload?.data) {
    const metadata = extractGraphqlError(
      payload,
      response.status >= 400 ? response.status : 502,
    );

    logEvent("warn", "graphql.request.error", {
      requestId,
      operationName,
      durationMs,
      statusCode: metadata.statusCode,
      code: metadata.code,
    });

    throw new HttpError(metadata.statusCode, metadata.message, {
      code: metadata.code,
    });
  }

  logEvent("info", "graphql.request.completed", {
    requestId,
    operationName,
    durationMs,
  });

  return payload.data;
}
