import { HttpError } from "../../../shared/http/http-error.js";

const REGIONS = ["NORTE", "NORDESTE", "CENTRO_OESTE", "SUDESTE", "SUL"];
const SORT_FIELDS = ["TOTAL_VOTES", "STATE", "MARGIN", "CANDIDATE_SHARE"];
const ORDERS = ["ASC", "DESC"];
const GRANULARITIES = ["HOUR", "DAY"];
const UF = /^[A-Z]{2}$/;
const SLUG = /^[a-z0-9-]{1,40}$/;
const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const ALLOWED_PARAMS = new Set([
  "region",
  "states",
  "from",
  "to",
  "leader",
  "minVotes",
  "sortBy",
  "sortCandidate",
  "order",
  "granularity",
]);

function single(query, key) {
  const value = query[key];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, `Parâmetro "${key}" inválido.`);
  }
  return value;
}

function oneOf(query, key, allowed) {
  const value = single(query, key);
  if (value !== undefined && !allowed.includes(value)) {
    throw new HttpError(400, `Parâmetro "${key}" inválido.`);
  }
  return value;
}

function matching(query, key, pattern) {
  const value = single(query, key);
  if (value !== undefined && !pattern.test(value)) {
    throw new HttpError(400, `Parâmetro "${key}" inválido.`);
  }
  return value;
}

/**
 * Maps `/api/elections/analytics?...` query params onto the backend's
 * ElectionAnalyticsFilterInput. Strict allow-list: anything unexpected is a
 * 400 (the backend re-validates everything as well).
 */
export function parseAnalyticsFilter(query) {
  for (const key of Object.keys(query)) {
    if (!ALLOWED_PARAMS.has(key)) {
      throw new HttpError(400, `Parâmetro "${key}" não suportado.`);
    }
  }

  const statesParam = single(query, "states");
  const states = statesParam ? statesParam.split(",") : undefined;
  if (states && (states.length > 27 || !states.every((uf) => UF.test(uf)))) {
    throw new HttpError(400, 'Parâmetro "states" inválido.');
  }

  const minVotesParam = matching(query, "minVotes", /^\d{1,9}$/);

  const filter = {
    region: oneOf(query, "region", REGIONS),
    states,
    from: matching(query, "from", ISO_INSTANT),
    to: matching(query, "to", ISO_INSTANT),
    leaderSlug: matching(query, "leader", SLUG),
    minVotes: minVotesParam ? Number(minVotesParam) : undefined,
    sortBy: oneOf(query, "sortBy", SORT_FIELDS),
    sortCandidateSlug: matching(query, "sortCandidate", SLUG),
    order: oneOf(query, "order", ORDERS),
    granularity: oneOf(query, "granularity", GRANULARITIES),
  };

  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined),
  );
}
