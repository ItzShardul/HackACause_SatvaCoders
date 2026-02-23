/**
 * usePolling — polls an async fetcher at a fixed interval.
 * Returns: { data, loading, error, lastUpdated, refresh }
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export function usePolling<T>(
    fetcher: () => Promise<T>,
    interval: number = 30000,  // ms between refreshes
    initialData?: T
) {
    const [data, setData] = useState<T | undefined>(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState(interval / 1000);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const result = await fetcher();
            setData(result);
            setLastUpdated(new Date());
            setCountdown(interval / 1000);
        } catch (e: any) {
            setError(e.message || "Fetch failed");
        } finally {
            setLoading(false);
        }
    }, [fetcher, interval]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();

        // Auto-refresh interval
        timerRef.current = setInterval(fetchData, interval);

        // Countdown ticker (per second)
        countdownRef.current = setInterval(() => {
            setCountdown((c) => (c <= 1 ? interval / 1000 : c - 1));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [fetchData, interval]);

    return { data, loading, error, lastUpdated, countdown, refresh };
}
