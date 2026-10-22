import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CandidateResult,
  ElectionAnalytics,
} from "../../../api/elections";
import { formatInteger, formatPercent } from "../../../shared/utils/format";
import { TooltipRow } from "./ChartTooltip";
import { useChartTooltip } from "../hooks/useChartTooltip";

type Mode = "percent" | "votes";

const HEIGHT = 240;
const MARGIN = { top: 12, right: 64, bottom: 28, left: 44 };
const GRID = "#e2e8f0";
const AXIS_TEXT = "#64748b";

interface TimelineChartProps {
  candidates: CandidateResult[];
  timeline: ElectionAnalytics["timeline"];
  granularity: ElectionAnalytics["granularity"];
}

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude * 4 >= value)!;
  return step * magnitude * 4;
}

const compact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function TimelineChart({
  candidates,
  timeline,
  granularity,
}: TimelineChartProps) {
  const [mode, setMode] = useState<Mode>("percent");
  const [width, setWidth] = useState(600);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { tooltip, showAt, hide } = useChartTooltip();

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, Math.floor(entry.contentRect.width))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const formatAt = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      ...(granularity === "HOUR" ? { hour: "2-digit" } : {}),
      timeZone: "America/Sao_Paulo",
    });
    return (iso: string) => formatter.format(new Date(iso));
  }, [granularity]);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const count = timeline.length;

  const valueOf = (pointIndex: number, slug: string) => {
    const entry = timeline[pointIndex].candidates.find((c) => c.slug === slug);
    if (!entry) return 0;
    return mode === "percent"
      ? entry.cumulativePercentage
      : entry.cumulativeVotes;
  };

  const yMax =
    mode === "percent"
      ? 100
      : niceMax(
          Math.max(
            0,
            ...timeline.flatMap((p) =>
              p.candidates.map((c) => c.cumulativeVotes),
            ),
          ),
        );
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const x = (i: number) =>
    MARGIN.left + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW);
  const y = (value: number) => MARGIN.top + plotH - (value / yMax) * plotH;

  const xTickIndexes = useMemo(() => {
    if (count <= 1) return count ? [0] : [];
    const maxTicks = Math.max(2, Math.floor(plotW / 90));
    const step = Math.max(1, Math.ceil((count - 1) / (maxTicks - 1)));
    const ticks: number[] = [];
    for (let i = 0; i < count; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== count - 1) ticks.push(count - 1);
    return ticks;
  }, [count, plotW]);

  const formatValue = (value: number) =>
    mode === "percent" ? formatPercent(value) : formatInteger(value);

  const tooltipContent = (index: number) => {
    const point = timeline[index];
    return (
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">
          {formatAt(point.at)}
          {granularity === "HOUR" ? "h" : ""}
        </p>
        {candidates.map((candidate) => (
          <TooltipRow
            key={candidate.slug}
            color={candidate.color}
            value={formatValue(valueOf(index, candidate.slug))}
            label={candidate.name}
          />
        ))}
        <p className="text-slate-500">
          {formatInteger(point.cumulativeTotal)} votos acumulados ·{" "}
          {formatInteger(point.totalVotes)} no intervalo
        </p>
      </div>
    );
  };

  const activate = (index: number, clientX?: number, clientY?: number) => {
    setActiveIndex(index);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    showAt(
      clientX ?? rect.left + x(index),
      clientY ?? rect.top + MARGIN.top + 24,
      tooltipContent(index),
    );
  };

  const handlePointer = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const relative = event.clientX - rect.left - MARGIN.left;
    const index = count <= 1 ? 0 : Math.round((relative / plotW) * (count - 1));
    activate(
      Math.min(count - 1, Math.max(0, index)),
      event.clientX,
      event.clientY,
    );
  };

  const handleKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!count) return;
    const current = activeIndex ?? count - 1;
    if (event.key === "ArrowLeft") activate(Math.max(0, current - 1));
    else if (event.key === "ArrowRight")
      activate(Math.min(count - 1, current + 1));
    else if (event.key === "Escape") {
      setActiveIndex(null);
      hide();
      return;
    } else return;
    event.preventDefault();
  };

  // End labels only when they don't collide (otherwise legend + tooltip).
  const last = count - 1;
  const endYs = count ? candidates.map((c) => y(valueOf(last, c.slug))) : [];
  const showEndLabels = endYs.length < 2 || Math.abs(endYs[0] - endYs[1]) >= 14;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {candidates.map((candidate) => (
            <li key={candidate.slug} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ background: candidate.color }}
                aria-hidden
              />
              {candidate.name}
            </li>
          ))}
        </ul>
        <div
          className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium"
          role="group"
          aria-label="Unidade do gráfico"
        >
          {(
            [
              ["percent", "%"],
              ["votes", "Votos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-md px-3 py-1 transition ${
                mode === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="w-full">
        {count === 0 ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
            Sem votos no período selecionado.
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={width}
            height={HEIGHT}
            role="img"
            tabIndex={0}
            onKeyDown={handleKey}
            onBlur={() => {
              setActiveIndex(null);
              hide();
            }}
            aria-label={`Evolução acumulada dos votos. Use as setas para navegar. Último ponto: ${candidates
              .map((c) => `${c.name} ${formatValue(valueOf(last, c.slug))}`)
              .join(", ")}`}
            className="overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + plotW}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill={AXIS_TEXT}
                  className="tabular-nums"
                >
                  {mode === "percent" ? `${tick}%` : compact.format(tick)}
                </text>
              </g>
            ))}

            {xTickIndexes.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={HEIGHT - 8}
                textAnchor={
                  count > 1 && index === 0
                    ? "start"
                    : count > 1 && index === count - 1
                      ? "end"
                      : "middle"
                }
                fontSize={11}
                fill={AXIS_TEXT}
                className="tabular-nums"
              >
                {formatAt(timeline[index].at)}
                {granularity === "HOUR" ? "h" : ""}
              </text>
            ))}

            {activeIndex !== null && (
              <line
                x1={x(activeIndex)}
                x2={x(activeIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotH}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            )}

            {candidates.map((candidate) => {
              const path = timeline
                .map(
                  (_, i) =>
                    `${i ? "L" : "M"}${x(i).toFixed(1)},${y(valueOf(i, candidate.slug)).toFixed(1)}`,
                )
                .join(" ");
              return (
                <path
                  key={candidate.slug}
                  d={path}
                  fill="none"
                  stroke={candidate.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}

            {candidates.map((candidate) => {
              const index = activeIndex ?? last;
              const cy = y(valueOf(index, candidate.slug));
              return (
                <g key={candidate.slug}>
                  <circle
                    cx={x(index)}
                    cy={cy}
                    r={4}
                    fill={candidate.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  {activeIndex === null && showEndLabels && (
                    <text
                      x={x(index) + 9}
                      y={cy}
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#0f172a"
                      className="tabular-nums"
                    >
                      {formatValue(valueOf(index, candidate.slug))}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Hit area: the whole plot, so the pointer only needs the X. */}
            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={handlePointer}
              onPointerLeave={() => {
                setActiveIndex(null);
                hide();
              }}
            />
          </svg>
        )}
      </div>
      {tooltip}
    </div>
  );
}
