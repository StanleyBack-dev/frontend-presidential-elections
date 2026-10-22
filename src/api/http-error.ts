const GENERIC_AXIOS_STATUS_PREFIX = "Request failed with status code";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") {
    const value = payload.trim();
    return value || null;
  }

  if (!isObject(payload)) {
    return null;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (Array.isArray(payload.message)) {
    const normalizedMessages = payload.message
      .filter((message): message is string => typeof message === "string")
      .map((message) => message.trim())
      .filter(Boolean);

    if (normalizedMessages.length > 0) {
      return normalizedMessages.join("\n");
    }
  }

  if (Array.isArray(payload.errors)) {
    const firstError = payload.errors[0];

    if (isObject(firstError) && typeof firstError.message === "string") {
      const value = firstError.message.trim();
      return value || null;
    }
  }

  return null;
}

export function getHttpErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (isObject(error) && "response" in error) {
    const response = error.response;

    if (isObject(response) && "data" in response) {
      const payloadMessage = extractMessageFromPayload(response.data);

      if (payloadMessage) {
        return payloadMessage;
      }
    }
  }

  if (error instanceof Error) {
    const message = error.message.trim();

    if (message && !message.startsWith(GENERIC_AXIOS_STATUS_PREFIX)) {
      return message;
    }
  }

  return fallbackMessage;
}
