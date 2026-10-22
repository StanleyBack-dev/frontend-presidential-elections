import { useEffect, useRef, useState } from "react";
import { serverNow } from "../../../api/server-clock";

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function split(totalMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  return {
    totalMs: Math.max(0, totalMs),
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Ticks once per second toward `deadline` (an absolute instant), using the
 * server-synced clock. Calls `onExpire` once when it reaches zero.
 */
export function useCountdown(deadline: Date, onExpire?: () => void) {
  const [parts, setParts] = useState(() =>
    split(deadline.getTime() - serverNow()),
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    let timer: number;
    let expired = false;

    const tick = () => {
      const remaining = deadline.getTime() - serverNow();
      setParts(split(remaining));

      if (remaining <= 0) {
        if (!expired) {
          expired = true;
          onExpireRef.current?.();
        }
        return;
      }

      // Re-align to the next second boundary so the display never skips.
      timer = window.setTimeout(tick, (remaining % 1000) + 5);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [deadline]);

  return parts;
}
