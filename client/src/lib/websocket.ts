import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "./queryClient";

type WebSocketMessage = {
  type: string;
  data: unknown;
  timestamp: number;
};

const ENTITY_QUERY_MAP: Record<string, string[]> = {
  vehicle: ["/api/vehicles"],
  booking: ["/api/bookings"],
  customer: ["/api/customers"],
  task: ["/api/tasks"],
  note: ["/api/notes"],
  maintenance: ["/api/maintenance"],
  notification: ["/api/notifications"],
};

/**
 * Hook to connect to the WebSocket server and auto-invalidate React Query caches.
 */
export function useWebSocket(userId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      scheduleReconnect();
    }
  }, [userId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) return;
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
    reconnectAttempts.current++;
    reconnectTimeoutRef.current = setTimeout(connect, delay);
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
}

function handleMessage(message: WebSocketMessage) {
  // Entity change events — invalidate relevant React Query caches
  if (message.type.startsWith("entity:")) {
    const data = message.data as {
      entityType?: string;
    };
    if (data?.entityType) {
      const queryKeys = ENTITY_QUERY_MAP[data.entityType] || [];
      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      // Also invalidate stats and suggestions
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    }
  }

  // Notification events
  if (message.type === "notification:new") {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }
}
