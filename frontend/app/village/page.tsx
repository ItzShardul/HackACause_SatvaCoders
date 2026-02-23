"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Droplets, FileText, Clock, CheckCircle, AlertTriangle,
    Send, MapPin, Home, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

const demoVillageData = {
    name: "Patoda",
    district: "Beed",
    taluka: "Patoda",
    population: 9800,
    wsi: { score: 88.5, severity: "emergency" },
};

const SEVERITY_COLORS: Record<string, string> = {
    normal: "#10B981", watch: "#F59E0B", warning: "#F97316",
    critical: "#EF4444", emergency: "#991B1B",
};

export default function VillagePortal() {
    const [activeTab, setActiveTab] = useState("status");
    const [requestForm, setRequestForm] = useState({ urgency: "medium", quantity: 10000, reason: "" });
    const [grievanceForm, setGrievanceForm] = useState({ category: "delay", description: "" });
    const [submitted, setSubmitted] = useState<string | null>(null);

    const village = demoVillageData;
    const sev = village.wsi.severity;

    const tabs = [
        { id: "status", label: "Status", icon: Home },
        { id: "request", label: "Request Water", icon: Droplets },
        { id: "grievance", label: "Grievance", icon: FileText },
        { id: "tracking", label: "Track Request", icon: Clock },
    ];

    const submitRequest = async () => {
        setSubmitted("Your water request has been submitted successfully. Request ID: #WR-2026-0042");
        setTimeout(() => setSubmitted(null), 5000);
    };

    const submitGrievance = async () => {
        setSubmitted("Your grievance has been submitted. Grievance ID: #GR-2026-0018");
        setTimeout(() => setSubmitted(null), 5000);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Header */}
            <header style={{
                padding: "1rem 2rem",
                borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
                    }}>💧</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem" }}>JalMitra</div>
                        <div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Gram Panchayat Portal</div>
                    </div>
                </div>
                <Link href="/" style={{ fontSize: "0.8rem", color: "#14b8a6", textDecoration: "none" }}>← Back to Home</Link>
            </header>

            <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
                {/* Village Info */}
                <motion.div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <MapPin size={18} color="#14b8a6" />
                                <span style={{ fontWeight: 800, fontSize: "1.3rem" }}>{village.name}</span>
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                {village.district} • {village.taluka} • Pop: {village.population.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: SEVERITY_COLORS[sev] }}>{village.wsi.score}</div>
                            <span className={`badge badge-${sev}`}>{sev}</span>
                        </div>
                    </div>
                    {/* WSI Bar */}
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>
                            <span>Water Stress Index</span>
                            <span>{village.wsi.score}/100</span>
                        </div>
                        <div style={{ background: "var(--border)", borderRadius: 6, height: 10 }}>
                            <div style={{
                                height: "100%", borderRadius: 6, width: `${village.wsi.score}%`,
                                background: `linear-gradient(90deg, #10B981, #F59E0B, #EF4444)`,
                                transition: "width 1s ease"
                            }} />
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "var(--bg-card)", borderRadius: 12, padding: 4, border: "1px solid var(--border)" }}>
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "10px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600,
                            background: activeTab === tab.id ? "rgba(20,184,166,0.15)" : "transparent",
                            color: activeTab === tab.id ? "#14b8a6" : "#6b7280",
                            border: "none", cursor: "pointer", transition: "all 0.2s ease"
                        }}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Success message */}
                {submitted && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#34d399" }}>
                        <CheckCircle size={16} style={{ display: "inline", marginRight: 8 }} />
                        {submitted}
                    </motion.div>
                )}

                {/* Tab Content */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {activeTab === "status" && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📊 Village Water Status</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                {[
                                    { label: "Water Stress Level", value: village.wsi.severity.toUpperCase(), color: SEVERITY_COLORS[sev] },
                                    { label: "Next Scheduled Tanker", value: "Feb 25, 2026", color: "#3b82f6" },
                                    { label: "Last Supply", value: "18 days ago", color: "#F59E0B" },
                                    { label: "Pending Requests", value: "3", color: "#EF4444" },
                                ].map((item) => (
                                    <div key={item.label} style={{ background: "var(--glass)", borderRadius: 10, padding: "1rem", border: "1px solid var(--border-light)" }}>
                                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 6 }}>{item.label}</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: item.color }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "request" && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💧 Submit Water Request</h3>
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <label className="input-label">Urgency Level</label>
                                    <select className="input-field" value={requestForm.urgency} onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}>
                                        <option value="low">Low — Can wait 5+ days</option>
                                        <option value="medium">Medium — Need within 3 days</option>
                                        <option value="high">High — Need within 24 hours</option>
                                        <option value="critical">Critical — Emergency need now</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Quantity Needed (Liters)</label>
                                    <select className="input-field" value={requestForm.quantity} onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })}>
                                        <option value={5000}>5,000 L (1 small tanker)</option>
                                        <option value={10000}>10,000 L (1 standard tanker)</option>
                                        <option value={15000}>15,000 L (1 large tanker)</option>
                                        <option value={20000}>20,000 L (2 tankers)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Reason</label>
                                    <textarea className="input-field" rows={3} placeholder="Describe the water situation..." value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} style={{ resize: "vertical" }} />
                                </div>
                                <button onClick={submitRequest} className="btn btn-primary" style={{ justifyContent: "center" }}>
                                    <Send size={16} /> Submit Request
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "grievance" && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Submit Grievance</h3>
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <label className="input-label">Category</label>
                                    <select className="input-field" value={grievanceForm.category} onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}>
                                        <option value="delay">Delayed Supply</option>
                                        <option value="quality">Water Quality Issue</option>
                                        <option value="quantity">Insufficient Quantity</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea className="input-field" rows={4} placeholder="Describe your complaint..." value={grievanceForm.description} onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })} style={{ resize: "vertical" }} />
                                </div>
                                <button onClick={submitGrievance} className="btn btn-primary" style={{ justifyContent: "center" }}>
                                    <Send size={16} /> Submit Grievance
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "tracking" && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📍 Request Tracking</h3>
                            {[
                                { id: "WR-2026-0042", date: "Feb 22", status: "pending", urgency: "critical", qty: "15K L" },
                                { id: "WR-2026-0038", date: "Feb 18", status: "scheduled", urgency: "high", qty: "10K L" },
                                { id: "WR-2026-0031", date: "Feb 12", status: "completed", urgency: "medium", qty: "10K L" },
                            ].map((req) => (
                                <div key={req.id} style={{
                                    padding: "1rem", borderRadius: 10, marginBottom: 8,
                                    background: "var(--glass)", border: "1px solid var(--border-light)",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{req.id}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>{req.date} • {req.qty} • {req.urgency}</div>
                                    </div>
                                    <span style={{
                                        padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600,
                                        background: req.status === "completed" ? "rgba(16,185,129,0.15)" : req.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(139,92,246,0.15)",
                                        color: req.status === "completed" ? "#34d399" : req.status === "pending" ? "#fbbf24" : "#a78bfa",
                                        border: `1px solid ${req.status === "completed" ? "rgba(16,185,129,0.3)" : req.status === "pending" ? "rgba(245,158,11,0.3)" : "rgba(139,92,246,0.3)"}`,
                                    }}>
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
