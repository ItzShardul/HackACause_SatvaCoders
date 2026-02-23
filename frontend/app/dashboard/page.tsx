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
    total_villages: 50, avg_wsi: 54.2,
    severity_distribution: { normal: 5, watch: 10, warning: 18, critical: 12, emergency: 5 },
    critical_villages: 17, affected_population: 142000,
    tankers: { total: 15, available: 6, on_trip: 7, maintenance: 2 },
    trips_today: 14, delivered_today: 9, pending_requests: 12, open_grievances: 6,
};

const demoPriorities = [
    { village_name: "Bhiwapur", district: "Nagpur", priority_score: 92.1, wsi_score: 91.5, severity: "emergency", population: 14200, days_since_last_supply: 21, pending_requests: 4 },
    { village_name: "Narkhed", district: "Nagpur", priority_score: 88.5, wsi_score: 87.2, severity: "critical", population: 21500, days_since_last_supply: 18, pending_requests: 3 },
    { village_name: "Katol", district: "Nagpur", priority_score: 82.3, wsi_score: 78.4, severity: "critical", population: 42100, days_since_last_supply: 14, pending_requests: 2 },
    { village_name: "Umred", district: "Nagpur", priority_score: 79.8, wsi_score: 75.1, severity: "critical", population: 45600, days_since_last_supply: 12, pending_requests: 1 },
    { village_name: "Parseoni", district: "Nagpur", priority_score: 75.6, wsi_score: 72.4, severity: "critical", population: 15300, days_since_last_supply: 15, pending_requests: 2 },
    { village_name: "Ramtek", district: "Nagpur", priority_score: 73.2, wsi_score: 68.4, severity: "warning", population: 22400, days_since_last_supply: 11, pending_requests: 1 },
    { village_name: "Kuhi", district: "Nagpur", priority_score: 72.1, wsi_score: 64.2, severity: "warning", population: 11200, days_since_last_supply: 9, pending_requests: 1 },
    { village_name: "Kamptee", district: "Nagpur", priority_score: 55.4, wsi_score: 45.2, severity: "warning", population: 84300, days_since_last_supply: 7, pending_requests: 0 },
    { village_name: "Savner", district: "Nagpur", priority_score: 52.1, wsi_score: 55.3, severity: "warning", population: 31200, days_since_last_supply: 10, pending_requests: 1 },
    { village_name: "Mauda", district: "Nagpur", priority_score: 48.5, wsi_score: 42.1, severity: "watch", population: 12500, days_since_last_supply: 5, pending_requests: 0 },
    { village_name: "Kalmeshwar", district: "Nagpur", priority_score: 45.2, wsi_score: 48.9, severity: "warning", population: 18200, days_since_last_supply: 8, pending_requests: 1 },
    { village_name: "Hingna", district: "Nagpur", priority_score: 32.1, wsi_score: 18.2, severity: "normal", population: 24600, days_since_last_supply: 4, pending_requests: 0 },
    { village_name: "Nagpur Rural", district: "Nagpur", priority_score: 28.5, wsi_score: 30.1, severity: "watch", population: 65000, days_since_last_supply: 6, pending_requests: 1 },
    { village_name: "Nagpur Urban", district: "Nagpur", priority_score: 15.2, wsi_score: 12.5, severity: "normal", population: 250000, days_since_last_supply: 2, pending_requests: 0 },
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
    // ── Real-time overview polling ──
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

    // ── Priority table polling ──
    const priorityFetcher = useCallback(() => api.getPriorities(8), []);
    const { data: priorities, refresh: refreshPriorities } = usePolling(
        priorityFetcher, 20000, demoPriorities
    );

    // ── WebSocket ──
    const { connected, lastEvent } = useWebSocket();

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
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>🛰️ Nagpur Command Center</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Official Smart Pilot — Nagpur District Water Management
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

            {/* Alert Ticker */}
            <div className="alert-ticker">
                <span className="ticker-dot" />
                <AlertTriangle size={16} color="#EF4444" />
                <span style={{ color: "#fca5a5" }}>
                    <strong>PILOT ALERT:</strong> {ov.critical_villages} Nagpur villages at Emergency status · {(ov.affected_population || 0).toLocaleString()} people needing immediate supply.
                </span>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {[
                    {
                        label: "Monitored Villages", value: ov.total_villages,
                        color: "#14b8a6", icon: MapPin, sub: "Coverage: All 14 Nagpur Talukas",
                    },
                    {
                        label: "Avg. Water Stress", value: ov.avg_wsi,
                        color: (ov.avg_wsi || 0) > 60 ? "#EF4444" : "#F59E0B",
                        icon: Droplets, sub: "Increasing in Katol Sector",
                    },
                    {
                        label: "Emergency Sites", value: ov.critical_villages,
                        color: "#EF4444", icon: AlertTriangle,
                        sub: `${(ov.affected_population || 0).toLocaleString()} pop. affected`,
                    },
                    {
                        label: "Tankers Active", value: `${ov.tankers?.on_trip ?? 0}/${ov.tankers?.total ?? 0}`,
                        color: "#3b82f6", icon: Truck,
                        sub: "Optimization level: HIGH",
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

            {/* Charts Row */}
            <div className="dashboard-grid">
                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.2 }}>
                    <div className="section-title">📉 Rainfall Deviation (Nagpur)</div>
                    <div style={{ padding: "1rem", height: 270 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={demoRainfall}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,85,99,0.3)" />
                                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
                                <Area type="monotone" dataKey="normal" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" />
                                <Area type="monotone" dataKey="actual" stroke="#14b8a6" fill="rgba(20,184,166,0.2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.25 }}>
                    <div className="section-title">🎯 Severity Distribution</div>
                    <div style={{ padding: "1rem", height: 270, display: "flex", alignItems: "center" }}>
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                                    {severityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, paddingLeft: "1rem" }}>
                            {severityData.map((e) => (
                                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.fill }} />
                                    <span style={{ fontSize: "0.75rem", color: "#9ca3af", flex: 1 }}>{e.name}</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{e.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.3 }}>
                    <div className="section-title">💧 Groundwater Deficit</div>
                    <div style={{ padding: "1rem", height: 270 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={demoGroundwater}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,85,99,0.3)" />
                                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis reversed tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[6, 16]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="level" stroke="#F59E0B" fill="rgba(245,158,11,0.1)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div className="glass-card" {...fadeInUp} transition={{ delay: 0.35 }}>
                    <div className="section-title">🚛 Tanker Fleet Status</div>
                    <div style={{ padding: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {[
                                { label: "Ready", value: ov.tankers?.available ?? 0, color: "#10B981", icon: CheckCircle },
                                { label: "In Transit", value: ov.tankers?.on_trip ?? 0, color: "#3b82f6", icon: Truck },
                                { label: "Service", value: ov.tankers?.maintenance ?? 0, color: "#F59E0B", icon: XCircle },
                                { label: "Nagpur Fleet", value: ov.tankers?.total ?? 0, color: "#8b5cf6", icon: Activity },
                            ].map((item) => (
                                <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "1rem", textAlign: "center", border: "1px solid var(--border-light)" }}>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                                    <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Priority Table */}
            <motion.div className="glass-card full-width" {...fadeInUp} transition={{ delay: 0.4 }} style={{ marginTop: "1rem" }}>
                <div className="section-title">
                    <span>🏆 High-Priority Nagpur Delivery Queue</span>
                    <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                        <Zap size={14} /> Auto-Optimize
                    </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Village</th>
                                <th>Priority</th>
                                <th>WSI</th>
                                <th>Severity</th>
                                <th>Population</th>
                                <th>Wait Time</th>
                                <th>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prio ?? []).map((v: any, i: number) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{v.village_name}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ flex: 1, background: "var(--border)", height: 6, width: 60, borderRadius: 3 }}>
                                                <div style={{ height: "100%", width: `${v.priority_score}%`, background: v.priority_score > 80 ? "#EF4444" : "#10B981", borderRadius: 3 }} />
                                            </div>
                                            <strong>{v.priority_score}</strong>
                                        </div>
                                    </td>
                                    <td>{v.wsi_score}</td>
                                    <td><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                                    <td>{(v.population || 0).toLocaleString()}</td>
                                    <td style={{ color: v.days_since_last_supply > 15 ? "#EF4444" : "inherit" }}>{v.days_since_last_supply} d</td>
                                    <td>{v.pending_requests}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
