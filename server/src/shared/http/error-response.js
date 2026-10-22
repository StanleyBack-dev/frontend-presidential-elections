import { HttpError } from "./http-error.js";

export function buildErrorResponse(error) {
  const httpError = error instanceof HttpError ? error : null;
  const statusCode = httpError?.statusCode ?? 500;
  // Only messages we produced (or the backend's catalogued ones) reach the
  // client; anything unexpected gets a generic message.
  const message = httpError
    ? error.message
    : "Erro interno. Tente novamente mais tarde.";

  return {
    statusCode,
    body: {
      success: false,
      message,
      code: httpError?.code ?? null,
      statusCode,
    },
  };
}

export function sendError(res, error) {
  const { statusCode, body } = buildErrorResponse(error);
  res.status(statusCode).json(body);
}
