import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { BRAZILIAN_STATE_NAMES } from "../../../shared/constants/brazilian-states";
import {
  REGION_OPTIONS,
  STATE_REGION,
} from "../../../shared/constants/brazilian-regions";
import { formatTime } from "../../../shared/utils/format";
import { useAnalyticsFilters } from "../hooks/useAnalyticsFilters";
import { useElectionAnalytics } from "../hooks/useElectionAnalytics";
import AnalyticsFilters from "./AnalyticsFilters";
import BrazilTileMap from "./BrazilTileMap";
import KpiRow from "./KpiRow";
import RegionBars from "./RegionBars";
import StatesTable from "./StatesTable";
import TimelineChart from "./TimelineChart";

interface AnalyticsSectionProps {
  /** Bumped after a vote so the analysis refreshes right away. */
  refreshKey: number;
}

export default function AnalyticsSection({
  refreshKey,
}: AnalyticsSectionProps) {
  const { filters, update, reset, isFiltered } = useAnalyticsFilters();
  const { data, error, refreshing, reload } = useElectionAnalytics(
    filters,
    refreshKey,
  );

  // Selecting a state outside the chosen region widens the region.
  const selectState = useCallback(
    (uf: string) => {
      const keepRegion =
        !uf || !filters.region || STATE_REGION[uf] === filters.region;
      update({ uf, region: keepRegion ? filters.region : "" });
    },
    [filters.region, update],
  );

  const scopeLabel = filters.uf
    ? BRAZILIAN_STATE_NAMES[filters.uf]
    : filters.region
      ? REGION_OPTIONS.find((r) => r.value === filters.region)!.label
      : "Brasil";

  return (
    <section aria-labelledby="analytics-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="analytics-heading"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Análise de votos
          </h2>
          <p className="text-xs text-slate-400">
            Abrangência:{" "}
            <strong className="text-slate-600">{scopeLabel}</strong>
            {data && <> · atualizado às {formatTime(data.updatedAt)}</>}
          </p>
        </div>
        {refreshing && (
          <Loader2
            className="h-4 w-4 animate-spin text-slate-400"
            aria-label="Atualizando"
          />
        )}
      </div>

      {data && (
        <AnalyticsFilters
          filters={filters}
          candidates={data.candidates}
          isFiltered={isFiltered}
          onChange={update}
          onReset={reset}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!data && !error && (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2
            className="h-6 w-6 animate-spin text-slate-400"
            aria-label="Carregando análise"
          />
        </div>
      )}

      {data && (
        <div
          className={`space-y-4 transition-opacity ${refreshing ? "opacity-60" : ""}`}
          aria-busy={refreshing}
        >
          <KpiRow analytics={data} scopeLabel={scopeLabel} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card
              className="lg:col-span-2"
              title="Mapa da vantagem"
              subtitle="Toque em um estado para filtrar"
            >
              <BrazilTileMap
                candidates={data.candidates}
                states={data.states}
                selectedUf={filters.uf}
                onSelect={selectState}
              />
            </Card>

            <Card
              className="lg:col-span-3"
              title="Evolução dos votos"
              subtitle={`Acumulado por ${data.granularity === "HOUR" ? "hora" : "dia"} · horário de Brasília`}
            >
              <TimelineChart
                candidates={data.candidates}
                timeline={data.timeline}
                granularity={data.granularity}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card
              className="lg:col-span-2"
              title="Por região"
              subtitle="Distribuição dos votos em cada região"
            >
              <RegionBars candidates={data.candidates} regions={data.regions} />
            </Card>

            <div className="min-w-0 lg:col-span-3">
              <StatesTable
                candidates={data.candidates}
                states={data.states}
                filters={filters}
                selectedUf={filters.uf}
                onSort={update}
                onSelect={selectState}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Card({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-4 text-xs text-slate-500">{subtitle}</p>}
      {children}
    </div>
  );
}
