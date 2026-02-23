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
    { id: 1, name: "Yavatmal", district: "Yavatmal", latitude: 20.3888, longitude: 78.1204, population: 120000, wsi: { score: 78.5, severity: "critical" } },
    { id: 2, name: "Pusad", district: "Yavatmal", latitude: 19.9146, longitude: 77.5724, population: 52000, wsi: { score: 85.2, severity: "emergency" } },
    { id: 3, name: "Washim", district: "Washim", latitude: 20.1108, longitude: 77.1330, population: 58000, wsi: { score: 62.1, severity: "warning" } },
    { id: 4, name: "Akola", district: "Akola", latitude: 20.7096, longitude: 77.0075, population: 140000, wsi: { score: 45.8, severity: "warning" } },
    { id: 5, name: "Buldhana", district: "Buldhana", latitude: 20.5293, longitude: 76.1852, population: 62000, wsi: { score: 55.3, severity: "warning" } },
    { id: 6, name: "Risod", district: "Washim", latitude: 20.1008, longitude: 76.7666, population: 22000, wsi: { score: 88.5, severity: "emergency" } },
    { id: 7, name: "Akot", district: "Akola", latitude: 21.0981, longitude: 77.0536, population: 45000, wsi: { score: 82.1, severity: "critical" } },
    { id: 8, name: "Darwha", district: "Yavatmal", latitude: 20.3218, longitude: 77.7696, population: 31000, wsi: { score: 74.2, severity: "critical" } },
    { id: 9, name: "Wani", district: "Yavatmal", latitude: 20.0570, longitude: 78.9580, population: 38000, wsi: { score: 78.9, severity: "critical" } },
    { id: 10, name: "Nagpur", district: "Nagpur", latitude: 21.1458, longitude: 79.0882, population: 250000, wsi: { score: 18.3, severity: "normal" } },
    { id: 11, name: "Wardha", district: "Wardha", latitude: 20.7453, longitude: 78.6022, population: 55000, wsi: { score: 22.7, severity: "watch" } },
    { id: 12, name: "Digras", district: "Yavatmal", latitude: 20.1068, longitude: 77.7180, population: 28000, wsi: { score: 67.4, severity: "warning" } },
    { id: 13, name: "Achalpur", district: "Amravati", latitude: 21.2572, longitude: 77.5097, population: 68000, wsi: { score: 42.1, severity: "warning" } },
    { id: 14, name: "Amravati", district: "Amravati", latitude: 20.9320, longitude: 77.7523, population: 175000, wsi: { score: 58.3, severity: "warning" } },
    { id: 15, name: "Chandrapur", district: "Chandrapur", latitude: 19.9615, longitude: 79.2961, population: 95000, wsi: { score: 15.2, severity: "normal" } },
    { id: 16, name: "Bhandara", district: "Bhandara", latitude: 21.1667, longitude: 79.6500, population: 48000, wsi: { score: 12.5, severity: "normal" } },
    { id: 17, name: "Gondia", district: "Gondia", latitude: 21.4631, longitude: 80.1953, population: 42000, wsi: { score: 10.4, severity: "normal" } },
    { id: 18, name: "Gadchiroli", district: "Gadchiroli", latitude: 20.1809, longitude: 80.0005, population: 28000, wsi: { score: 32.4, severity: "watch" } },
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
                        Village-level Water Stress Index heatmap — Vidarbha Region
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
                        center={[20.5, 78.5]}
                        zoom={8}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
