"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("collector");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // For hackathon demo: quick access
        if (role === "collector") {
            router.push("/dashboard");
        } else {
            router.push("/village");
        }
    };

    const demoLogin = (demoRole: string) => {
        if (demoRole === "collector") {
            setEmail("collector.nagpur@jalmitra.gov.in");
            setPassword("admin123");
            setRole("collector");
            router.push("/dashboard");
        } else {
            setEmail("gp.katol@jalmitra.gov.in");
            setPassword("village123");
            setRole("gram_panchayat");
            router.push("/village");
        }
    };

    return (
        <div className="login-container">
            {/* Background decorations */}
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "10%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.08), transparent)", filter: "blur(60px)" }} />
                <div style={{ position: "absolute", bottom: "15%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06), transparent)", filter: "blur(80px)" }} />
            </div>

            <motion.div className="login-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                        background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
                    }}>
                        💧
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>
                        <span style={{ background: "linear-gradient(135deg, #f9fafb, #14b8a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            JalMitra
                        </span>
                    </h1>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Official Nagpur District Smart Pilot</p>
                </div>

                <form onSubmit={handleLogin}>
                    {/* Role selector */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
                        {[
                            { id: "collector", label: "District Collector", icon: "🏛️" },
                            { id: "gram_panchayat", label: "Gram Panchayat", icon: "🏘️" },
                        ].map((r) => (
                            <button key={r.id} type="button" onClick={() => setRole(r.id)} style={{
                                background: role === r.id ? "rgba(20,184,166,0.15)" : "var(--bg-primary)",
                                border: `1px solid ${role === r.id ? "rgba(20,184,166,0.5)" : "var(--border)"}`,
                                borderRadius: 10, padding: "12px", cursor: "pointer",
                                color: role === r.id ? "#14b8a6" : "#9ca3af",
                                transition: "all 0.2s ease", textAlign: "center"
                            }}>
                                <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{r.icon}</div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{r.label}</div>
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label className="input-label">Email</label>
                        <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label className="input-label">Password</label>
                        <div style={{ position: "relative" }}>
                            <input className="input-field" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer", color: "#6b7280"
                            }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && <div style={{ color: "#EF4444", fontSize: "0.8rem", marginBottom: "1rem" }}>{error}</div>}

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                        <LogIn size={16} /> Sign In
                    </button>
                </form>

                {/* Quick Demo Access */}
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", marginBottom: 12 }}>Quick Demo Access</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button onClick={() => demoLogin("collector")} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: "0.8rem", padding: "10px" }}>
                            🏛️ Collector
                        </button>
                        <button onClick={() => demoLogin("gram_panchayat")} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: "0.8rem", padding: "10px" }}>
                            🏘️ Village
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
