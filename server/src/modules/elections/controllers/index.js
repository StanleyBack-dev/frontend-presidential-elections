import { ElectionsService } from "../services/elections.service.js";
import { HttpError } from "../../../shared/http/http-error.js";
import { sendError } from "../../../shared/http/error-response.js";
import { parseAnalyticsFilter } from "../validators/analytics-filter.js";

const electionsService = new ElectionsService();

function requestContext(req) {
  return { clientIp: req.ip, requestId: req.requestId };
}

// Only these fields, with these types, are forwarded upstream.
function pickVoteInput(body) {
  const input = {
    cpf: body?.cpf,
    birthDate: body?.birthDate,
    candidateSlug: body?.candidateSlug,
    state: body?.state,
    privacyConsent: body?.privacyConsent,
    captchaToken: body?.captchaToken || undefined,
  };

  const stringFields = ["cpf", "birthDate", "candidateSlug", "state"];
  const isValid =
    stringFields.every(
      (field) => typeof input[field] === "string" && input[field].length <= 40,
    ) &&
    input.privacyConsent === true &&
    (input.captchaToken === undefined ||
      (typeof input.captchaToken === "string" &&
        input.captchaToken.length <= 2048));

  if (!isValid) {
    throw new HttpError(400, "Dados do voto inválidos.");
  }

  return input;
}

export function getCandidatesController() {
  return async (req, res) => {
    try {
      const result = await electionsService.getCandidates(requestContext(req));
      // Static for the whole poll: let the CDN serve it.
      res.set("Cache-Control", "public, max-age=300, s-maxage=3600");
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function getResultsController() {
  return async (req, res) => {
    try {
      const result = await electionsService.getResults(requestContext(req));
      // A few seconds of CDN caching absorbs polling spikes from every open
      // page without making the numbers feel stale.
      res.set(
        "Cache-Control",
        "public, max-age=5, s-maxage=5, stale-while-revalidate=10",
      );
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function getAnalyticsController() {
  return async (req, res) => {
    try {
      const filter = parseAnalyticsFilter(req.query);
      const result = await electionsService.getAnalytics(
        filter,
        requestContext(req),
      );
      // Cached per full URL (filters included) at the CDN.
      res.set(
        "Cache-Control",
        "public, max-age=10, s-maxage=10, stale-while-revalidate=20",
      );
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function castVoteController() {
  return async (req, res) => {
    try {
      const input = pickVoteInput(req.body);
      const result = await electionsService.castVote(
        input,
        requestContext(req),
      );
      res.set("Cache-Control", "no-store");
      res.status(201).json(result);
    } catch (error) {
      res.set("Cache-Control", "no-store");
      sendError(res, error);
    }
  };
}
