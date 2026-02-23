"use client";
import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Droplets, Truck, Users, TrendingUp,
    MapPin, Clock, CheckCircle, XCircle, Activity, Zap, Bell
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { api } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { useWebSocket } from "@/hooks/useWebSocket";
import LiveBadge from "@/components/LiveBadge";

const SEVERITY_COLORS: Record<string, string> = {
    normal: "#10B981", watch: "#F59E0B", warning: "#F97316",
    critical: "#EF4444", emergency: "#991B1B",
};

// Fallback demo data (used only when backend is unreachable)
const demoOverview = {
    total_villages: 50, avg_wsi: 48.3,
    severity_distribution: { normal: 8, watch: 12, warning: 15, critical: 10, emergency: 5 },
    critical_villages: 15, affected_population: 285000,
    tankers: { total: 20, available: 8, on_trip: 5, maintenance: 2 },
    trips_today: 12, delivered_today: 7, pending_requests: 15, open_grievances: 8,
};

const demoPriorities = [
    { village_name: "Patoda", district: "Beed", priority_score: 92.3, wsi_score: 88.5, severity: "emergency", population: 9800, days_since_last_supply: 18, pending_requests: 3 },
    { village_name: "Shirur Kasar", district: "Beed", priority_score: 87.1, wsi_score: 82.1, severity: "critical", population: 8500, days_since_last_supply: 15, pending_requests: 2 },
    { village_name: "Wadwani", district: "Beed", priority_score: 83.5, wsi_score: 78.9, severity: "critical", population: 7400, days_since_last_supply: 12, pending_requests: 2 },
    { village_name: "Kaij", district: "Beed", priority_score: 79.2, wsi_score: 74.2, severity: "critical", population: 14500, days_since_last_supply: 10, pending_requests: 1 },
    { village_name: "Ashti", district: "Beed", priority_score: 75.6, wsi_score: 69.8, severity: "warning", population: 12300, days_since_last_supply: 8, pending_requests: 1 },
    { village_name: "Dharur", district: "Beed", priority_score: 72.1, wsi_score: 65.4, severity: "warning", population: 11100, days_since_last_supply: 14, pending_requests: 1 },
    { village_name: "Soygaon", district: "C.S.Nagar", priority_score: 68.9, wsi_score: 62.7, severity: "warning", population: 7200, days_since_last_supply: 20, pending_requests: 0 },
    { village_name: "Ambad", district: "Jalna", priority_score: 65.3, wsi_score: 58.3, severity: "warning", population: 18200, days_since_last_supply: 7, pending_requests: 1 },
];

const demoRainfall = [
    { month: "Mar", actual: 12, normal: 15 }, { month: "Apr", actual: 8, normal: 12 },
    { month: "May", actual: 18, normal: 14 }, { month: "Jun", actual: 128, normal: 145 },
    { month: "Jul", actual: 95, normal: 155 }, { month: "Aug", actual: 110, normal: 148 },
    { month: "Sep", actual: 88, normal: 135 }, { month: "Oct", actual: 35, normal: 42 },
    { month: "Nov", actual: 12, normal: 18 }, { month: "Dec", actual: 5, normal: 8 },
    { month: "Jan", actual: 3, normal: 6 }, { month: "Feb", actual: 4, normal: 8 },
];

const demoGroundwater = [
    { month: "Mar", level: 10.2 }, { month: "Apr", level: 11.1 },
    { month: "May", level: 12.5 }, { month: "Jun", level: 11.8 },
    { month: "Jul", level: 9.5 }, { month: "Aug", level: 8.2 },
    { month: "Sep", level: 8.8 }, { month: "Oct", level: 9.6 },
    { month: "Nov", level: 10.8 }, { month: "Dec", level: 11.9 },
    { month: "Jan", level: 13.2 }, { month: "Feb", level: 14.5 },
];

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function DashboardPage() {
    // ── Real-time overview polling every 15 seconds ──
    const overviewFetcher = useCallback(async () => {
        const data = await api.getDashboardOverview();
        return data;
    }, []);

    const {
        data: overview,
        loading: loadingOverview,
        lastUpdated,
        countdown,
        refresh: refreshOverview,
    } = usePolling(overviewFetcher, 15000, demoOverview);

    // ── Priority table polling every 20 seconds ──
    const priorityFetcher = useCallback(() => api.getPriorities(8), []);
    const { data: priorities, refresh: refreshPriorities } = usePolling(
        priorityFetcher, 20000, demoPriorities
    );

    // ── WebSocket for instant push events ──
    const { connected, events, lastEvent } = useWebSocket();

    // Refresh everything manually
    const refreshAll = useCallback(() => {
        refreshOverview();
        refreshPriorities();
    }, [refreshOverview, refreshPriorities]);

    const ov = overview ?? demoOverview;
    const prio = priorities ?? demoPriorities;

    const severityData = Object.entries(ov.severity_distribution || {}).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: v as number,
        fill: SEVERITY_COLORS[k] || "#6b7280",
    }));

    return (
        <div>
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>🛰️ Command Center</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Real-time drought monitoring — Vidarbha Region
                    </p>
                </div>
                <LiveBadge
                    connected={connected}
                    countdown={countdown}
                    lastUpdated={lastUpdated}
                    onRefresh={refreshAll}
                    loading={loadingOverview}
                />
            </div>

            {/* ── Live event notifications (from WebSocket) ── */}
            <AnimatePresence>
                {lastEvent && lastEvent.type !== "connected" && (
                    <motion.div
                        key={lastEvent.timestamp}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: "1rem" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{
                            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: 10, padding: "10px 16px", fontSize: "0.82rem",
                            display: "flex", alignItems: "center", gap: 10,
                            color: "#a78bfa",
                        }}
                    >
                        <Bell size={14} />
                        <strong>Live Event:</strong> {lastEvent.type.replace(/_/g, " ")} —{" "}
                        {JSON.stringify(lastEvent.data).slice(0, 100)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Alert Ticker ── */}
            <div className="alert-ticker">
                <span className="ticker-dot" />
                <AlertTriangle size={16} color="#EF4444" />
                <span style={{ color: "#fca5a5" }}>
                    <strong>ALERT:</strong> {ov.critical_villages} villages at Critical/Emergency ·{" "}
                    {(ov.affected_population || 0).toLocaleString()} people affected ·{" "}
                    {ov.pending_requests} pending requests
                </span>
            </div>

            {/* ── Stats Grid ── */}
            <div className="stats-grid">
                {[
                    {
                        label: "Total Villages", value: ov.total_villages,
                        color: "#14b8a6", icon: MapPin, sub: "Vidarbha Region",
                    },
                    {
                        label: "Avg. Water Stress", value: ov.avg_wsi,
                        color: (ov.avg_wsi || 0) > 60 ? "#EF4444" : (ov.avg_wsi || 0) > 40 ? "#F59E0B" : "#10B981",
                        icon: Droplets, sub: "+5.2 from last month",
                    },
                    {
                        label: "Critical Villages", value: ov.critical_villages,
                        color: "#EF4444", icon: AlertTriangle,
                        sub: `${(ov.affected_population || 0).toLocaleString()} affected`,
                    },
                    {
                        label: "Tankers On Trip", value: `${ov.tankers?.on_trip ?? 0}/${ov.tankers?.total ?? 0}`,
                        color: "#3b82f6", icon: Truck,
                        sub: `${ov.delivered_today ?? 0} delivered today`,
                    },
                ].map((s, i) => (
                    <motion.div key={s.label} className="stat-card" {...fadeInUp} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="stat-label">{s.label}</span>
                            <s.icon size={20} color={s.color} />
                        </div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-change" style={{ color: "#6b7280", marginTop: 6 }}>{s.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="dashboard-grid">
                {/* Rainfall */}
                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.2 }}>
                    <div className="section-title">📉 Rainfall vs Normal (mm)</div>
                    <div style={{ padding: "1rem", height: 270 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={demoRainfall}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,85,99,0.3)" />
                                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                                <Area type="monotone" dataKey="normal" stroke="#3b82f6" fill="rgba(59,130,246,0.12)" name="Normal (mm)" />
                                <Area type="monotone" dataKey="actual" stroke="#14b8a6" fill="rgba(20,184,166,0.18)" name="Actual (mm)" />
                                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Severity Pie */}
                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.25 }}>
                    <div className="section-title">🎯 Severity Distribution</div>
                    <div style={{ padding: "1rem", height: 270, display: "flex", alignItems: "center" }}>
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {severityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, paddingLeft: "0.5rem" }}>
                            {severityData.map((e) => (
                                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.fill }} />
                                    <span style={{ fontSize: "0.78rem", color: "#9ca3af", flex: 1 }}>{e.name}</span>
                                    <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{e.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Groundwater */}
                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.3 }}>
                    <div className="section-title">💧 Groundwater Depth (m below surface)</div>
                    <div style={{ padding: "1rem", height: 270 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={demoGroundwater}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,85,99,0.3)" />
                                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis reversed tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[6, 16]} />
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                                <Area type="monotone" dataKey="level" stroke="#F59E0B" fill="rgba(245,158,11,0.12)" name="Depth (m)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Fleet status */}
                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.35 }}>
                    <div className="section-title">🚛 Fleet Status</div>
                    <div style={{ padding: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {[
                                { label: "Available", value: ov.tankers?.available ?? 0, color: "#10B981", icon: CheckCircle },
                                { label: "On Trip", value: ov.tankers?.on_trip ?? 0, color: "#3b82f6", icon: Truck },
                                { label: "Maintenance", value: ov.tankers?.maintenance ?? 0, color: "#F59E0B", icon: XCircle },
                                { label: "Total Fleet", value: ov.tankers?.total ?? 0, color: "#8b5cf6", icon: Activity },
                            ].map((item) => (
                                <div key={item.label} style={{
                                    background: "var(--glass)", borderRadius: 12, padding: "1.1rem",
                                    border: "1px solid var(--border-light)", textAlign: "center",
                                }}>
                                    <item.icon size={18} color={item.color} style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 4 }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: "1.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#9ca3af", marginBottom: 5 }}>
                                <span>Fleet Utilization</span>
                                <span>{Math.round(((ov.tankers?.on_trip ?? 0) / (ov.tankers?.total || 1)) * 100)}%</span>
                            </div>
                            <div style={{ background: "var(--border)", borderRadius: 4, height: 8 }}>
                                <div style={{
                                    height: "100%", borderRadius: 4,
                                    background: "linear-gradient(90deg, #14b8a6, #3b82f6)",
                                    width: `${((ov.tankers?.on_trip ?? 0) / (ov.tankers?.total || 1)) * 100}%`,
                                    transition: "width 1s ease",
                                }} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Priority Table ── */}
            <motion.div className="glass-card full-width" {...fadeInUp} transition={{ delay: 0.4 }}>
                <div className="section-title">
                    <span>🏆 Priority Allocation Queue</span>
                    <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        onClick={() => api.autoAllocate().then(refreshAll)}>
                        <Zap size={14} /> Auto-Allocate
                    </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Village</th>
                                <th>District</th>
                                <th>Priority Score</th>
                                <th>WSI</th>
                                <th>Severity</th>
                                <th>Population</th>
                                <th>Days Since Supply</th>
                                <th>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prio ?? []).map((v: any, i: number) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 700, color: i < 3 ? "#EF4444" : "#9ca3af" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600, color: "#f9fafb" }}>{v.village_name}</td>
                                    <td>{v.district}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ flex: 1, background: "var(--border)", borderRadius: 4, height: 6, maxWidth: 80 }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 4, width: `${v.priority_score}%`,
                                                    background: v.priority_score > 80 ? "#EF4444" : v.priority_score > 60 ? "#F59E0B" : "#10B981",
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{v.priority_score}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{v.wsi_score}</td>
                                    <td><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                                    <td>{(v.population || 0).toLocaleString()}</td>
                                    <td style={{ color: v.days_since_last_supply > 14 ? "#EF4444" : "#9ca3af" }}>
                                        {v.days_since_last_supply} days
                                    </td>
                                    <td>{v.pending_requests}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── Live Event Feed ── */}
            {events.length > 0 && (
                <motion.div className="glass-card" style={{ marginTop: "1.5rem" }} {...fadeInUp}>
                    <div className="section-title">
                        <span>📡 Live Event Feed</span>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{events.length} events</span>
                    </div>
                    <div style={{ padding: "0.75rem", maxHeight: 200, overflowY: "auto" }}>
                        {events.map((e, i) => (
                            <div key={i} style={{
                                display: "flex", gap: 10, padding: "6px 8px", borderRadius: 8,
                                marginBottom: 4, background: i === 0 ? "rgba(139,92,246,0.08)" : "transparent",
                                fontSize: "0.8rem",
                            }}>
                                <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>
                                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : "—"}
                                </span>
                                <span style={{ color: "#8b5cf6", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>
                                    {e.type}
                                </span>
                                <span style={{ color: "#9ca3af" }}>{JSON.stringify(e.data).slice(0, 80)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
