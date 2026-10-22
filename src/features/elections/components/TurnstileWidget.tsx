import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      language?: string;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Falha ao carregar o Turnstile."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
}

/** Cloudflare Turnstile bot check (free, no puzzles for most users). */
const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current);
          onTokenRef.current(null);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;

      loadScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            language: "pt-br",
            theme: "auto",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": () => onTokenRef.current(null),
          });
        })
        .catch(() => onTokenRef.current(null));

      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current);
          widgetId.current = null;
        }
      };
    }, [siteKey]);

    return <div ref={containerRef} className="min-h-[65px]" />;
  },
);

export default TurnstileWidget;
