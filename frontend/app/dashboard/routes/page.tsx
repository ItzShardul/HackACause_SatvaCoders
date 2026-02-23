"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, Clock, Truck, ChevronRight, Navigation, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

const ROUTE_COLORS = ["#14b8a6", "#3b82f6", "#F59E0B", "#8b5cf6", "#EF4444", "#EC4899"];

export default function RoutesPage() {
    const [routesData, setRoutesData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dispatching, setDispatching] = useState<number | null>(null);
    const [dispatchStatus, setDispatchStatus] = useState<Record<number, string>>({});
    const [numVehicles, setNumVehicles] = useState(3);
    const [roadPaths, setRoadPaths] = useState<Record<number, any[]>>({});
    const [selectedTanker, setSelectedTanker] = useState<number | null>(null);

    const optimize = async () => {
        setLoading(true);
        setRoadPaths({});
        setDispatchStatus({});
        try {
            const data = await api.optimizeRoutes(undefined, numVehicles);
            setRoutesData(data);

            if (data.routes) {
                data.routes.forEach(async (route: any, idx: number) => {
                    await fetchRoadPath(route, idx, data.depot || { lat: 21.1458, lng: 79.0882 });
                });
            }
        } catch (err) {
            console.error("Optimization failed:", err);
        }
        setLoading(false);
    };

    const handleDispatch = async (route: any, idx: number) => {
        setDispatching(idx);
        try {
            // Mock driver data (in production this would come from the Tanker model)
            const driverData = {
                driver_name: `Driver ${idx + 1}`,
                driver_phone: "8459468626", // Replace with your test number if needed
                village_name: route.stops[0].village_name,
                depot: routesData.depot,
                stops: route.stops,
                quantity: route.stops.reduce((acc: number, s: any) => acc + s.demand, 0)
            };

            const res = await api.dispatchTanker(driverData);
            if (res.status === "success") {
                setDispatchStatus(prev => ({ ...prev, [idx]: "success" }));
            } else {
                setDispatchStatus(prev => ({ ...prev, [idx]: "error" }));
            }
        } catch (err) {
            setDispatchStatus(prev => ({ ...prev, [idx]: "error" }));
        }
        setDispatching(null);
    };

    const fetchRoadPath = async (route: any, tankerIdx: number, depot: any) => {
        const fullPath: any[] = [];
        let currentPos = [depot.lat, depot.lng];

        for (const stop of route.stops) {
            try {
                const step = await api.getRoute(currentPos as [number, number], [stop.lat, stop.lng]);
                const coords = step.coordinates.map((c: any) => [c[1], c[0]]);
                fullPath.push(...coords);
                currentPos = [stop.lat, stop.lng];
            } catch (e) {
                fullPath.push(currentPos, [stop.lat, stop.lng]);
                currentPos = [stop.lat, stop.lng];
            }
        }

        try {
            const lastStep = await api.getRoute(currentPos as [number, number], [depot.lat, depot.lng]);
            const lastCoords = lastStep.coordinates.map((c: any) => [c[1], c[0]]);
            fullPath.push(...lastCoords);
        } catch {
            fullPath.push(currentPos, [depot.lat, depot.lng]);
        }

        setRoadPaths(prev => ({ ...prev, [tankerIdx]: fullPath }));
    };

    const L = typeof window !== 'undefined' ? require('leaflet') : null;
    const depotIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075908.png',
        iconSize: [32, 32], iconAnchor: [16, 32]
    }) : null;

    const tankerIcon = (color: string) => L ? new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }) : null;

    return (
        <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
            <div className="page-header" style={{ marginBottom: 0, borderBottom: "none" }}>
                <div>
                    <h1>⚡ Smart Route Optimizer</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Multi-stop VRP Solver & WhatsApp Driver Dispatch System
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div className="glass-card" style={{ padding: "4px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Fleet:</span>
                        <select value={numVehicles} onChange={(e) => setNumVehicles(Number(e.target.value))}
                            style={{ background: "transparent", border: "none", color: "#f9fafb", fontSize: "0.85rem", outline: "none", fontWeight: 700 }}>
                            {[2, 3, 4, 5, 8].map(n => <option key={n} value={n} style={{ background: "#111827" }}>{n} Tankers</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={optimize} disabled={loading} style={{ minWidth: 160 }}>
                        <Zap size={16} fill={loading ? "white" : "none"} /> {loading ? "Computing..." : "Optimize Routes"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem", flex: 1, overflow: "hidden", marginTop: "1rem" }}>
                {/* Side Panel */}
                <div style={{ overflowY: "auto", paddingRight: "0.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <AnimatePresence>
                        {routesData ? (
                            <>
                                <motion.div className="stat-card" style={{ padding: "1rem" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Current Load</span>
                                        <span className="badge badge-normal">Optimized</span>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-teal)" }}>{routesData.total_distance_km}km</div>
                                            <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Total Distance</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-blue)" }}>{routesData.num_villages_served}</div>
                                            <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Villages Served</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {routesData.routes?.map((route: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        className={`glass-card ${selectedTanker === idx ? 'active-route' : ''}`}
                                        style={{
                                            borderLeft: `4px solid ${ROUTE_COLORS[idx]}`,
                                            background: selectedTanker === idx ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)'
                                        }}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div style={{ padding: "1rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSelectedTanker(selectedTanker === idx ? null : idx)}>
                                                    <Truck size={18} color={ROUTE_COLORS[idx]} />
                                                    <span style={{ fontWeight: 700 }}>Tanker {idx + 1}</span>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>{route.total_distance_km} km</div>
                                                    <button
                                                        onClick={() => handleDispatch(route, idx)}
                                                        disabled={dispatching === idx}
                                                        style={{
                                                            fontSize: "0.65rem",
                                                            padding: "4px 8px",
                                                            marginTop: 4,
                                                            background: dispatchStatus[idx] === 'success' ? '#10B981' : dispatchStatus[idx] === 'error' ? '#EF4444' : 'var(--accent-teal)',
                                                            color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 4, width: '100%'
                                                        }}>
                                                        {dispatching === idx ? <Zap size={10} className="animate-pulse" /> : dispatchStatus[idx] === 'success' ? <CheckCircle2 size={10} /> : dispatchStatus[idx] === 'error' ? <AlertCircle size={10} /> : <Send size={10} />}
                                                        {dispatching === idx ? "Sending..." : dispatchStatus[idx] === 'success' ? "Dispatched" : dispatchStatus[idx] === 'error' ? "Failed" : "Send WhatsApp"}
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                                {route.stops.map((stop: any, si: number) => (
                                                    <div key={si} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.75rem" }}>
                                                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>{si + 1}</div>
                                                        <span style={{ color: "#9ca3af", flex: 1 }}>{stop.village_name}</span>
                                                        <span style={{ color: "#4b5563" }}>{stop.demand / 1000}k L</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#4b5563" }}>
                                <Navigation size={40} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                                <p style={{ fontSize: "0.9rem" }}>Optimize routes to see dispatch options.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Map View */}
                <div className="glass-card" style={{ position: "relative", overflow: "hidden" }}>
                    <MapContainer center={[20.5, 78.5]} zoom={8} style={{ height: "100%", width: "100%" }}>
                        <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                        {L && <Marker position={[21.1458, 79.0882]} icon={depotIcon!}><Popup>Main Depot (Nagpur)</Popup></Marker>}

                        {Object.entries(roadPaths).map(([idx, path]) => (
                            <Polyline
                                key={idx}
                                positions={path}
                                color={ROUTE_COLORS[Number(idx)]}
                                weight={selectedTanker === null || selectedTanker === Number(idx) ? 4 : 1}
                                opacity={selectedTanker === null || selectedTanker === Number(idx) ? 1 : 0.2}
                            />
                        ))}

                        {routesData?.routes?.map((route: any, idx: number) => (
                            (selectedTanker === null || selectedTanker === idx) && route.stops.map((stop: any, si: number) => (
                                <Marker key={`${idx}-${si}`} position={[stop.lat, stop.lng]} icon={tankerIcon(ROUTE_COLORS[idx])!}>
                                    <Popup>
                                        <div style={{ fontSize: "0.8rem" }}>
                                            <strong>{stop.village_name}</strong><br />
                                            Sequence: {stop.sequence}<br />
                                            Demand: {stop.demand} L
                                        </div>
                                    </Popup>
                                </Marker>
                            ))
                        ))}
                    </MapContainer>

                    <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000 }}>
                        <div className="glass-card" style={{ padding: "8px 12px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }}></div>
                            <span>Active Road Intelligence Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .active-route {
                    border-color: var(--accent-teal) !important;
                    box-shadow: 0 0 15px rgba(20, 184, 166, 0.2);
                }
                .leaflet-container {
                    filter: grayscale(0.2) contrast(1.1);
                }
            `}</style>
        </div>
    );
}
