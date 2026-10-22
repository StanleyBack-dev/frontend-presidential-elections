import type { CandidateResult } from "../../../api/elections";
import { formatPercent } from "../../../shared/utils/format";

interface SplitBarProps {
  candidates: CandidateResult[];
  shares: Array<{ slug: string; percentage: number }>;
  total: number;
  label: string;
}

/** Thin horizontal bar split between candidates. */
export default function SplitBar({
  candidates,
  shares,
  total,
  label,
}: SplitBarProps) {
  const colorBySlug = new Map(candidates.map((c) => [c.slug, c.color]));
  const nameBySlug = new Map(candidates.map((c) => [c.slug, c.fullName]));

  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
      role="img"
      aria-label={
        total
          ? `${label}: ${shares
              .map(
                (s) =>
                  `${nameBySlug.get(s.slug)} ${formatPercent(s.percentage)}`,
              )
              .join(", ")}`
          : `${label}: sem votos`
      }
    >
      {total > 0 &&
        shares.map((share, index) => (
          <div
            key={share.slug}
            className="h-full transition-[width] duration-700"
            style={{
              width: `${share.percentage}%`,
              background: colorBySlug.get(share.slug),
              marginLeft: index > 0 ? 1 : 0,
            }}
          />
        ))}
    </div>
  );
}
