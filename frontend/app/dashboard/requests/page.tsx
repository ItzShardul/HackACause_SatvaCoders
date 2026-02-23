"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    approved: "#3b82f6",
    scheduled: "#8b5cf6",
    in_progress: "#14b8a6",
    completed: "#10B981",
    rejected: "#EF4444",
};

const demoRequests = [
    { id: 1, village_name: "Patoda", district: "Beed", requested_by: "Sarpanch Patoda", urgency: "critical", quantity_needed: 15000, reason: "Borewell dried up", status: "pending", created_at: "2026-02-22T08:30:00" },
    { id: 2, village_name: "Kaij", district: "Beed", requested_by: "Sarpanch Kaij", urgency: "high", quantity_needed: 10000, reason: "No rainfall for 3 months", status: "approved", created_at: "2026-02-21T14:20:00" },
    { id: 3, village_name: "Wadwani", district: "Beed", requested_by: "Sarpanch Wadwani", urgency: "critical", quantity_needed: 20000, reason: "Drinking water shortage", status: "pending", created_at: "2026-02-22T06:15:00" },
    { id: 4, village_name: "Ashti", district: "Beed", requested_by: "Sarpanch Ashti", urgency: "medium", quantity_needed: 10000, reason: "Village well contaminated", status: "scheduled", created_at: "2026-02-20T10:00:00" },
    { id: 5, village_name: "Dharur", district: "Beed", requested_by: "Sarpanch Dharur", urgency: "high", quantity_needed: 15000, reason: "Livestock water needed", status: "completed", created_at: "2026-02-18T09:30:00" },
];

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>(demoRequests);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        api.getRequests().then(data => {
            if (data?.length) setRequests(data);
        }).catch(() => { });
    }, []);

    const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>💧 Water Requests</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Manage village water requests and supply tracking
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["all", "pending", "approved", "scheduled", "completed"].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.75rem", textTransform: "capitalize" }}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
                {filtered.map((r, i) => (
                    <motion.div key={r.id || i} className="glass-card" style={{ padding: "1.25rem" }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{r.village_name}</span>
                                    <span className={`badge badge-${r.urgency === "critical" ? "critical" : r.urgency === "high" ? "warning" : "watch"}`}>
                                        {r.urgency}
                                    </span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 4 }}>
                                    {r.district} • Requested by: {r.requested_by}
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{r.reason}</div>
                                <div style={{ display: "flex", gap: "1.5rem", marginTop: 10, fontSize: "0.8rem", color: "#9ca3af" }}>
                                    <span><Droplets size={12} style={{ display: "inline" }} /> {(r.quantity_needed / 1000).toFixed(0)}K L</span>
                                    <span><Clock size={12} style={{ display: "inline" }} /> {new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <span style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                background: `${STATUS_COLORS[r.status]}20`,
                                color: STATUS_COLORS[r.status],
                                border: `1px solid ${STATUS_COLORS[r.status]}40`,
                            }}>
                                {r.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
