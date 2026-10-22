/** "17:00" for `instant` as seen on a wall clock in `timeZone`. */
export function formatTimeInZone(instant: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(instant);
}

/** "domingo, 25/10" for `instant` in `timeZone`. */
export function formatDayInZone(instant: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone,
  }).format(instant);
}

/** The visitor's device time zone, when the browser exposes it. */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
