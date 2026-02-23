/**
 * useWebSocket — connects to JalMitra backend WebSocket for real-time events.
 * Receives: new_request, tanker_update, alert_escalation, stats_update
 */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export type WSEvent = {
    type: string;
    data: Record<string, any>;
    timestamp?: string;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useWebSocket() {
    const [connected, setConnected] = useState(false);
    const [events, setEvents] = useState<WSEvent[]>([]);
    const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (typeof window === "undefined") return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                // Send periodic pings to keep connection alive
                pingRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
                }, 20000);
            };

            ws.onmessage = (event) => {
                try {
                    const msg: WSEvent = JSON.parse(event.data);
                    msg.timestamp = new Date().toISOString();
                    if (msg.type !== "pong" && msg.type !== "connected") {
                        setEvents((prev) => [msg, ...prev].slice(0, 50)); // keep last 50 events
                        setLastEvent(msg);
                    }
                } catch { }
            };

            ws.onclose = () => {
                setConnected(false);
                if (pingRef.current) clearInterval(pingRef.current);
                // Auto-reconnect after 5 seconds
                reconnectRef.current = setTimeout(connect, 5000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch {
            // WebSocket not available (SSR), skip
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (pingRef.current) clearInterval(pingRef.current);
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };
    }, [connect]);

    return { connected, events, lastEvent };
}
