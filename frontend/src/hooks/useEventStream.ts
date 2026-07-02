// React hook: слуша SSE настани во реално време (известувања).
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const RECONNECT_DELAY_MS = 5_000;

/**
 * Opens a persistent SSE connection to /api/events/stream.
 * On a "notification" event the unread-count query is invalidated so the
 * Topbar badge updates instantly without waiting for the 60-second poll.
 *
 * Uses fetch + ReadableStream (not native EventSource) so the Bearer token
 * can be sent in the Authorization header.
 */
export function useEventStream() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const connect = async () => {
      try {
        const res = await fetch(`${BASE_URL}/events/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (chunk.includes("event: notification")) {
            qc.invalidateQueries({ queryKey: ["notifications-unread"] });
            qc.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      } catch {
        // AbortError on unmount — do not reconnect
        if (cancelled) return;
      }

      if (!cancelled) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      controller.abort();
    };
  }, [token, qc]);
}
