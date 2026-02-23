"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, Clock, Truck, Plus, Navigation, Send, CheckCircle2, Play, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

// Leaflet dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(m => m.GeoJSON), { ssr: false });

const ROUTE_COLORS = ["#14b8a6", "#3b82f6", "#F59E0B", "#8b5cf6", "#EF4444", "#EC4899"];

// Component for the moving tanker animation
const MovingTanker = ({ path, color, isVisible, isLive }: { path: any[], color: string, isVisible: boolean, isLive?: boolean }) => {
    const [posIdx, setPosIdx] = useState(0);
    const [coords, setCoords] = useState<[number, number] | null>(null);

    // RCOEM Digital Tower Coordinates for Live Demo
    const RCOEM_COORDS: [number, number] = [21.1766, 79.0614];

    useEffect(() => {
        if (!isVisible || path.length === 0) return;
        const interval = setInterval(() => {
            setPosIdx(prev => (prev + 1) % path.length);
        }, 120);
        return () => clearInterval(interval);
    }, [path, isVisible]);

    useEffect(() => {
        if (isLive && !isVisible) {
            setCoords(RCOEM_COORDS);
        } else if (path.length > 0) {
            setCoords(path[posIdx]);
        }
    }, [posIdx, path, isLive, isVisible]);

    const L = typeof window !== 'undefined' ? require('leaflet') : null;
    if (!L || !coords) return null;

    const truckIcon = new L.DivIcon({
        className: 'moving-truck-icon',
        html: `
            <div style="position: relative;">
                ${isLive ? `<div class="pulse-ring" style="border-color: ${color}"></div>` : ''}
                <div style="background-color: ${color}; width: 24px; height: 24px; border: 3px solid white; border-radius: 6px; box-shadow: 0 0 15px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; z-index: 10;">
                    ${isLive ? '📡' : '🚚'}
                </div>
                ${isLive ? `<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: ${color}; color: white; padding: 2px 4px; border-radius: 4px; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">LIVE RCOEM</div>` : ''}
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return (isVisible || isLive) ? <Marker position={coords} icon={truckIcon} /> : null;
};

export default function RoutesPage() {
    const [loading, setLoading] = useState(false);
    const [dispatching, setDispatching] = useState<number | null>(null);
    const [dispatchStatus, setDispatchStatus] = useState<Record<number, string>>({});
    const [roadPaths, setRoadPaths] = useState<Record<number, any[]>>({});
    const [selectedTanker, setSelectedTanker] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [boundaryData, setBoundaryData] = useState<any>(null);

    useEffect(() => {
        fetch("/nagpur.geojson")
            .then(res => res.json())
            .then(data => setBoundaryData(data))
            .catch(err => console.error("Error loading boundary:", err));
    }, []);

    // ─── TEAMMATE DRIVER REGISTRY ───
    const [teammateDrivers, setTeammateDrivers] = useState([
        { name: "Guru Sawarkar", phone: "+918446241075" },
        { name: "Aman Kumar", phone: "+916377620244" },
    ]);
    const [selectedDrivers, setSelectedDrivers] = useState<Record<number, number>>({ 0: 0, 1: 1 });
    const [selectedDestinations, setSelectedDestinations] = useState<Record<number, string>>({});

    const nagpurVillages = [
        { name: "Katol", lat: 21.2682, lng: 78.5833 },
        { name: "Savner", lat: 21.3917, lng: 78.9167 },
        { name: "Umred", lat: 20.8500, lng: 79.3333 },
        { name: "Narkhed", lat: 21.4667, lng: 78.5333 },
        { name: "Ramtek", lat: 21.3938, lng: 79.3275 },
        { name: "Hingna", lat: 21.0667, lng: 78.9667 },
        { name: "Kamptee", lat: 21.2227, lng: 79.2014 },
        { name: "Kalmeshwar", lat: 21.2333, lng: 78.9167 },
        { name: "Parseoni", lat: 21.3833, lng: 79.3333 },
        { name: "Mauda", lat: 21.1667, lng: 79.4833 },
        { name: "Kuhi", lat: 21.0167, lng: 79.3500 },
        { name: "Bhiwapur", lat: 20.7667, lng: 79.5167 },
    ];

    const addDriver = () => {
        const name = prompt("Enter Driver Name:");
        const phone = prompt("Enter Driver Phone (+91...):");
        if (name && phone) {
            const newIndex = teammateDrivers.length;
            setTeammateDrivers(prev => [...prev, { name, phone }]);
            setSelectedDrivers(prev => ({ ...prev, [newIndex]: newIndex }));
        }
    };

    const handleManualDestination = async (tankerIdx: number, villageName: string) => {
        const village = nagpurVillages.find(v => v.name === villageName);
        if (!village) return;

        setSelectedDestinations(prev => ({ ...prev, [tankerIdx]: villageName }));

        try {
            const start: [number, number] = [21.1766, 79.0614]; // RCOEM Digital Tower
            const end: [number, number] = [village.lat, village.lng];
            const route = await api.getRoute(start, end);
            if (route && route.coordinates) {
                const path = route.coordinates.map((c: any) => [c[1], c[0]]);
                setRoadPaths(prev => ({ ...prev, [tankerIdx]: path }));
            }
        } catch (err) {
            setRoadPaths(prev => ({ ...prev, [tankerIdx]: [[21.1766, 79.0614], [village.lat, village.lng]] }));
        }
    };

    const handleDispatch = async (idx: number) => {
        setDispatching(idx);
        const driver = teammateDrivers[selectedDrivers[idx] || 0];
        const destName = selectedDestinations[idx];
        const village = nagpurVillages.find(v => v.name === destName);

        try {
            const driverData = {
                driver_name: driver.name,
                driver_phone: driver.phone,
                village_name: destName || "Assigned Area",
                depot: { lat: 21.1766, lng: 79.0614 },
                stops: village ? [{ ...village, id: 999 }] : [],
                quantity: 15000
            };

            const res = await api.dispatchTanker(driverData);
            if (res.status === "success") {
                setDispatchStatus(prev => ({ ...prev, [idx]: "success" }));
                setSelectedTanker(idx);
                setIsSimulating(true);
            } else {
                setDispatchStatus(prev => ({ ...prev, [idx]: "error" }));
            }
        } catch (err) {
            setDispatchStatus(prev => ({ ...prev, [idx]: "error" }));
        }
        setDispatching(null);
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
                    <h1>📡 Smart Mission Control</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                        Real-Time Satellite Dispatch & Driver Monitoring
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button className="btn btn-primary" onClick={addDriver} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Plus size={18} /> Register New Driver
                    </button>
                    <div className="glass-card" style={{ padding: "4px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <Clock size={16} className="text-teal" />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>17:15 LIVE</span>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem", flex: 1, overflow: "hidden", marginTop: "1rem" }}>
                <div style={{ overflowY: "auto", paddingRight: "0.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {teammateDrivers.map((_, idx) => (
                        <motion.div
                            key={idx}
                            className={`glass-card ${selectedTanker === idx ? 'active-route' : ''}`}
                            style={{
                                borderLeft: `6px solid ${ROUTE_COLORS[idx % ROUTE_COLORS.length]}`,
                                background: selectedTanker === idx ? 'rgba(255,255,255,0.08)' : 'rgba(30, 41, 59, 0.4)',
                                padding: "1.25rem",
                                position: "relative"
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedTanker(idx)}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Truck size={20} color={ROUTE_COLORS[idx % ROUTE_COLORS.length]} />
                                    <span style={{ fontWeight: 800, fontSize: "1rem" }}>Tanker Unit {idx + 1}</span>
                                </div>
                                {dispatchStatus[idx] === 'success' && <div className="badge badge-success">Active</div>}
                            </div>

                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: 8, marginBottom: 12 }}>
                                <div style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Assigned Pilot</div>
                                <select
                                    value={selectedDrivers[idx] ?? idx}
                                    onChange={(e) => setSelectedDrivers(prev => ({ ...prev, [idx]: parseInt(e.target.value) }))}
                                    style={{ background: "transparent", border: "none", color: "white", fontSize: "0.85rem", outline: "none", width: "100%", fontWeight: 700 }}
                                >
                                    {teammateDrivers.map((driver, dIdx) => (
                                        <option key={dIdx} value={dIdx} style={{ background: "#0f172a", color: "white" }}>
                                            {driver.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: 8, marginBottom: 15 }}>
                                <div style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Mission Destination</div>
                                <select
                                    value={selectedDestinations[idx] || ""}
                                    onChange={(e) => handleManualDestination(idx, e.target.value)}
                                    style={{ background: "transparent", border: "none", color: "var(--accent-teal)", fontSize: "0.85rem", outline: "none", width: "100%", fontWeight: 700 }}
                                >
                                    <option value="" disabled style={{ background: "#0f172a" }}>Select Destination...</option>
                                    {nagpurVillages.map((v, vIdx) => (
                                        <option key={vIdx} value={v.name} style={{ background: "#0f172a", color: "white" }}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className={`btn ${dispatchStatus[idx] === 'success' ? 'btn-success' : 'btn-primary'}`}
                                style={{ width: "100%", padding: "10px", fontWeight: 700 }}
                                onClick={(e) => { e.stopPropagation(); handleDispatch(idx); }}
                                disabled={dispatching === idx}
                            >
                                {dispatching === idx ? (
                                    <div className="spinner" style={{ borderLeftColor: "white" }}></div>
                                ) : dispatchStatus[idx] === 'success' ? (
                                    <><CheckCircle2 size={16} /> Mission Dispatched</>
                                ) : (
                                    <><Send size={16} /> Dispatch via WhatsApp</>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="glass-card" style={{ position: "relative", overflow: "hidden", border: "none" }}>
                    <MapContainer center={[21.1458, 79.0882]} zoom={10} style={{ height: "100%", width: "100%" }}>
                        <TileLayer attribution='&copy; Mappls' url={`https://apis.mappls.com/advancedmaps/v1/d4e85a7e34907841d6a307dc31c6918a/still_map/{z}/{x}/{y}.png`} />

                        {/* Nagpur Boundary Layer */}
                        {boundaryData && (
                            <GeoJSON
                                data={boundaryData}
                                style={{
                                    color: "rgba(255,255,255,0.15)",
                                    weight: 2,
                                    fillColor: "#f59e0b",
                                    fillOpacity: 0.02,
                                    dashArray: "5, 10"
                                }}
                            />
                        )}

                        {L && <Marker position={[21.1458, 79.0882]} icon={depotIcon!}><Popup>Main Nagpur Depot</Popup></Marker>}

                        {Object.entries(roadPaths).map(([idx, path]) => (
                            <Polyline
                                key={idx}
                                positions={path as any}
                                color={ROUTE_COLORS[Number(idx) % ROUTE_COLORS.length]}
                                weight={selectedTanker === Number(idx) ? 6 : 3}
                                opacity={selectedTanker === null || selectedTanker === Number(idx) ? 1 : 0.2}
                            />
                        ))}

                        {Object.entries(roadPaths).map(([idx, path]) => (
                            <MovingTanker
                                key={`mov-${idx}`}
                                path={path}
                                color={ROUTE_COLORS[Number(idx) % ROUTE_COLORS.length]}
                                isVisible={isSimulating && (selectedTanker === null || selectedTanker === Number(idx))}
                                isLive={true}
                            />
                        ))}

                        {Object.entries(selectedDestinations).map(([idx, name]) => {
                            const village = nagpurVillages.find(v => v.name === name);
                            if (!village) return null;
                            return (
                                <Marker key={`dest-${idx}`} position={[village.lat, village.lng]} icon={tankerIcon(ROUTE_COLORS[Number(idx) % ROUTE_COLORS.length])!}>
                                    <Popup><strong>{name}</strong><br />Emergency Mission Target</Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000 }}>
                        <div className="glass-card" style={{ padding: "8px 16px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.9)" }}>
                            <div className="pulse-ring-static" style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }}></div>
                            <span style={{ fontWeight: 600 }}>RCOEM Ground Intelligence Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .active-route {
                    border-color: var(--accent-teal) !important;
                    box-shadow: 0 0 20px rgba(20, 184, 166, 0.2);
                }
                .pulse-ring {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border: 4px solid;
                    border-radius: 50%;
                    top: -8px;
                    left: -8px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .pulse-ring-static {
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                    animation: pulse-blue 2s infinite;
                }
                @keyframes pulse-blue {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}</style>
        </div>
    );
}
