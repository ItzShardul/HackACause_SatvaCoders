"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Zap, MapPin, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AllocationPage() {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [bulkDispatching, setBulkDispatching] = useState(false);
    const [dispatchedCount, setDispatchedCount] = useState(0);

    const runAllocation = async () => {
        setLoading(true);
        setDispatchedCount(0);
        try {
            const data = await api.autoAllocate();
            setAllocations(data);
        } catch {
            // Demo data for Nagpur Pilot
            setAllocations([
                { id: 101, village_name: "Katol", district: "Nagpur", priority_score: 94.2, wsi_score: 88.5, severity: "emergency", recommended_liters: 14700, assigned_tanker: { registration: "MH-31-TR-1021", capacity: 15000, driver: "Sachin Tayade", driver_phone: "8459468626" } },
                { id: 102, village_name: "Narkhed", district: "Nagpur", priority_score: 91.5, wsi_score: 87.2, severity: "emergency", recommended_liters: 11200, assigned_tanker: { registration: "MH-40-TR-4455", capacity: 12000, driver: "Anil Raut", driver_phone: "8459468626" } },
                { id: 103, village_name: "Bhiwapur", district: "Nagpur", priority_score: 88.3, wsi_score: 91.5, severity: "emergency", recommended_liters: 19500, assigned_tanker: { registration: "MH-49-TR-7788", capacity: 20000, driver: "Pramod Mankar", driver_phone: "8459468626" } },
                { id: 104, village_name: "Savner", district: "Nagpur", priority_score: 85.1, wsi_score: 82.1, severity: "critical", recommended_liters: 11050, assigned_tanker: { registration: "MH-31-TR-8890", capacity: 12000, driver: "Vijay Deshmukh", driver_phone: "8459468626" } },
                { id: 105, village_name: "Umred", district: "Nagpur", priority_score: 82.5, wsi_score: 78.9, severity: "critical", recommended_liters: 9620, assigned_tanker: { registration: "MH-31-TR-1234", capacity: 10000, driver: "Rohan Patil", driver_phone: "8459468626" } },
                { id: 106, village_name: "Kamptee", district: "Nagpur", priority_score: 79.2, wsi_score: 74.2, severity: "critical", recommended_liters: 18850, assigned_tanker: { registration: "MH-31-TR-5678", capacity: 20000, driver: "Rahul Gondane", driver_phone: "8459468626" } },
                { id: 107, village_name: "Parseoni", district: "Nagpur", priority_score: 76.4, wsi_score: 72.4, severity: "critical", recommended_liters: 11000, assigned_tanker: { registration: "MH-40-TR-2233", capacity: 12000, driver: "Sanjay Wankhede", driver_phone: "8459468626" } },
                { id: 108, village_name: "Kuhi", district: "Nagpur", priority_score: 73.1, wsi_score: 64.2, severity: "warning", recommended_liters: 9500, assigned_tanker: { registration: "MH-31-TR-9900", capacity: 10000, driver: "Nitin Meshram", driver_phone: "8459468626" } },
                { id: 109, village_name: "Ramtek", district: "Nagpur", priority_score: 68.4, wsi_score: 68.4, severity: "warning", recommended_liters: 14000, assigned_tanker: { registration: "MH-49-TR-1122", capacity: 15000, driver: "Vilas Thakre", driver_phone: "8459468626" } },
                { id: 110, village_name: "Mauda", district: "Nagpur", priority_score: 55.2, wsi_score: 42.1, severity: "watch", recommended_liters: 11500, assigned_tanker: { registration: "MH-31-TR-3344", capacity: 12000, driver: "Santosh Patil", driver_phone: "8459468626" } },
                { id: 111, village_name: "Kalmeshwar", district: "Nagpur", priority_score: 52.1, wsi_score: 48.9, severity: "warning", recommended_liters: 9800, assigned_tanker: { registration: "MH-40-TR-5566", capacity: 10000, driver: "Sunil Gawai", driver_phone: "8459468626" } },
                { id: 112, village_name: "Hingna", district: "Nagpur", priority_score: 42.5, wsi_score: 18.2, severity: "normal", recommended_liters: 14500, assigned_tanker: { registration: "MH-31-TR-9012", capacity: 15000, driver: "Amol Wankhede", driver_phone: "8459468626" } },
            ]);
        }
        setLoading(false);
    };

    const handleBulkDispatch = async () => {
        setBulkDispatching(true);
        for (let i = 0; i < allocations.length; i++) {
            const a = allocations[i];
            const driverData = {
                driver_name: a.assigned_tanker.driver,
                driver_phone: a.assigned_tanker.driver_phone,
                village_name: a.village_name,
                depot: { lat: 21.1458, lng: 79.0882 },
                stops: [{ village_name: a.village_name, lat: 21.0, lng: 79.0, demand: a.recommended_liters }], // Simplified for demo
                quantity: a.recommended_liters
            };

            try {
                await api.dispatchTanker(driverData);
                setDispatchedCount(prev => prev + 1);
            } catch (e) {
                console.error("Dispatch failed for", a.village_name);
            }
            // Small delay to simulate sequential sending
            await new Promise(r => setTimeout(r, 600));
        }
        setBulkDispatching(false);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🚛 Smart Tanker Allocation</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Nagpur Pilot — Priority Matching Engine
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    {allocations.length > 0 && (
                        <button
                            className="btn btn-secondary"
                            style={{ background: dispatchedCount === allocations.length ? "#10B981" : "rgba(20,184,166,0.1)", border: "1px solid #14b8a650" }}
                            onClick={handleBulkDispatch}
                            disabled={bulkDispatching || dispatchedCount === allocations.length}
                        >
                            {bulkDispatching ? <Zap size={16} className="animate-pulse" /> : dispatchedCount === allocations.length ? <CheckCircle2 size={16} /> : <Send size={16} />}
                            {bulkDispatching ? `Dispatching (${dispatchedCount}/${allocations.length})...` : dispatchedCount === allocations.length ? "All Dispatched" : "Bulk Notify Drivers"}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={runAllocation} disabled={loading}>
                        <Zap size={16} /> {loading ? "Computing..." : "Run Auto-Allocation"}
                    </button>
                </div>
            </div>

            {/* Algorithm Explanation */}
            <motion.div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>⚙️ Nagpur WSI Weighted Algorithm</div>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    {[
                        { label: "Severity", weight: "40%", color: "#EF4444", desc: "WSI severity level" },
                        { label: "Population", weight: "30%", color: "#3b82f6", desc: "Village population" },
                        { label: "Water History", weight: "20%", color: "#F59E0B", desc: "Days since last supply" },
                        { label: "Requests", weight: "10%", color: "#8b5cf6", desc: "Administrative priority" },
                    ].map((w) => (
                        <div key={w.label} style={{ flex: 1, minWidth: 150, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "1rem", border: "1px solid var(--border-light)", textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: w.color }}>{w.weight}</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>{w.label}</div>
                            <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>{w.desc}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Allocation Results */}
            <AnimatePresence>
                {allocations.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                            ✅ Match Found: {allocations.length} Tankers Assigned
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1rem" }}>
                            {allocations.map((a, i) => (
                                <motion.div key={i} className="glass-card" style={{ padding: "1.25rem" }}
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{a.village_name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{a.district}, Maharashtra</div>
                                        </div>
                                        <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.80rem", marginBottom: 12 }}>
                                        <div><span style={{ color: "#6b7280" }}>Priority:</span> <strong>{a.priority_score}%</strong></div>
                                        <div><span style={{ color: "#6b7280" }}>Scored WSI:</span> <strong>{a.wsi_score}</strong></div>
                                        <div><span style={{ color: "#6b7280" }}>Volume Req:</span> <strong>{(a.recommended_liters / 1000).toFixed(0)}K L</strong></div>
                                    </div>

                                    <div style={{
                                        background: "rgba(20, 184, 166, 0.05)", borderRadius: 10, padding: "0.75rem",
                                        border: "1px solid rgba(20, 184, 166, 0.15)", position: "relative", overflow: "hidden"
                                    }}>
                                        {i < dispatchedCount && (
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(16,185,129,0.05)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
                                                <div style={{ background: "#10B981", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 800 }}>DISPATCHED ✅</div>
                                            </div>
                                        )}
                                        <div style={{ fontSize: "0.75rem", color: "#14b8a6", fontWeight: 600, marginBottom: 4 }}>
                                            <Truck size={14} style={{ display: "inline", marginRight: 6 }} />
                                            Optimal Carrier Assigned
                                        </div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                                            <span>{a.assigned_tanker.registration}</span>
                                            <span style={{ color: "#9ca3af", fontWeight: 400 }}>{a.assigned_tanker.capacity?.toLocaleString()}L</span>
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                                            Driver: {a.assigned_tanker.driver}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {allocations.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                    <Truck size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>Ready for Nagpur Pilot Dispatch</div>
                    <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Matching engine will optimize {allocations.length} pending critical sites</div>
                </div>
            )}
        </div>
    );
}
