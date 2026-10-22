import { useMemo } from "react";
import type { CandidateResult, StateAnalytics } from "../../../api/elections";
import { BRAZILIAN_STATE_NAMES } from "../../../shared/constants/brazilian-states";
import { formatPercent, formatVotes } from "../../../shared/utils/format";
import { EMPTY_FILL, buildDivergingScale, textOn } from "../utils/color";
import { TooltipRow } from "./ChartTooltip";
import { useChartTooltip } from "../hooks/useChartTooltip";

/**
 * Tile-grid cartogram: every state gets the same size (so small states like
 * DF or SE are as readable as AM), placed roughly where it sits on the map.
 */
const TILE_POSITIONS: Record<string, [col: number, row: number]> = {
  RR: [1, 0],
  AP: [3, 0],
  AM: [1, 1],
  PA: [2, 1],
  MA: [3, 1],
  CE: [4, 1],
  RN: [5, 1],
  AC: [0, 2],
  RO: [1, 2],
  TO: [2, 2],
  PI: [3, 2],
  PE: [4, 2],
  PB: [5, 2],
  MT: [1, 3],
  GO: [2, 3],
  DF: [3, 3],
  BA: [4, 3],
  AL: [5, 3],
  MS: [1, 4],
  MG: [2, 4],
  ES: [3, 4],
  SE: [5, 4],
  PR: [1, 5],
  SP: [2, 5],
  RJ: [3, 5],
  SC: [1, 6],
  RS: [1, 7],
};
const COLS = 6;
const ROWS = 8;

interface BrazilTileMapProps {
  candidates: CandidateResult[];
  states: StateAnalytics[];
  selectedUf: string;
  onSelect: (uf: string) => void;
}

export default function BrazilTileMap({
  candidates,
  states,
  selectedUf,
  onSelect,
}: BrazilTileMapProps) {
  const [left, right] = candidates;
  const scale = useMemo(
    () => (left && right ? buildDivergingScale(left, right) : null),
    [left, right],
  );
  const byUf = useMemo(
    () => new Map(states.map((state) => [state.state, state])),
    [states],
  );
  const { tooltip, bind } = useChartTooltip();

  if (!scale || !left || !right) return null;

  const shareOf = (state: StateAnalytics, slug: string) =>
    state.candidates.find((c) => c.slug === slug)?.percentage ?? 0;

  return (
    <div>
      <div
        className="mx-auto grid max-w-[22rem] gap-1"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, auto)`,
        }}
      >
        {Object.entries(TILE_POSITIONS).map(([uf, [col, row]]) => {
          const state = byUf.get(uf);
          const inScope = Boolean(state);
          // Color needs valid votes; a state with only blank/null stays neutral-empty.
          const hasVotes = Boolean(state?.validVotes);
          const fill = hasVotes
            ? scale.binFor(
                shareOf(state!, left.slug) - shareOf(state!, right.slug),
              ).fill
            : EMPTY_FILL;
          const selected = uf === selectedUf;
          const leader = candidates.find((c) => c.slug === state?.leaderSlug);

          return (
            <button
              key={uf}
              type="button"
              onClick={() => onSelect(selected ? "" : uf)}
              aria-pressed={selected}
              aria-label={
                state
                  ? `${BRAZILIAN_STATE_NAMES[uf]}: ${formatVotes(state.totalVotes)}${
                      leader ? `, liderado por ${leader.name}` : ""
                    }`
                  : `${BRAZILIAN_STATE_NAMES[uf]}: fora do filtro`
              }
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-[11px] font-bold leading-none transition sm:text-xs ${
                selected
                  ? "ring-2 ring-slate-900 ring-offset-2"
                  : "hover:brightness-95 focus-visible:ring-2 focus-visible:ring-slate-900"
              } ${inScope ? "" : "opacity-30"} ${
                hasVotes ? "" : "border border-slate-200"
              }`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                background: fill,
                color: textOn(fill),
              }}
              {...bind(
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">
                    {BRAZILIAN_STATE_NAMES[uf]} ({uf})
                  </p>
                  {state ? (
                    <>
                      {candidates.map((candidate) => (
                        <TooltipRow
                          key={candidate.slug}
                          color={candidate.color}
                          value={formatPercent(shareOf(state, candidate.slug))}
                          label={candidate.name}
                        />
                      ))}
                      <p className="text-slate-500">
                        {formatVotes(state.totalVotes)}
                        {state.blankVotes + state.nullVotes > 0 &&
                          ` · ${state.blankVotes} brancos · ${state.nullVotes} nulos`}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500">Fora do filtro atual</p>
                  )}
                </div>,
              )}
            >
              {uf}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
        {scale.bins.map((bin) => (
          <li key={bin.key} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: bin.fill }}
              aria-hidden
            />
            {bin.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm border border-slate-200"
            style={{ background: EMPTY_FILL }}
            aria-hidden
          />
          Sem votos
        </li>
      </ul>
      {tooltip}
    </div>
  );
}
