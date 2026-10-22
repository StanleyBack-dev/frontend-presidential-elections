import { useCallback, useEffect, useState } from "react";
import type {
  AnalyticsFilter,
  BrazilianRegion,
  SortOrder,
  StateSortField,
} from "../../../api/elections";
import { serverNow } from "../../../api/server-clock";

export const PERIOD_OPTIONS = [
  { value: "all", label: "Todo o período", hours: null },
  { value: "24h", label: "Últimas 24 horas", hours: 24 },
  { value: "6h", label: "Últimas 6 horas", hours: 6 },
  { value: "1h", label: "Última hora", hours: 1 },
] as const;

export type PeriodKey = (typeof PERIOD_OPTIONS)[number]["value"];

export interface UiFilters {
  region: BrazilianRegion | "";
  uf: string;
  period: PeriodKey;
  leader: string;
  onlyWithVotes: boolean;
  sortBy: StateSortField;
  sortCandidate: string;
  order: SortOrder;
}

export const DEFAULT_FILTERS: UiFilters = {
  region: "",
  uf: "",
  period: "all",
  leader: "",
  onlyWithVotes: false,
  sortBy: "TOTAL_VOTES",
  sortCandidate: "",
  order: "DESC",
};

const REGIONS: BrazilianRegion[] = [
  "NORTE",
  "NORDESTE",
  "CENTRO_OESTE",
  "SUDESTE",
  "SUL",
];
const SORTS: StateSortField[] = [
  "TOTAL_VOTES",
  "STATE",
  "MARGIN",
  "CANDIDATE_SHARE",
];

// Short Portuguese keys so shared links stay readable.
const URL_KEYS = {
  region: "regiao",
  uf: "uf",
  period: "periodo",
  leader: "lider",
  onlyWithVotes: "comvotos",
  sortBy: "ordem",
  sortCandidate: "cand",
  order: "dir",
} as const;

function readFromUrl(): UiFilters {
  const params = new URLSearchParams(window.location.search);
  const get = (key: keyof typeof URL_KEYS) => params.get(URL_KEYS[key]) ?? "";

  const region = get("region").toUpperCase() as BrazilianRegion;
  const uf = get("uf").toUpperCase();
  const period = get("period") as PeriodKey;
  const sortBy = get("sortBy").toUpperCase() as StateSortField;

  return {
    region: REGIONS.includes(region) ? region : "",
    uf: /^[A-Z]{2}$/.test(uf) ? uf : "",
    period: PERIOD_OPTIONS.some((p) => p.value === period) ? period : "all",
    leader: /^[a-z0-9-]{1,40}$/.test(get("leader")) ? get("leader") : "",
    onlyWithVotes: get("onlyWithVotes") === "1",
    sortBy: SORTS.includes(sortBy) ? sortBy : DEFAULT_FILTERS.sortBy,
    sortCandidate: /^[a-z0-9-]{1,40}$/.test(get("sortCandidate"))
      ? get("sortCandidate")
      : "",
    order: get("order") === "asc" ? "ASC" : "DESC",
  };
}

function writeToUrl(filters: UiFilters) {
  const params = new URLSearchParams(window.location.search);
  for (const key of Object.keys(URL_KEYS) as Array<keyof UiFilters>) {
    params.delete(URL_KEYS[key]);
  }

  if (filters.region) params.set(URL_KEYS.region, filters.region.toLowerCase());
  if (filters.uf) params.set(URL_KEYS.uf, filters.uf.toLowerCase());
  if (filters.period !== "all") params.set(URL_KEYS.period, filters.period);
  if (filters.leader) params.set(URL_KEYS.leader, filters.leader);
  if (filters.onlyWithVotes) params.set(URL_KEYS.onlyWithVotes, "1");
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    params.set(URL_KEYS.sortBy, filters.sortBy.toLowerCase());
  }
  if (filters.sortCandidate) {
    params.set(URL_KEYS.sortCandidate, filters.sortCandidate);
  }
  if (filters.order !== DEFAULT_FILTERS.order) {
    params.set(URL_KEYS.order, filters.order.toLowerCase());
  }

  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

/** Converts UI filters into the API filter (period → absolute `from`). */
export function toApiFilter(filters: UiFilters): AnalyticsFilter {
  const hours = PERIOD_OPTIONS.find((p) => p.value === filters.period)?.hours;
  // Rounded to the hour: data is hourly anyway, and a stable URL lets the CDN
  // serve the same response to everyone for the rest of the hour.
  const from = hours
    ? new Date(
        Math.floor((serverNow() - hours * 3_600_000) / 3_600_000) * 3_600_000,
      ).toISOString()
    : undefined;

  return {
    region: filters.region || undefined,
    states: filters.uf ? [filters.uf] : undefined,
    from,
    leader: filters.leader || undefined,
    minVotes: filters.onlyWithVotes ? 1 : undefined,
    sortBy: filters.sortBy,
    sortCandidate:
      filters.sortBy === "CANDIDATE_SHARE"
        ? filters.sortCandidate || undefined
        : undefined,
    order: filters.order,
  };
}

export function useAnalyticsFilters() {
  const [filters, setFilters] = useState<UiFilters>(readFromUrl);

  useEffect(() => {
    writeToUrl(filters);
  }, [filters]);

  const update = useCallback((patch: Partial<UiFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const isFiltered =
    Boolean(filters.region) ||
    Boolean(filters.uf) ||
    filters.period !== "all" ||
    Boolean(filters.leader) ||
    filters.onlyWithVotes;

  return { filters, update, reset, isFiltered };
}
