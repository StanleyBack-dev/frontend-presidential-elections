import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type {
  CandidateResult,
  StateAnalytics,
  StateSortField,
} from "../../../api/elections";
import { BRAZILIAN_STATE_NAMES } from "../../../shared/constants/brazilian-states";
import { formatInteger, formatPercent } from "../../../shared/utils/format";
import SplitBar from "../../elections/components/SplitBar";
import type { UiFilters } from "../hooks/useAnalyticsFilters";

interface StatesTableProps {
  candidates: CandidateResult[];
  states: StateAnalytics[];
  filters: UiFilters;
  selectedUf: string;
  onSort: (
    patch: Pick<UiFilters, "sortBy" | "sortCandidate" | "order">,
  ) => void;
  onSelect: (uf: string) => void;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function StatesTable({
  candidates,
  states,
  filters,
  selectedUf,
  onSort,
  onSelect,
}: StatesTableProps) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return states;
    return states.filter(
      (row) =>
        normalize(row.state).includes(term) ||
        normalize(BRAZILIAN_STATE_NAMES[row.state] ?? "").includes(term),
    );
  }, [states, search]);

  const isActive = (sortBy: StateSortField, candidate = "") =>
    filters.sortBy === sortBy &&
    (sortBy !== "CANDIDATE_SHARE" ||
      (filters.sortCandidate || candidates[0]?.slug) === candidate);

  const toggleSort = (sortBy: StateSortField, candidate = "") => {
    const active = isActive(sortBy, candidate);
    onSort({
      sortBy,
      sortCandidate: candidate,
      order: active
        ? filters.order === "DESC"
          ? "ASC"
          : "DESC"
        : sortBy === "STATE"
          ? "ASC"
          : "DESC",
    });
  };

  const SortHeader = ({
    label,
    sortBy,
    candidate = "",
    align = "right",
  }: {
    label: string;
    sortBy: StateSortField;
    candidate?: string;
    align?: "left" | "right";
  }) => {
    const active = isActive(sortBy, candidate);
    const Icon = !active
      ? ArrowUpDown
      : filters.order === "ASC"
        ? ArrowUp
        : ArrowDown;
    return (
      <th
        scope="col"
        aria-sort={
          active
            ? filters.order === "ASC"
              ? "ascending"
              : "descending"
            : "none"
        }
        className={`sticky top-0 bg-slate-50 px-3 py-2 font-medium ${
          align === "right" ? "text-right" : "text-left"
        } ${sortBy === "STATE" ? "left-0 z-20" : "z-10"}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(sortBy, candidate)}
          className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 ${
            active ? "text-slate-900" : ""
          }`}
        >
          {label}
          <Icon className="h-3 w-3" aria-hidden />
        </button>
      </th>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          {visible.length} {visible.length === 1 ? "estado" : "estados"}
        </p>
        <label className="relative block w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <span className="sr-only">Buscar estado</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estado"
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      {/* `relative` keeps absolutely positioned children (sr-only labels)
          inside this scroller; otherwise they widen the whole page. */}
      <div className="relative max-h-[26rem] overflow-auto overscroll-x-contain">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <SortHeader label="Estado" sortBy="STATE" align="left" />
              <SortHeader label="Votos" sortBy="TOTAL_VOTES" />
              {candidates.map((candidate) => (
                <SortHeader
                  key={candidate.slug}
                  label={candidate.name}
                  sortBy="CANDIDATE_SHARE"
                  candidate={candidate.slug}
                />
              ))}
              <SortHeader label="Vantagem" sortBy="MARGIN" />
              <th
                scope="col"
                className="sticky top-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2 text-right font-medium"
              >
                Brancos/Nulos
              </th>
              <th
                scope="col"
                className="sticky top-0 z-10 hidden bg-slate-50 px-3 py-2 text-left font-medium md:table-cell"
              >
                Distribuição
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => {
              const leader = candidates.find((c) => c.slug === row.leaderSlug);
              const selected = row.state === selectedUf;
              return (
                <tr
                  key={row.state}
                  onClick={() => onSelect(selected ? "" : row.state)}
                  className={`cursor-pointer transition ${
                    selected ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  <td
                    className={`sticky left-0 z-[1] px-3 py-2 ${
                      selected ? "bg-emerald-50" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(selected ? "" : row.state);
                      }}
                      aria-pressed={selected}
                      className="text-left"
                    >
                      <span className="font-semibold text-slate-900">
                        {row.state}
                      </span>{" "}
                      <span className="text-slate-500">
                        {BRAZILIAN_STATE_NAMES[row.state]}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                    {formatInteger(row.totalVotes)}
                    <span className="block text-[11px] text-slate-400">
                      {row.totalVotes ? formatPercent(row.shareOfSlice) : "—"}
                    </span>
                  </td>
                  {candidates.map((candidate) => {
                    const share = row.candidates.find(
                      (c) => c.slug === candidate.slug,
                    );
                    return (
                      <td
                        key={candidate.slug}
                        className="px-3 py-2 text-right tabular-nums text-slate-900"
                      >
                        {row.totalVotes
                          ? formatPercent(share?.percentage ?? 0)
                          : "—"}
                        <span className="block text-[11px] text-slate-400">
                          {formatInteger(share?.votes ?? 0)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    {leader ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums text-slate-900">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: leader.color }}
                          aria-hidden
                        />
                        +
                        {row.marginPoints.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })}{" "}
                        p.p.
                        <span className="sr-only">para {leader.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {row.totalVotes ? "Empate" : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                    {row.totalVotes
                      ? formatPercent(
                          ((row.blankVotes + row.nullVotes) / row.totalVotes) *
                            100,
                        )
                      : "—"}
                    <span className="block text-[11px] text-slate-400">
                      {row.blankVotes} / {row.nullVotes}
                    </span>
                  </td>
                  <td className="hidden w-40 px-3 py-2 md:table-cell">
                    <SplitBar
                      candidates={candidates}
                      shares={row.candidates}
                      total={row.totalVotes}
                      label={row.state}
                    />
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={5 + candidates.length}
                  className="px-3 py-8 text-center text-sm text-slate-400"
                >
                  Nenhum estado corresponde aos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
