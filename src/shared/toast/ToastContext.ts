import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

export interface ShowToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (input: ShowToastInput) => string;
  showSuccess: (
    title: string,
    description?: string,
    duration?: number,
  ) => string;
  showError: (title: string, description?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
