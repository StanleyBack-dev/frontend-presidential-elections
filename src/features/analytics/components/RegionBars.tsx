import type { CandidateResult, RegionAnalytics } from "../../../api/elections";
import {
  formatInteger,
  formatPercent,
  formatVotes,
} from "../../../shared/utils/format";
import { textOn } from "../utils/color";
import { TooltipRow } from "./ChartTooltip";
import { useChartTooltip } from "../hooks/useChartTooltip";

// A percentage label only goes inside a segment wide enough to hold it.
const MIN_LABEL_SHARE = 18;

interface RegionBarsProps {
  candidates: CandidateResult[];
  regions: RegionAnalytics[];
}

export default function RegionBars({ candidates, regions }: RegionBarsProps) {
  const { tooltip, bind } = useChartTooltip();
  const colorOf = (slug: string) =>
    candidates.find((c) => c.slug === slug)?.color ?? "#94a3b8";
  const nameOf = (slug: string) =>
    candidates.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {candidates.map((candidate) => (
          <li key={candidate.slug} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: candidate.color }}
              aria-hidden
            />
            {candidate.name}
          </li>
        ))}
      </ul>

      <ul className="space-y-3">
        {regions.map((region) => (
          <li
            key={region.region}
            className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3"
          >
            <span className="truncate text-sm font-medium text-slate-700">
              {region.label}
            </span>

            {region.totalVotes > 0 ? (
              <div
                className="flex h-5 gap-0.5"
                role="img"
                aria-label={`${region.label}: ${region.candidates.map((c) => `${nameOf(c.slug)} ${formatPercent(c.percentage)}`).join(", ")}`}
              >
                {region.candidates
                  .filter((share) => share.votes > 0)
                  .map((share, index, visible) => {
                    const color = colorOf(share.slug);
                    const first = index === 0;
                    const last = index === visible.length - 1;
                    return (
                      <div
                        key={share.slug}
                        tabIndex={0}
                        className={`flex h-full items-center justify-center text-[11px] font-semibold tabular-nums outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-slate-900 ${
                          first ? "rounded-l" : ""
                        } ${last ? "rounded-r" : ""}`}
                        style={{
                          width: `${share.percentage}%`,
                          background: color,
                          color: textOn(color),
                        }}
                        {...bind(
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">
                              {region.label}
                            </p>
                            <TooltipRow
                              color={color}
                              value={`${formatPercent(share.percentage)} · ${formatVotes(share.votes)}`}
                              label={nameOf(share.slug)}
                            />
                          </div>,
                        )}
                      >
                        {share.percentage >= MIN_LABEL_SHARE &&
                          formatPercent(share.percentage)}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex h-5 items-center rounded bg-slate-100 px-2 text-[11px] text-slate-400">
                Sem votos
              </div>
            )}

            <span className="w-16 text-right text-xs text-slate-500 tabular-nums">
              {formatInteger(region.totalVotes)}
            </span>
          </li>
        ))}
      </ul>
      {tooltip}
    </div>
  );
}
