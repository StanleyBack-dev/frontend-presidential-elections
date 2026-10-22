import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ToastViewport from "../../components/feedback/ToastViewport";
import {
  ToastContext,
  type ShowToastInput,
  type ToastContextValue,
  type ToastItem,
} from "./ToastContext";

interface ToastProviderProps {
  children: ReactNode;
}

const DEFAULT_TOAST_DURATION = 4000;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    ({
      title,
      description,
      variant = "info",
      duration = DEFAULT_TOAST_DURATION,
    }: ShowToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((currentToasts) => [
        ...currentToasts,
        { id, title, description, variant, duration },
      ]);

      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      timersRef.current.set(id, timer);
      return id;
    },
    [dismissToast],
  );

  const showSuccess = useCallback<ToastContextValue["showSuccess"]>(
    (title, description, duration) =>
      showToast({ title, description, duration, variant: "success" }),
    [showToast],
  );

  const showError = useCallback<ToastContextValue["showError"]>(
    (title, description, duration) =>
      showToast({ title, description, duration, variant: "error" }),
    [showToast],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      showSuccess,
      showError,
      dismissToast,
    }),
    [dismissToast, showError, showSuccess, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
