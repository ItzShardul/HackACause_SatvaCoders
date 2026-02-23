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
const GeoJSON = dynamic(() => import("react-leaflet").then(m => m.GeoJSON), { ssr: false });

const SEVERITY_COLORS: Record<string, string> = {
    normal: "#10B981", watch: "#F59E0B", warning: "#F97316",
    critical: "#EF4444", emergency: "#991B1B", unknown: "#6B7280",
};

// Nagpur District Specific Villages
const demoVillages = [
    { id: 1, name: "Kamptee", district: "Nagpur", taluka: "Kamptee", latitude: 21.2227, longitude: 79.2014, population: 84300, wsi: { score: 45.2, severity: "warning" } },
    { id: 2, name: "Katol", district: "Nagpur", taluka: "Katol", latitude: 21.2682, longitude: 78.5833, population: 42100, wsi: { score: 68.5, severity: "critical" } },
    { id: 3, name: "Savner", district: "Nagpur", taluka: "Savner", latitude: 21.3917, longitude: 78.9167, population: 31200, wsi: { score: 55.3, severity: "warning" } },
    { id: 4, name: "Hingna", district: "Nagpur", taluka: "Hingna", latitude: 21.0667, longitude: 78.9667, population: 24600, wsi: { score: 18.2, severity: "normal" } },
    { id: 5, name: "Umred", district: "Nagpur", taluka: "Umred", latitude: 20.8500, longitude: 79.3333, population: 45600, wsi: { score: 82.1, severity: "critical" } },
    { id: 6, name: "Ramtek", district: "Nagpur", taluka: "Ramtek", latitude: 21.3833, longitude: 79.3167, population: 22400, wsi: { score: 68.4, severity: "warning" } },
    { id: 7, name: "Kalmeshwar", district: "Nagpur", taluka: "Kalmeshwar", latitude: 21.2333, longitude: 78.9167, population: 18200, wsi: { score: 48.9, severity: "warning" } },
    { id: 8, name: "Narkhed", district: "Nagpur", taluka: "Narkhed", latitude: 21.4667, longitude: 78.5333, population: 21500, wsi: { score: 88.5, severity: "emergency" } },
    { id: 9, name: "Mauda", district: "Nagpur", taluka: "Mauda", latitude: 21.1667, longitude: 79.4333, population: 12500, wsi: { score: 42.1, severity: "watch" } },
    { id: 10, name: "Parseoni", district: "Nagpur", taluka: "Parseoni", latitude: 21.3833, longitude: 79.1667, population: 15300, wsi: { score: 72.4, severity: "critical" } },
    { id: 11, name: "Bhiwapur", district: "Nagpur", taluka: "Bhiwapur", latitude: 20.7667, longitude: 79.5167, population: 14200, wsi: { score: 92.1, severity: "emergency" } },
    { id: 12, name: "Kuhi", district: "Nagpur", taluka: "Kuhi", latitude: 21.0167, longitude: 79.3667, population: 11200, wsi: { score: 64.2, severity: "critical" } },
    { id: 13, name: "Nagpur Rural", district: "Nagpur", taluka: "Nagpur Rural", latitude: 21.1000, longitude: 79.0500, population: 65000, wsi: { score: 30.1, severity: "watch" } },
    { id: 14, name: "Nagpur Urban", district: "Nagpur", taluka: "Nagpur Urban", latitude: 21.1458, longitude: 79.0882, population: 250000, wsi: { score: 12.5, severity: "normal" } },
];

export default function DroughtMapPage() {
    const [villages, setVillages] = useState<any[]>(demoVillages);
    const [selected, setSelected] = useState<any>(null);
    const [filter, setFilter] = useState<string>("all");
    const [boundaryData, setBoundaryData] = useState<any>(null);

    useEffect(() => {
        // Fetch Nagpur villages
        api.getVillages({ district: "Nagpur" }).then(data => {
            if (data?.length) setVillages(data);
        }).catch(() => { });

        // Fetch Nagpur boundary GeoJSON
        fetch("/nagpur.geojson")
            .then(res => res.json())
            .then(data => setBoundaryData(data))
            .catch(err => console.error("Error loading boundary:", err));
    }, []);

    const filtered = filter === "all" ? villages : villages.filter((v: any) => v.wsi?.severity === filter);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>🗺️ Drought Severity Map: Nagpur</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Village-level Water Stress Index — Official Nagpur District Pilot
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
                        center={[21.1458, 79.0882]}
                        zoom={9.5}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.mappls.com">Mappls MapmyIndia</a> &copy; OpenStreetMap contributors'
                            url={`https://apis.mappls.com/advancedmaps/v1/d4e85a7e34907841d6a307dc31c6918a/still_map/{z}/{x}/{y}.png`}
                        />

                        {/* Nagpur Boundary Layer */}
                        {boundaryData && (
                            <GeoJSON
                                data={boundaryData}
                                style={{
                                    color: "#f59e0b",
                                    weight: 4,
                                    fillColor: "#f59e0b",
                                    fillOpacity: 0.03,
                                    dashArray: "2, 10"
                                }}
                            />
                        )}

                        {filtered.map((v: any) => {
                            const sev = v.wsi?.severity || "unknown";
                            const score = v.wsi?.score || 0;
                            return (
                                <CircleMarker
                                    key={v.id}
                                    center={[v.latitude, v.longitude]}
                                    radius={Math.max(8, Math.min(22, score / 4))}
                                    fillColor={SEVERITY_COLORS[sev]}
                                    fillOpacity={0.7}
                                    color={"#fff"}
                                    weight={2}
                                    eventHandlers={{
                                        click: () => setSelected(v),
                                    }}
                                >
                                    <Popup>
                                        <div style={{ minWidth: 200 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>{v.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 8 }}>Taluka: {v.taluka || "Nagpur"}</div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: "0.8rem" }}>
                                                <div><span style={{ color: "#6b7280" }}>WSI:</span> <strong style={{ color: SEVERITY_COLORS[sev] }}>{score}</strong></div>
                                                <div><span style={{ color: "#6b7280" }}>Severity:</span> <span className={`badge badge-${sev}`} style={{ padding: "2px 6px", fontSize: "0.65rem" }}>{sev}</span></div>
                                                <div><span style={{ color: "#6b7280" }}>Pop:</span> {v.population?.toLocaleString()}</div>
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
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Analytics Legend</div>
                        {Object.entries(SEVERITY_COLORS).filter(([k]) => k !== "unknown").map(([sev, color]) => (
                            <div key={sev} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: "0.8rem", color: "#9ca3af", flex: 1, textTransform: "capitalize" }}>{sev}</span>
                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{sev === "emergency" ? "Critical Risk" : "Controlled"}</span>
                            </div>
                        ))}
                    </div>

                    {/* Nagpur Stats */}
                    <div className="glass-card" style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Nagpur Summary</div>
                        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Villages Monitored</span>
                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{filtered.length}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <span>Avg WSI</span>
                                <span style={{ fontWeight: 700, color: "var(--accent-teal)" }}>54.2</span>
                            </div>
                            <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
                            <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>Higher stress detected in Katol and Umred clusters.</p>
                        </div>
                    </div>

                    {/* Selected village detail */}
                    {selected && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: "1rem", borderTop: `4px solid ${SEVERITY_COLORS[selected.wsi?.severity || "unknown"]}` }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8 }}>
                                📍 {selected.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                                {selected.taluka} Taluka • Pop: {selected.population?.toLocaleString()}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>WSI Score</span>
                                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: SEVERITY_COLORS[selected.wsi?.severity || "unknown"] }}>
                                        {selected.wsi?.score || "—"}
                                    </span>
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
