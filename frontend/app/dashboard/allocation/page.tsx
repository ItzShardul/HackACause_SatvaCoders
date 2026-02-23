"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Zap, MapPin, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function AllocationPage() {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const runAllocation = async () => {
        setLoading(true);
        try {
            const data = await api.autoAllocate();
            setAllocations(data);
        } catch {
            // Demo data
            setAllocations([
                { village_name: "Patoda", district: "Beed", priority_score: 92.3, wsi_score: 88.5, severity: "emergency", recommended_liters: 14700, assigned_tanker: { registration: "MH-24-AB-4521", capacity: 15000, driver: "Suresh Patil", driver_phone: "9712345678" } },
                { village_name: "Shirur Kasar", district: "Beed", priority_score: 87.1, wsi_score: 82.1, severity: "critical", recommended_liters: 11050, assigned_tanker: { registration: "MH-20-CD-7890", capacity: 12000, driver: "Ramesh Jadhav", driver_phone: "9787654321" } },
                { village_name: "Wadwani", district: "Beed", priority_score: 83.5, wsi_score: 78.9, severity: "critical", recommended_liters: 9620, assigned_tanker: { registration: "MH-26-EF-1234", capacity: 10000, driver: "Ganesh Pawar", driver_phone: "9756789012" } },
                { village_name: "Kaij", district: "Beed", priority_score: 79.2, wsi_score: 74.2, severity: "critical", recommended_liters: 18850, assigned_tanker: { registration: "MH-31-GH-5678", capacity: 20000, driver: "Mahesh More", driver_phone: "9734567890" } },
                { village_name: "Ashti", district: "Beed", priority_score: 75.6, wsi_score: 69.8, severity: "warning", recommended_liters: 12300, assigned_tanker: { registration: "MH-24-IJ-9012", capacity: 15000, driver: "Dinesh Shinde", driver_phone: "9723456789" } },
            ]);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🚛 Smart Tanker Allocation</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Priority-based automated tanker allocation engine
                    </p>
                </div>
                <button className="btn btn-primary" onClick={runAllocation} disabled={loading}>
                    <Zap size={16} /> {loading ? "Allocating..." : "Run Auto-Allocation"}
                </button>
            </div>

            {/* Algorithm Explanation */}
            <motion.div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>⚙️ Allocation Algorithm</div>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    {[
                        { label: "Severity", weight: "40%", color: "#EF4444", desc: "WSI severity level" },
                        { label: "Population", weight: "30%", color: "#3b82f6", desc: "Village population" },
                        { label: "Days Since Supply", weight: "20%", color: "#F59E0B", desc: "Time since last delivery" },
                        { label: "Pending Requests", weight: "10%", color: "#8b5cf6", desc: "Unresolved requests" },
                    ].map((w) => (
                        <div key={w.label} style={{ flex: 1, minWidth: 150, background: "var(--glass)", borderRadius: 12, padding: "1rem", border: "1px solid var(--border-light)", textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: w.color }}>{w.weight}</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>{w.label}</div>
                            <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>{w.desc}</div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.8rem", color: "#9ca3af", fontStyle: "italic" }}>
                    Priority Score = (Severity × 0.4) + (Population × 0.3) + (Days Since Supply × 0.2) + (Pending Requests × 0.1)
                </div>
            </motion.div>

            {/* Allocation Results */}
            {allocations.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                        ✅ Allocated {allocations.length} tankers to priority villages
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
                        {allocations.map((a, i) => (
                            <motion.div key={i} className="glass-card" style={{ padding: "1.25rem" }}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{a.village_name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{a.district}</div>
                                    </div>
                                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8rem", marginBottom: 12 }}>
                                    <div><span style={{ color: "#6b7280" }}>Priority:</span> <strong>{a.priority_score}</strong></div>
                                    <div><span style={{ color: "#6b7280" }}>WSI:</span> <strong>{a.wsi_score}</strong></div>
                                    <div><span style={{ color: "#6b7280" }}>Need:</span> <strong>{(a.recommended_liters / 1000).toFixed(0)}K L</strong></div>
                                </div>

                                <div style={{
                                    background: "rgba(20, 184, 166, 0.08)", borderRadius: 10, padding: "0.75rem",
                                    border: "1px solid rgba(20, 184, 166, 0.2)"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: "#14b8a6", fontWeight: 600, marginBottom: 6 }}>
                                        <Truck size={14} style={{ display: "inline", marginRight: 4 }} />
                                        Assigned Tanker
                                    </div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{a.assigned_tanker.registration}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>
                                        {a.assigned_tanker.driver} • {a.assigned_tanker.capacity?.toLocaleString()}L
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {allocations.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                    <Truck size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>Click "Run Auto-Allocation" to start</div>
                    <div style={{ fontSize: "0.85rem", marginTop: 8 }}>The engine will match available tankers to highest-priority villages</div>
                </div>
            )}
        </div>
    );
}
