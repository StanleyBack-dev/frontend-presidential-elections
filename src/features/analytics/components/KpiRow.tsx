import type { ElectionAnalytics } from "../../../api/elections";
import {
  formatInteger,
  formatPercent,
  formatVotes,
} from "../../../shared/utils/format";

interface KpiRowProps {
  analytics: ElectionAnalytics;
  scopeLabel: string;
}

const formatPoints = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`;

export default function KpiRow({ analytics, scopeLabel }: KpiRowProps) {
  const { summary, candidates } = analytics;
  const leader = candidates.find((c) => c.slug === summary.leaderSlug);
  const scopeStates =
    summary.statesWon.reduce((sum, s) => sum + s.states, 0) +
    summary.tiedStates +
    summary.statesWithoutVotes;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Tile label={`Votos · ${scopeLabel}`}>
        <Value>{formatInteger(summary.totalVotes)}</Value>
        <Detail>
          {summary.nationalVotes > 0 &&
          summary.totalVotes !== summary.nationalVotes
            ? `${formatPercent(summary.shareOfNational)} do total nacional`
            : "Total do período"}
        </Detail>
      </Tile>

      <Tile label="Liderança">
        {leader ? (
          <>
            <p className="flex items-center gap-2 text-base font-semibold leading-tight text-slate-900">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: leader.color }}
                aria-hidden
              />
              <span className="min-w-0 break-words">{leader.name}</span>
            </p>
            <Detail>
              +{formatPoints(summary.marginPoints)} ·{" "}
              {formatVotes(summary.marginVotes)}
            </Detail>
          </>
        ) : (
          <>
            <Value>{summary.totalVotes ? "Empate" : "—"}</Value>
            <Detail>
              {summary.totalVotes ? "Mesma votação" : "Sem votos"}
            </Detail>
          </>
        )}
      </Tile>

      <Tile label="Estados liderados">
        <ul className="space-y-1">
          {summary.statesWon.map((won) => {
            const candidate = candidates.find((c) => c.slug === won.slug);
            return (
              <li
                key={won.slug}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: candidate?.color }}
                  aria-hidden
                />
                <span className="font-semibold tabular-nums text-slate-900">
                  {won.states}
                </span>
                <span className="min-w-0 break-words leading-tight">
                  {candidate?.name}
                </span>
              </li>
            );
          })}
        </ul>
        {summary.tiedStates > 0 && (
          <Detail>{summary.tiedStates} empatado(s)</Detail>
        )}
      </Tile>

      <Tile label="Brancos e nulos">
        <Value>
          {formatPercent(summary.blankPercentage + summary.nullPercentage)}
        </Value>
        <Detail>
          {formatInteger(summary.blankVotes)} brancos ·{" "}
          {formatInteger(summary.nullVotes)} nulos
        </Detail>
      </Tile>

      <Tile label="Cobertura">
        <Value>
          {scopeStates - summary.statesWithoutVotes}/{scopeStates}
        </Value>
        <Detail>estados com votos no recorte</Detail>
      </Tile>
    </div>
  );
}

function Tile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 truncate text-xs font-medium text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-2xl font-semibold leading-tight text-slate-900">
      {children}
    </p>
  );
}

function Detail({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}
