import { config } from "../../config/env.js";

// The voter session (a JWT issued by the backend) lives only in this
// httpOnly cookie on the site's own domain: browser JavaScript can never
// read it. SameSite=Lax keeps other sites from voting on the user's behalf.
const SESSION_COOKIE = "pe_session";
const SESSION_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function readSessionToken(req) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (part.slice(0, separator).trim() !== SESSION_COOKIE) continue;

    const value = part.slice(separator + 1).trim();
    return value.length <= 4096 && SESSION_TOKEN_PATTERN.test(value)
      ? value
      : null;
  }
  return null;
}

export function writeSessionCookie(res, token, expiresAt) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
  });
}
