import type { ElectionResults } from "../../../api/elections";
import {
  formatInteger,
  formatPercent,
  formatTime,
  formatVotes,
} from "../../../shared/utils/format";
import CandidatePhoto from "./CandidatePhoto";

interface ResultsSummaryProps {
  results: ElectionResults;
}

export default function ResultsSummary({ results }: ResultsSummaryProps) {
  const { candidates, totalVotes, validVotes } = results;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {candidates.map((candidate, index) => {
          // Second candidate mirrors the first so the bar below reads
          // left-vs-right.
          const mirrored = index === 1;
          return (
            <div
              key={candidate.slug}
              className={`flex flex-col gap-3 sm:items-center ${
                mirrored
                  ? "items-end text-right sm:flex-row-reverse"
                  : "items-start sm:flex-row"
              }`}
            >
              <CandidatePhoto
                candidate={candidate}
                className="h-16 w-16 sm:h-20 sm:w-20"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  {candidate.party} · {candidate.ballotNumber}
                </p>
                <p className="text-sm font-semibold leading-snug text-slate-900 sm:text-lg">
                  {candidate.fullName}
                </p>
                <p
                  className="mt-1 text-3xl font-bold tabular-nums sm:text-5xl"
                  style={{ color: candidate.color }}
                >
                  {formatPercent(candidate.percentage)}
                </p>
                <p className="mt-1 text-sm text-slate-500 tabular-nums">
                  {formatVotes(candidate.votes)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={candidates
          .map((c) => `${c.fullName}: ${formatPercent(c.percentage)}`)
          .join(", ")}
      >
        {validVotes > 0 &&
          candidates.map((candidate, index) => (
            <div
              key={candidate.slug}
              className="h-full transition-[width] duration-700"
              style={{
                width: `${candidate.percentage}%`,
                background: candidate.color,
                marginLeft: index > 0 ? 2 : 0,
              }}
            />
          ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="tabular-nums">
          Total: <strong>{formatInteger(totalVotes)}</strong> · Brancos:{" "}
          <strong>{formatInteger(results.blankVotes)}</strong> (
          {formatPercent(results.blankPercentage)}) · Nulos:{" "}
          <strong>{formatInteger(results.nullVotes)}</strong> (
          {formatPercent(results.nullPercentage)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {results.votingOpen && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${results.votingOpen ? "bg-emerald-500" : "bg-slate-400"}`}
            />
          </span>
          Atualizado às {formatTime(results.updatedAt)}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Percentuais calculados sobre os votos válidos (sem brancos e nulos),
        como no TSE.
      </p>
    </div>
  );
}
