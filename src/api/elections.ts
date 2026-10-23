import { httpClient } from "./httpClient";
import { syncServerClock } from "./server-clock";

export interface Candidate {
  slug: string;
  /** Nome de urna. */
  name: string;
  /** Nome completo registrado no TSE. */
  fullName: string;
  /** Foto oficial da candidatura (TSE). */
  photoUrl: string | null;
  party: string;
  ballotNumber: number;
  color: string;
}

/** Non-candidate ballot options: voto em branco / voto nulo. */
export interface BallotOption {
  slug: string;
  name: string;
  fullName: string;
  kind: "BLANK" | "NULL_VOTE";
  color: string;
}

/** Totals split like the TSE: valid (candidates) vs. blank vs. null. */
export interface VoteCounts {
  /** Todos os votos, incluindo brancos e nulos. */
  totalVotes: number;
  validVotes: number;
  blankVotes: number;
  nullVotes: number;
}

export interface CandidateResult extends Candidate {
  votes: number;
  percentage: number;
}

export interface StateResult extends VoteCounts {
  state: string;
  candidates: Array<{ slug: string; votes: number; percentage: number }>;
}

export interface ElectionResults extends VoteCounts {
  /** Brancos sobre o total (%). */
  blankPercentage: number;
  /** Nulos sobre o total (%). */
  nullPercentage: number;
  otherOptions: BallotOption[];
  votingOpen: boolean;
  /** Instante oficial de encerramento (ISO 8601). Igual para todos os estados. */
  votingClosesAt: string;
  updatedAt: string;
  candidates: CandidateResult[];
  states: StateResult[];
}

/** The voter is whoever is signed in (session cookie), not part of this. */
export interface CastVotePayload {
  candidateSlug: string;
  state: string;
  privacyConsent: true;
  captchaToken?: string;
}

export interface CastVoteResult {
  registered: boolean;
  candidateSlug: string;
  state: string;
  /** Momento do registro segundo o servidor (ISO 8601). */
  votedAt: string;
}

export type BrazilianRegion =
  "NORTE" | "NORDESTE" | "CENTRO_OESTE" | "SUDESTE" | "SUL";
export type StateSortField =
  "TOTAL_VOTES" | "STATE" | "MARGIN" | "CANDIDATE_SHARE";
export type SortOrder = "ASC" | "DESC";

export interface AnalyticsFilter {
  region?: BrazilianRegion;
  states?: string[];
  from?: string;
  to?: string;
  leader?: string;
  minVotes?: number;
  sortBy?: StateSortField;
  sortCandidate?: string;
  order?: SortOrder;
}

export interface CandidateShare {
  slug: string;
  votes: number;
  percentage: number;
}

export interface StateAnalytics extends VoteCounts {
  state: string;
  region: BrazilianRegion;
  shareOfSlice: number;
  candidates: CandidateShare[];
  leaderSlug: string | null;
  marginVotes: number;
  marginPoints: number;
}

export interface RegionAnalytics extends VoteCounts {
  region: BrazilianRegion;
  label: string;
  candidates: CandidateShare[];
  leaderSlug: string | null;
  marginPoints: number;
}

export interface TimelinePoint {
  at: string;
  totalVotes: number;
  cumulativeTotal: number;
  cumulativeValid: number;
  candidates: Array<{
    slug: string;
    votes: number;
    cumulativeVotes: number;
    cumulativePercentage: number;
  }>;
}

export interface ElectionAnalytics {
  summary: VoteCounts & {
    blankPercentage: number;
    nullPercentage: number;
    nationalVotes: number;
    shareOfNational: number;
    leaderSlug: string | null;
    marginVotes: number;
    marginPoints: number;
    statesWon: Array<{ slug: string; states: number }>;
    tiedStates: number;
    statesWithoutVotes: number;
  };
  candidates: CandidateResult[];
  regions: RegionAnalytics[];
  states: StateAnalytics[];
  granularity: "HOUR" | "DAY";
  timeline: TimelinePoint[];
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

export async function getElectionResults(): Promise<ElectionResults> {
  const response = await httpClient.get<ApiResponse<ElectionResults>>(
    "/api/elections/results",
  );
  syncServerClock(response.headers["date"], response.headers["age"]);
  return response.data.data;
}

export async function getElectionAnalytics(
  filter: AnalyticsFilter,
  signal?: AbortSignal,
): Promise<ElectionAnalytics> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === "") continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const query = params.toString();

  const response = await httpClient.get<ApiResponse<ElectionAnalytics>>(
    `/api/elections/analytics${query ? `?${query}` : ""}`,
    { signal },
  );
  return response.data.data;
}

export async function castVote(
  payload: CastVotePayload,
): Promise<ApiResponse<CastVoteResult>> {
  const response = await httpClient.post<ApiResponse<CastVoteResult>>(
    "/api/elections/votes",
    payload,
  );
  return response.data;
}
