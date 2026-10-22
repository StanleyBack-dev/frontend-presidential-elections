import { useCallback, useState, type ReactNode } from "react";

interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

/**
 * One floating tooltip per chart. Works for pointer and keyboard focus —
 * tooltips enhance, never gate: every value also lives in the table.
 * Content is rendered as React nodes, so data is always escaped.
 */
export function useChartTooltip() {
  const [state, setState] = useState<TooltipState | null>(null);

  const hide = useCallback(() => setState(null), []);

  const showAt = useCallback((x: number, y: number, content: ReactNode) => {
    setState({ x, y, content });
  }, []);

  const bind = useCallback(
    (content: ReactNode) => ({
      onPointerMove: (event: React.PointerEvent) =>
        showAt(event.clientX, event.clientY, content),
      onPointerLeave: hide,
      onFocus: (event: React.FocusEvent<HTMLElement | SVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        showAt(rect.left + rect.width / 2, rect.top, content);
      },
      onBlur: hide,
    }),
    [hide, showAt],
  );

  const tooltip = state ? (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-[16rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
      style={{
        left: Math.min(state.x + 12, window.innerWidth - 270),
        top: Math.max(8, state.y - 12),
        transform: "translateY(-100%)",
      }}
    >
      {state.content}
    </div>
  ) : null;

  return { tooltip, bind, showAt, hide };
}
