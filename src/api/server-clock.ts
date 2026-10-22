/**
 * Keeps the countdown honest on devices whose clock is wrong: every API
 * response carries the server's `Date` header (plus `Age` when served from
 * the CDN cache), from which we derive how far off the local clock is.
 */
let offsetMs = 0;

// `Date` has 1-second resolution; smaller differences are just noise.
const MIN_SKEW_MS = 2000;

export function syncServerClock(
  dateHeader: unknown,
  ageHeader?: unknown,
): void {
  if (typeof dateHeader !== "string") return;

  const serverDate = Date.parse(dateHeader);
  if (Number.isNaN(serverDate)) return;

  const ageSeconds = Number(ageHeader);
  const serverNowMs =
    serverDate + (Number.isFinite(ageSeconds) ? ageSeconds * 1000 : 0);
  const skew = serverNowMs - Date.now();

  offsetMs = Math.abs(skew) >= MIN_SKEW_MS ? skew : 0;
}

/** Current time according to the server. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}
