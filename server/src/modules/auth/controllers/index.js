import { AuthService } from "../services/auth.service.js";
import { HttpError } from "../../../shared/http/http-error.js";
import { sendError } from "../../../shared/http/error-response.js";
import {
  clearSessionCookie,
  readSessionToken,
  writeSessionCookie,
} from "../../../shared/http/session-cookie.js";

const authService = new AuthService();

function requestContext(req) {
  return {
    clientIp: req.ip,
    requestId: req.requestId,
    sessionToken: readSessionToken(req),
  };
}

/** Trades the Google credential for a session cookie; returns the voter. */
export function signInWithGoogleController() {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const idToken = req.body?.idToken;
      if (
        typeof idToken !== "string" ||
        idToken.length < 10 ||
        idToken.length > 4096
      ) {
        throw new HttpError(400, "Credencial do Google ausente.");
      }

      const result = await authService.signInWithGoogle(
        idToken,
        requestContext(req),
      );
      const { sessionToken, expiresAt, voter } = result.data;

      writeSessionCookie(res, sessionToken, expiresAt);
      res.json({ ...result, data: voter });
    } catch (error) {
      sendError(res, error);
    }
  };
}

/** Who is signed in, or `data: null`; drops a cookie that stopped working. */
export function currentVoterController() {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const context = requestContext(req);
      if (!context.sessionToken) {
        res.json({ success: true, data: null });
        return;
      }

      const result = await authService.currentVoter(context);
      if (!result.data) clearSessionCookie(res);
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function signOutController() {
  return (_req, res) => {
    res.set("Cache-Control", "no-store");
    clearSessionCookie(res);
    res.json({ success: true, data: null });
  };
}
