"use client";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

interface LiveBadgeProps {
    connected: boolean;
    countdown: number;
    lastUpdated: Date | null;
    onRefresh: () => void;
    loading: boolean;
}

export default function LiveBadge({
    connected, countdown, lastUpdated, onRefresh, loading
}: LiveBadgeProps) {
    const timeStr = lastUpdated
        ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "—";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* WebSocket status */}
            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                background: connected ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${connected ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                fontSize: "0.75rem", fontWeight: 600,
                color: connected ? "#34d399" : "#f87171",
            }}>
                {connected ? (
                    <>
                        <span style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: "#34d399",
                            animation: "blink 1.5s infinite",
                            flexShrink: 0,
                        }} />
                        <Wifi size={12} /> LIVE
                    </>
                ) : (
                    <>
                        <WifiOff size={12} /> Reconnecting...
                    </>
                )}
            </div>

            {/* Last updated */}
            <div style={{
                fontSize: "0.75rem", color: "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 5,
            }}>
                <span>Updated {timeStr}</span>
                <span style={{
                    background: "var(--border)", borderRadius: 10, padding: "2px 7px",
                    color: countdown <= 5 ? "#F59E0B" : "var(--text-muted)",
                    fontSize: "0.7rem", fontWeight: 600,
                }}>
                    {countdown}s
                </span>
            </div>

            {/* Manual refresh */}
            <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer",
                    transition: "all 0.2s ease",
                }}
            >
                <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
            </button>

            <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
