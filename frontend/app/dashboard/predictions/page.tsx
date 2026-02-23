"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from "recharts";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
    normal: "#10B981", watch: "#F59E0B", warning: "#F97316",
    critical: "#EF4444", emergency: "#991B1B",
};

const demoPredictions = [
    { village_name: "Patoda", district: "Beed", current_wsi: 72.5, predicted_wsi: 88.5, current_severity: "critical", predicted_severity: "emergency", predicted_demand_liters: 294000, predicted_tanker_trips: 29, confidence: 0.87, trends: { rainfall_direction: "declining", groundwater_direction: "declining" } },
    { village_name: "Shirur Kasar", district: "Beed", current_wsi: 68.3, predicted_wsi: 82.1, current_severity: "warning", predicted_severity: "critical", predicted_demand_liters: 127500, predicted_tanker_trips: 12, confidence: 0.84, trends: { rainfall_direction: "declining", groundwater_direction: "declining" } },
    { village_name: "Wadwani", district: "Beed", current_wsi: 65.1, predicted_wsi: 78.9, current_severity: "warning", predicted_severity: "critical", predicted_demand_liters: 111000, predicted_tanker_trips: 11, confidence: 0.82, trends: { rainfall_direction: "declining", groundwater_direction: "declining" } },
    { village_name: "Kaij", district: "Beed", current_wsi: 61.4, predicted_wsi: 74.2, current_severity: "warning", predicted_severity: "critical", predicted_demand_liters: 261000, predicted_tanker_trips: 26, confidence: 0.85, trends: { rainfall_direction: "declining", groundwater_direction: "stable" } },
    { village_name: "Ashti", district: "Beed", current_wsi: 55.8, predicted_wsi: 69.8, current_severity: "warning", predicted_severity: "warning", predicted_demand_liters: 147600, predicted_tanker_trips: 14, confidence: 0.81, trends: { rainfall_direction: "declining", groundwater_direction: "declining" } },
    { village_name: "Dharur", district: "Beed", current_wsi: 52.3, predicted_wsi: 65.4, current_severity: "warning", predicted_severity: "warning", predicted_demand_liters: 133200, predicted_tanker_trips: 13, confidence: 0.80, trends: { rainfall_direction: "stable", groundwater_direction: "declining" } },
    { village_name: "Parli", district: "Beed", current_wsi: 58.2, predicted_wsi: 67.4, current_severity: "warning", predicted_severity: "warning", predicted_demand_liters: 264000, predicted_tanker_trips: 26, confidence: 0.83, trends: { rainfall_direction: "declining", groundwater_direction: "stable" } },
    { village_name: "Soygaon", district: "C.S.Nagar", current_wsi: 60.1, predicted_wsi: 72.7, current_severity: "warning", predicted_severity: "critical", predicted_demand_liters: 86400, predicted_tanker_trips: 8, confidence: 0.79, trends: { rainfall_direction: "declining", groundwater_direction: "declining" } },
];

export default function PredictionsPage() {
    const [predictions, setPredictions] = useState<any[]>(demoPredictions);
    const [daysAhead, setDaysAhead] = useState(30);

    useEffect(() => {
        api.getPredictions(daysAhead).then(data => {
            if (data?.length) setPredictions(data.slice(0, 12));
        }).catch(() => { });
    }, [daysAhead]);

    const escalating = predictions.filter(p =>
        SEVERITY_COLORS[p.predicted_severity] !== SEVERITY_COLORS[p.current_severity] &&
        (p.predicted_wsi > p.current_wsi)
    ).length;

    const chartData = predictions.slice(0, 8).map(p => ({
        name: p.village_name,
        current: p.current_wsi,
        predicted: p.predicted_wsi,
    }));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🔮 Drought Predictions</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        AI-powered WSI forecasting — {daysAhead}-day prediction horizon
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[30, 60, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDaysAhead(d)}
                            className={`btn ${daysAhead === d ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        >
                            <Calendar size={14} /> {d} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="stat-card">
                    <span className="stat-label">Prediction Horizon</span>
                    <div className="stat-value" style={{ color: "#14b8a6" }}>{daysAhead}d</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Villages Escalating</span>
                    <div className="stat-value" style={{ color: "#EF4444" }}>{escalating}</div>
                    <div className="stat-change" style={{ color: "#EF4444" }}>
                        <TrendingUp size={12} /> Severity increasing
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Total Tanker Trips</span>
                    <div className="stat-value" style={{ color: "#3b82f6" }}>
                        {predictions.reduce((s, p) => s + (p.predicted_tanker_trips || 0), 0)}
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Total Demand</span>
                    <div className="stat-value" style={{ color: "#F59E0B", fontSize: "1.5rem" }}>
                        {(predictions.reduce((s, p) => s + (p.predicted_demand_liters || 0), 0) / 1000000).toFixed(1)}M L
                    </div>
                </div>
            </div>

            {/* Comparison Chart */}
            <motion.div className="glass-card" style={{ marginBottom: "1.5rem" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="section-title">📊 Current vs Predicted WSI</div>
                <div style={{ padding: "1rem", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,85,99,0.3)" />
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} angle={-15} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="current" fill="#3b82f6" name="Current WSI" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="predicted" fill="#EF4444" name={`Predicted (${daysAhead}d)`} radius={[4, 4, 0, 0]} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Predictions Table */}
            <motion.div className="glass-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="section-title">
                    <span>📋 Village Predictions ({daysAhead}-Day Horizon)</span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{predictions.length} villages</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Village</th>
                                <th>District</th>
                                <th>Current WSI</th>
                                <th>Predicted WSI</th>
                                <th>Change</th>
                                <th>Severity</th>
                                <th>Demand (L)</th>
                                <th>Trips</th>
                                <th>Confidence</th>
                                <th>Trends</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((p, i) => {
                                const change = (p.predicted_wsi - p.current_wsi).toFixed(1);
                                const isEscalating = Number(change) > 0;
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: "#f9fafb" }}>{p.village_name}</td>
                                        <td>{p.district}</td>
                                        <td>{p.current_wsi?.toFixed(1)}</td>
                                        <td style={{ fontWeight: 700, color: SEVERITY_COLORS[p.predicted_severity] }}>
                                            {p.predicted_wsi?.toFixed(1)}
                                        </td>
                                        <td>
                                            <span style={{ color: isEscalating ? "#EF4444" : "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                                                {isEscalating ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {isEscalating ? "+" : ""}{change}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${p.predicted_severity}`}>{p.predicted_severity}</span>
                                        </td>
                                        <td>{(p.predicted_demand_liters / 1000).toFixed(0)}K</td>
                                        <td style={{ fontWeight: 700 }}>{p.predicted_tanker_trips}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                <div style={{ width: 40, background: "var(--border)", borderRadius: 4, height: 4 }}>
                                                    <div style={{ height: "100%", borderRadius: 4, width: `${(p.confidence || 0.8) * 100}%`, background: "#14b8a6" }} />
                                                </div>
                                                <span style={{ fontSize: "0.75rem" }}>{((p.confidence || 0.8) * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <span title="Rainfall" style={{ fontSize: "0.75rem", color: p.trends?.rainfall_direction === "declining" ? "#EF4444" : "#10B981" }}>
                                                    🌧{p.trends?.rainfall_direction === "declining" ? "↓" : "→"}
                                                </span>
                                                <span title="Groundwater" style={{ fontSize: "0.75rem", color: p.trends?.groundwater_direction === "declining" ? "#EF4444" : "#10B981" }}>
                                                    💧{p.trends?.groundwater_direction === "declining" ? "↓" : "→"}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
