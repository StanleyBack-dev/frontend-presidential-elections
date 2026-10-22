import { RotateCcw } from "lucide-react";
import type { BrazilianRegion, Candidate } from "../../../api/elections";
import { BRAZILIAN_STATE_OPTIONS } from "../../../shared/constants/brazilian-states";
import {
  REGION_OPTIONS,
  STATE_REGION,
} from "../../../shared/constants/brazilian-regions";
import { PERIOD_OPTIONS, type UiFilters } from "../hooks/useAnalyticsFilters";

interface AnalyticsFiltersProps {
  filters: UiFilters;
  candidates: Candidate[];
  isFiltered: boolean;
  onChange: (patch: Partial<UiFilters>) => void;
  onReset: () => void;
}

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function AnalyticsFilters({
  filters,
  candidates,
  isFiltered,
  onChange,
  onReset,
}: AnalyticsFiltersProps) {
  const stateOptions = filters.region
    ? BRAZILIAN_STATE_OPTIONS.filter(
        (option) => STATE_REGION[option.value] === filters.region,
      )
    : BRAZILIAN_STATE_OPTIONS;

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
      <Filter label="Período">
        <select
          value={filters.period}
          onChange={(e) =>
            onChange({ period: e.target.value as UiFilters["period"] })
          }
          className={selectClass}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Filter>

      <Filter label="Região">
        <select
          value={filters.region}
          onChange={(e) => {
            const region = e.target.value as BrazilianRegion | "";
            // Drop a selected state that falls outside the new region.
            const keepUf =
              !region || !filters.uf || STATE_REGION[filters.uf] === region;
            onChange({ region, uf: keepUf ? filters.uf : "" });
          }}
          className={selectClass}
        >
          <option value="">Brasil (todas)</option>
          {REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Filter>

      <Filter label="Estado">
        <select
          value={filters.uf}
          onChange={(e) => onChange({ uf: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos</option>
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value} — {option.label}
            </option>
          ))}
        </select>
      </Filter>

      <Filter label="Estados liderados por">
        <select
          value={filters.leader}
          onChange={(e) => onChange({ leader: e.target.value })}
          className={selectClass}
        >
          <option value="">Qualquer candidato</option>
          {candidates.map((candidate) => (
            <option key={candidate.slug} value={candidate.slug}>
              {candidate.fullName}
            </option>
          ))}
        </select>
      </Filter>

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 lg:col-span-1 lg:justify-end">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.onlyWithVotes}
            onChange={(e) => onChange({ onlyWithVotes: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Só com votos
        </label>
        <button
          type="button"
          onClick={onReset}
          disabled={!isFiltered}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Limpar
        </button>
      </div>
    </div>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
