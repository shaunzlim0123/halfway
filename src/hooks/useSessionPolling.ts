"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionWithVenuesAndVotes } from "@/lib/types";
import { POLLING_INTERVAL_MS } from "@/lib/constants";

export function useSessionPolling(sessionId: string) {
  const [session, setSession] = useState<SessionWithVenuesAndVotes | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);

      if (res.status === 410) {
        setExpired(true);
        setError(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch session");
      }
      const data = await res.json();
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWithCheck = async () => {
      if (!isMounted) return;
      await fetchSession();
    };

    fetchWithCheck();

    const interval = setInterval(fetchWithCheck, POLLING_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchSession]);

  return { session, error, loading, expired, refetch: fetchSession };
}
