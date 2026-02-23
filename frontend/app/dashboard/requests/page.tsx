"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Clock, CheckCircle, AlertCircle, Check, X, Send } from "lucide-react";
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
    { id: 1, village_name: "Katol", district: "Nagpur", requested_by: "Sarpanch Deshmukh", urgency: "critical", quantity_needed: 15000, reason: "Main Borewell dried up yesterday", status: "pending", created_at: "2026-02-22T08:30:00" },
    { id: 2, village_name: "Savner", district: "Nagpur", requested_by: "Sarpanch Patil", urgency: "high", quantity_needed: 10000, reason: "Public well level below safe limit", status: "approved", created_at: "2026-02-21T14:20:00" },
    { id: 3, village_name: "Kamptee", district: "Nagpur", requested_by: "Sarpanch Wankhede", urgency: "critical", quantity_needed: 20000, reason: "Acute drinking water shortage in Ward 4", status: "pending", created_at: "2026-02-22T06:15:00" },
    { id: 4, village_name: "Umred", district: "Nagpur", requested_by: "Sarpanch More", urgency: "medium", quantity_needed: 10000, reason: "Routine supply disruption", status: "scheduled", created_at: "2026-02-20T10:00:00" },
    { id: 5, village_name: "Parseoni", district: "Nagpur", requested_by: "Sarpanch Gadkari", urgency: "high", quantity_needed: 15000, reason: "Temple feast gathering excess need", status: "completed", created_at: "2026-02-18T09:30:00" },
];

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>(demoRequests);
    const [filter, setFilter] = useState("all");
    const [processing, setProcessing] = useState<number | null>(null);

    useEffect(() => {
        api.getRequests().then(data => {
            if (data?.length) setRequests(data);
        }).catch(() => { });
    }, []);

    const handleAction = (id: number, status: string) => {
        setProcessing(id);
        setTimeout(() => {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            setProcessing(null);
        }, 800);
    };

    const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>💧 Nagpur Water Requests</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Official Pilot — Approval & Dispatch Workflow
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
                <AnimatePresence mode="popLayout">
                    {filtered.map((r, i) => (
                        <motion.div key={r.id || i} className="glass-card" style={{ padding: "1.25rem" }}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{r.village_name}</span>
                                        <span className={`badge badge-${r.urgency === "critical" ? "critical" : r.urgency === "high" ? "warning" : "watch"}`}>
                                            {r.urgency}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 4 }}>
                                        Nagpur Pilot • Requested by: {r.requested_by}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{r.reason}</div>
                                    <div style={{ display: "flex", gap: "1.5rem", marginTop: 10, fontSize: "0.8rem", color: "#9ca3af" }}>
                                        <span><Droplets size={12} style={{ display: "inline" }} /> {(r.quantity_needed / 1000).toFixed(0)}K L</span>
                                        <span><Clock size={12} style={{ display: "inline" }} /> {new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                                    <span style={{
                                        padding: "6px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                        background: `${STATUS_COLORS[r.status]}20`,
                                        color: STATUS_COLORS[r.status],
                                        border: `1px solid ${STATUS_COLORS[r.status]}40`,
                                    }}>
                                        {r.status}
                                    </span>

                                    {r.status === "pending" && (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: "6px 10px", fontSize: "0.7rem", border: "1px solid #EF444420" }}
                                                onClick={() => handleAction(r.id, "rejected")}
                                                disabled={processing === r.id}
                                            >
                                                <X size={12} /> Reject
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: "6px 10px", fontSize: "0.7rem" }}
                                                onClick={() => handleAction(r.id, "approved")}
                                                disabled={processing === r.id}
                                            >
                                                <Check size={12} /> Approve
                                            </button>
                                        </div>
                                    )}

                                    {r.status === "approved" && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: "6px 12px", fontSize: "0.7rem", background: "#8b5cf6" }}
                                            onClick={() => handleAction(r.id, "scheduled")}
                                            disabled={processing === r.id}
                                        >
                                            <Send size={12} /> Schedule Tanker
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
