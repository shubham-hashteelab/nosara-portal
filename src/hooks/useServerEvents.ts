import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBackendUrl, getToken } from "@/api/client";

interface ServerEvent {
  event_type: string;
  [key: string]: unknown;
}

/**
 * Connects to the backend SSE endpoint and invalidates TanStack Query
 * caches when relevant events arrive.
 *
 * - sync_push_completed: inspector pushed data → refresh stats, entries, dashboard
 * - assignment_changed: manager changed access → refresh user lists
 */
export function useServerEvents(): void {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    const token = getToken();

    if (!backendUrl || !token) return;

    const url = `${backendUrl}/api/v1/events/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      let data: ServerEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.event_type) {
        case "sync_push_completed":
          // Inspector pushed inspection data — refresh everything the portal shows
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["projectStats"] });
          queryClient.invalidateQueries({ queryKey: ["inspectorActivity"] });
          queryClient.invalidateQueries({ queryKey: ["snags"] });
          queryClient.invalidateQueries({ queryKey: ["inspections"] });
          queryClient.invalidateQueries({ queryKey: ["flat"] });
          queryClient.invalidateQueries({ queryKey: ["building"] });
          queryClient.invalidateQueries({ queryKey: ["floor"] });
          break;

        case "assignment_changed":
          // Manager changed inspector access — refresh user data
          queryClient.invalidateQueries({ queryKey: ["users"] });
          if (typeof data.user_id === "string") {
            queryClient.invalidateQueries({ queryKey: ["user", data.user_id] });
          }
          break;

        default:
          break;
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects. Log for debugging but don't intervene.
      console.warn("[SSE] Connection error, will auto-reconnect");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [queryClient]);
}
