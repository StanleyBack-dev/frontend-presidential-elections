import type { ToastItem } from "../../shared/toast/ToastContext";

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastStyles = {
  success: {
    accent: "#15803d",
    border: "#86efac",
    background: "#f0fdf4",
    title: "#14532d",
    description: "#166534",
  },
  error: {
    accent: "#b91c1c",
    border: "#fca5a5",
    background: "#fef2f2",
    title: "#7f1d1d",
    description: "#991b1b",
  },
  info: {
    accent: "#1d4ed8",
    border: "#93c5fd",
    background: "#eff6ff",
    title: "#1e3a8a",
    description: "#1d4ed8",
  },
} as const;

export default function ToastViewport({
  toasts,
  onDismiss,
}: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-full sm:max-w-sm">
      {toasts.map((toast) => {
        const style = toastStyles[toast.variant];

        return (
          <div
            key={toast.id}
            className="pointer-events-auto overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm"
            style={{
              borderColor: style.border,
              background: style.background,
            }}
          >
            <div className="flex items-start gap-3 p-4">
              <span
                className="mt-0.5 block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: style.accent }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: style.title }}
                >
                  {toast.title}
                </p>
                {toast.description && (
                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: style.description }}
                  >
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
                style={{ color: style.title }}
                aria-label="Fechar mensagem"
              >
                Fechar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
