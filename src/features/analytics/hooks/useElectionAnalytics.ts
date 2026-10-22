import { useCallback, useEffect, useRef, useState } from "react";
import {
  getElectionAnalytics,
  type ElectionAnalytics,
} from "../../../api/elections";
import { getHttpErrorMessage } from "../../../api/http-error";
import { toApiFilter, type UiFilters } from "./useAnalyticsFilters";

const REFRESH_INTERVAL_MS = 30000;

/**
 * Fetches analytics for the current filters. On refetch the previous data
 * stays on screen (shown dimmed via `refreshing`) — no skeleton flash.
 */
export function useElectionAnalytics(filters: UiFilters, refreshKey = 0) {
  const [data, setData] = useState<ElectionAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRefreshing(true);

    try {
      const result = await getElectionAnalytics(
        toApiFilter(filters),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        getHttpErrorMessage(err, "Não foi possível carregar a análise."),
      );
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [load]);

  return { data, error, refreshing, reload: load };
}
