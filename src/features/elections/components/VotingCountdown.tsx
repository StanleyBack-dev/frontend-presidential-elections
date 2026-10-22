import { useMemo, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { BRAZILIAN_STATE_OPTIONS } from "../../../shared/constants/brazilian-states";
import {
  BRASILIA_TIME_ZONE,
  STATE_TIME_ZONES,
  TIME_ZONE_EXCEPTIONS,
} from "../../../shared/constants/brazilian-time-zones";
import {
  deviceTimeZone,
  formatDayInZone,
  formatTimeInZone,
} from "../../../shared/utils/time-zone";
import { useCountdown } from "../hooks/useCountdown";

interface VotingCountdownProps {
  /** Official closing instant (ISO 8601) — the same moment for every state. */
  closesAt: string;
  votingOpen: boolean;
  onExpire: () => void;
}

const pad = (value: number) => String(value).padStart(2, "0");

export default function VotingCountdown({
  closesAt,
  votingOpen,
  onExpire,
}: VotingCountdownProps) {
  const deadline = useMemo(() => new Date(closesAt), [closesAt]);
  const { totalMs, days, hours, minutes, seconds } = useCountdown(
    deadline,
    onExpire,
  );
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState("");

  const brasiliaTime = formatTimeInZone(deadline, BRASILIA_TIME_ZONE);
  const brasiliaDay = formatDayInZone(deadline, BRASILIA_TIME_ZONE);
  const deviceZone = deviceTimeZone();
  const deviceTime = formatTimeInZone(deadline, deviceZone);
  const closed = !votingOpen || totalMs <= 0;

  if (closed) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        <Clock className="h-4 w-4" aria-hidden />
        Votação encerrada
      </div>
    );
  }

  const units = [
    ...(days > 0
      ? [{ value: String(days), label: days === 1 ? "dia" : "dias" }]
      : []),
    { value: pad(hours), label: "h" },
    { value: pad(minutes), label: "min" },
    { value: pad(seconds), label: "s" },
  ];

  return (
    <div className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white sm:w-auto sm:min-w-[19rem]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        Votação encerra em
      </p>

      <div
        className="mt-1 flex items-baseline gap-3"
        role="timer"
        aria-live="off"
        aria-label={`Faltam ${days} dias, ${hours} horas, ${minutes} minutos e ${seconds} segundos`}
      >
        {units.map((unit) => (
          <span key={unit.label} className="flex items-baseline gap-0.5">
            <span className="text-2xl font-bold tabular-nums sm:text-3xl">
              {unit.value}
            </span>
            <span className="text-xs text-slate-400">{unit.label}</span>
          </span>
        ))}
      </div>

      <p className="mt-1 text-xs text-slate-300">
        <span className="capitalize">{brasiliaDay}</span>, às {brasiliaTime}{" "}
        (horário de Brasília)
        {deviceZone && deviceTime !== brasiliaTime && (
          <> · {deviceTime} no seu horário</>
        )}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200"
      >
        Ver horário no meu estado
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-slate-700 pt-3 text-xs text-slate-300">
          <p>
            A votação termina{" "}
            <strong className="text-white">no mesmo instante</strong> em todo o
            país (horário unificado do TSE), por isso o cronômetro é igual para
            todos. Só muda a hora local:
          </p>

          <label className="block">
            <span className="sr-only">Seu estado</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-sm text-white outline-none focus:border-emerald-400"
            >
              <option value="">Selecione seu estado</option>
              {BRAZILIAN_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} — {option.label}
                </option>
              ))}
            </select>
          </label>

          {state && (
            <p className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">
              Em {state}, a votação encerra às{" "}
              <strong className="tabular-nums">
                {formatTimeInZone(deadline, STATE_TIME_ZONES[state])}
              </strong>{" "}
              (hora local).
            </p>
          )}

          <ul className="space-y-0.5">
            {TIME_ZONE_EXCEPTIONS.map((exception) => (
              <li key={exception.zone}>
                {exception.label}:{" "}
                <span className="font-semibold text-white tabular-nums">
                  {formatTimeInZone(deadline, exception.zone)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
