"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle, AlertCircle, Check } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = { delay: "⏰", quality: "🧪", quantity: "📏", other: "📝" };
const STATUS_COLORS: Record<string, string> = { open: "#EF4444", in_progress: "#F59E0B", resolved: "#10B981" };

const demoGrievances = [
    { id: 1, village_name: "Katol", submitted_by: "Rahul G.", category: "delay", description: "Tanker did not arrive on scheduled date for 2 days", status: "open", created_at: "2026-02-22T10:00:00" },
    { id: 2, village_name: "Savner", submitted_by: "Priya S.", category: "quality", description: "Water delivered today was brownish and sandy", status: "in_progress", created_at: "2026-02-20T08:30:00" },
    { id: 3, village_name: "Kamptee", submitted_by: "Sanjay W.", category: "quantity", description: "Only 5000L delivered instead of requested 10000L", status: "open", created_at: "2026-02-21T14:00:00" },
    { id: 4, village_name: "Umred", submitted_by: "Anita D.", category: "delay", description: "No response to our water request for 5 days", status: "resolved", created_at: "2026-02-15T09:00:00", resolution: "Tanker MH-31-TR-1021 dispatched on priority" },
    { id: 5, village_name: "Ramtek", submitted_by: "Manoj K.", category: "quality", description: "Water has a strange metallic smell", status: "open", created_at: "2026-02-23T07:15:00" },
];

export default function GrievancesPage() {
    const [grievances, setGrievances] = useState<any[]>(demoGrievances);
    const [filter, setFilter] = useState("all");
    const [resolving, setResolving] = useState<number | null>(null);

    useEffect(() => {
        api.getGrievances().then(data => {
            if (data?.length) setGrievances(data);
        }).catch(() => { });
    }, []);

    const handleResolve = (id: number) => {
        setResolving(id);
        // Simulate API call
        setTimeout(() => {
            setGrievances(prev => prev.map(g =>
                g.id === id ? { ...g, status: "resolved", resolution: "Issue investigated and resolved by Nagpur Control Room." } : g
            ));
            setResolving(null);
        }, 1000);
    };

    const filtered = filter === "all" ? grievances : grievances.filter(g => g.status === filter);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>📋 Nagpur Grievance Redressal</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Nagpur District Pilot — Official Resolution Tracking
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["all", "open", "in_progress", "resolved"].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.75rem", textTransform: "capitalize" }}>
                            {f.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
                {filtered.map((g, i) => (
                    <motion.div key={g.id || i} className="glass-card" style={{ padding: "1.25rem" }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontSize: "1.2rem" }}>{CATEGORY_ICONS[g.category] || "📝"}</span>
                                    <span style={{ fontWeight: 700 }}>{g.village_name}</span>
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "capitalize" }}>• {g.category}</span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 6 }}>{g.description}</div>
                                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                    <Clock size={12} style={{ display: "inline" }} /> {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(g.created_at).toLocaleDateString()} • {g.submitted_by}
                                </div>
                                {g.resolution && (
                                    <div style={{ marginTop: 8, padding: 8, background: "rgba(16,185,129,0.08)", borderRadius: 8, fontSize: "0.8rem", color: "#34d399" }}>
                                        ✅ Resolution: {g.resolution}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                                <span style={{
                                    padding: "6px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                    background: `${STATUS_COLORS[g.status]}20`,
                                    color: STATUS_COLORS[g.status],
                                    border: `1px solid ${STATUS_COLORS[g.status]}40`,
                                }}>
                                    {g.status.replace("_", " ")}
                                </span>
                                {g.status !== "resolved" && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: "6px 12px", fontSize: "0.7rem" }}
                                        onClick={() => handleResolve(g.id)}
                                        disabled={resolving === g.id}
                                    >
                                        <Check size={14} /> {resolving === g.id ? "Resolving..." : "Resolve Now"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
