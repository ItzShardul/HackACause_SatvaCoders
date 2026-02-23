"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

// Leaflet must be client-side only
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

const SEVERITY_COLORS: Record<string, string> = {
    normal: "#10B981", watch: "#F59E0B", warning: "#F97316",
    critical: "#EF4444", emergency: "#991B1B", unknown: "#6B7280",
};

const demoVillages = [
    { id: 1, name: "Paithan", district: "Chhatrapati Sambhajinagar", latitude: 19.4767, longitude: 75.385, population: 35207, wsi: { score: 35.2, severity: "watch" } },
    { id: 2, name: "Beed", district: "Beed", latitude: 18.9891, longitude: 75.7601, population: 45332, wsi: { score: 62.1, severity: "warning" } },
    { id: 3, name: "Latur", district: "Latur", latitude: 18.3968, longitude: 76.5604, population: 52000, wsi: { score: 45.8, severity: "warning" } },
    { id: 4, name: "Osmanabad", district: "Dharashiv", latitude: 18.186, longitude: 76.04, population: 41200, wsi: { score: 55.3, severity: "warning" } },
    { id: 5, name: "Jalna", district: "Jalna", latitude: 19.8347, longitude: 75.8816, population: 38500, wsi: { score: 28.5, severity: "watch" } },
    { id: 6, name: "Patoda", district: "Beed", latitude: 19.22, longitude: 75.55, population: 9800, wsi: { score: 88.5, severity: "emergency" } },
    { id: 7, name: "Shirur Kasar", district: "Beed", latitude: 19.31, longitude: 75.93, population: 8500, wsi: { score: 82.1, severity: "critical" } },
    { id: 8, name: "Kaij", district: "Beed", latitude: 18.85, longitude: 75.98, population: 14500, wsi: { score: 74.2, severity: "critical" } },
    { id: 9, name: "Wadwani", district: "Beed", latitude: 18.71, longitude: 76.05, population: 7400, wsi: { score: 78.9, severity: "critical" } },
    { id: 10, name: "Nanded", district: "Nanded", latitude: 19.1383, longitude: 77.321, population: 55000, wsi: { score: 18.3, severity: "normal" } },
    { id: 11, name: "Hingoli", district: "Hingoli", latitude: 19.715, longitude: 77.15, population: 23000, wsi: { score: 22.7, severity: "watch" } },
    { id: 12, name: "Parli", district: "Beed", latitude: 18.85, longitude: 76.53, population: 22000, wsi: { score: 67.4, severity: "warning" } },
    { id: 13, name: "Udgir", district: "Latur", latitude: 18.393, longitude: 77.116, population: 28300, wsi: { score: 42.1, severity: "warning" } },
    { id: 14, name: "Ambad", district: "Jalna", latitude: 19.61, longitude: 75.95, population: 18200, wsi: { score: 58.3, severity: "warning" } },
    { id: 15, name: "Nilanga", district: "Latur", latitude: 18.12, longitude: 76.75, population: 24800, wsi: { score: 51.2, severity: "warning" } },
    { id: 16, name: "Tuljapur", district: "Dharashiv", latitude: 18.01, longitude: 76.07, population: 27600, wsi: { score: 38.9, severity: "watch" } },
    { id: 17, name: "Sillod", district: "Chhatrapati Sambhajinagar", latitude: 20.3, longitude: 75.65, population: 25300, wsi: { score: 32.4, severity: "watch" } },
    { id: 18, name: "Ashti", district: "Beed", latitude: 18.99, longitude: 76.17, population: 12300, wsi: { score: 69.8, severity: "warning" } },
    { id: 19, name: "Dharur", district: "Beed", latitude: 18.82, longitude: 76.28, population: 11100, wsi: { score: 65.4, severity: "warning" } },
    { id: 20, name: "Soygaon", district: "Chhatrapati Sambhajinagar", latitude: 20.47, longitude: 75.41, population: 7200, wsi: { score: 72.7, severity: "critical" } },
];

export default function DroughtMapPage() {
    const [villages, setVillages] = useState<any[]>(demoVillages);
    const [selected, setSelected] = useState<any>(null);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        api.getVillages().then(data => {
            if (data?.length) setVillages(data);
        }).catch(() => { });
    }, []);

    const filtered = filter === "all" ? villages : villages.filter((v: any) => v.wsi?.severity === filter);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🗺️ Drought Severity Map</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Village-level Water Stress Index heatmap — Marathwada Region
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["all", "emergency", "critical", "warning", "watch", "normal"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "6px 12px", fontSize: "0.75rem", textTransform: "capitalize" }}
                        >
                            {f === "all" ? "All" : f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
                {/* Map */}
                <motion.div
                    className="glass-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ height: "calc(100vh - 200px)", overflow: "hidden" }}
                >
                    <MapContainer
                        center={[19.2, 76.2]}
                        zoom={8}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {filtered.map((v: any) => {
                            const sev = v.wsi?.severity || "unknown";
                            const score = v.wsi?.score || 0;
                            return (
                                <CircleMarker
                                    key={v.id}
                                    center={[v.latitude, v.longitude]}
                                    radius={Math.max(6, Math.min(18, score / 5))}
                                    fillColor={SEVERITY_COLORS[sev]}
                                    fillOpacity={0.7}
                                    color={SEVERITY_COLORS[sev]}
                                    weight={2}
                                    eventHandlers={{
                                        click: () => setSelected(v),
                                    }}
                                >
                                    <Popup>
                                        <div style={{ minWidth: 200 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>{v.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 8 }}>{v.district} • {v.taluka || ""}</div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: "0.8rem" }}>
                                                <div><span style={{ color: "#6b7280" }}>WSI:</span> <strong style={{ color: SEVERITY_COLORS[sev] }}>{score}</strong></div>
                                                <div><span style={{ color: "#6b7280" }}>Severity:</span> <span className={`badge badge-${sev}`} style={{ padding: "2px 6px", fontSize: "0.65rem" }}>{sev}</span></div>
                                                <div><span style={{ color: "#6b7280" }}>Pop:</span> {v.population?.toLocaleString()}</div>
                                                <div><span style={{ color: "#6b7280" }}>Source:</span> {v.primary_water_source || "—"}</div>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </motion.div>

                {/* Side Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Legend */}
                    <div className="glass-card" style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>WSI Legend</div>
                        {Object.entries(SEVERITY_COLORS).filter(([k]) => k !== "unknown").map(([sev, color]) => (
                            <div key={sev} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: "0.8rem", color: "#9ca3af", flex: 1, textTransform: "capitalize" }}>{sev}</span>
                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                    {sev === "normal" && "0-20"}
                                    {sev === "watch" && "20-40"}
                                    {sev === "warning" && "40-60"}
                                    {sev === "critical" && "60-80"}
                                    {sev === "emergency" && "80-100"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="glass-card" style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Quick Stats</div>
                        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Total on map</span>
                                <span style={{ fontWeight: 700, color: "#f9fafb" }}>{filtered.length}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Emergency</span>
                                <span style={{ fontWeight: 700, color: "#991B1B" }}>{filtered.filter((v: any) => v.wsi?.severity === "emergency").length}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Critical</span>
                                <span style={{ fontWeight: 700, color: "#EF4444" }}>{filtered.filter((v: any) => v.wsi?.severity === "critical").length}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Warning</span>
                                <span style={{ fontWeight: 700, color: "#F97316" }}>{filtered.filter((v: any) => v.wsi?.severity === "warning").length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected village detail */}
                    {selected && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: "1rem" }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8 }}>
                                📍 {selected.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                                {selected.district} • Pop: {selected.population?.toLocaleString()}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>WSI Score</span>
                                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: SEVERITY_COLORS[selected.wsi?.severity || "unknown"] }}>
                                        {selected.wsi?.score || "—"}
                                    </span>
                                </div>
                                <div style={{ background: "var(--border)", borderRadius: 4, height: 8, marginBottom: 8 }}>
                                    <div style={{
                                        height: "100%", borderRadius: 4,
                                        width: `${selected.wsi?.score || 0}%`,
                                        background: SEVERITY_COLORS[selected.wsi?.severity || "unknown"],
                                    }} />
                                </div>
                                <span className={`badge badge-${selected.wsi?.severity || "unknown"}`}>
                                    {selected.wsi?.severity || "unknown"}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
