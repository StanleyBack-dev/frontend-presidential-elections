/** Tooltip row: short line key + strong value + secondary label. */
export function TooltipRow({
  color,
  value,
  label,
}: {
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-0.5 w-3 shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
      <span className="truncate text-slate-500">{label}</span>
    </div>
  );
}
