"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Droplets, BarChart3, MapPin, Truck, Zap, Shield,
  CloudRain, TrendingUp, AlertTriangle, ArrowRight,
} from "lucide-react";

const features = [
  { icon: CloudRain, title: "Rainfall Analysis", desc: "Real-time rainfall deviation tracking across 50+ villages", color: "#3b82f6" },
  { icon: Droplets, title: "Water Stress Index", desc: "Multi-factor WSI with 4-component scoring algorithm", color: "#14b8a6" },
  { icon: TrendingUp, title: "AI Predictions", desc: "30/60/90 day drought predictions using time-series ML", color: "#8b5cf6" },
  { icon: Truck, title: "Smart Allocation", desc: "Priority-based tanker assignment with severity weighting", color: "#F59E0B" },
  { icon: Zap, title: "Route Optimization", desc: "OR-Tools VRP solver for minimum distance routing", color: "#EF4444" },
  { icon: Shield, title: "Preventive Governance", desc: "Shift from crisis response to predictive water management", color: "#10B981" },
];

const stats = [
  { value: "50+", label: "Villages Monitored" },
  { value: "24mo", label: "Historical Data" },
  { value: "90d", label: "Prediction Horizon" },
  { value: "30%", label: "Fuel Savings" },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Background effects */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "5%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.06), transparent)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04), transparent)", filter: "blur(120px)" }} />
      </div>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.5rem 4rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid var(--border-light)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
          }}>💧</div>
          <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>JalMitra</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/login" className="btn btn-secondary" style={{ padding: "8px 20px" }}>
            Sign In
          </Link>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "8px 20px" }}>
            Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "6rem 2rem 4rem", position: "relative", zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20, marginBottom: "1.5rem",
            background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)",
            fontSize: "0.8rem", color: "#14b8a6"
          }}>
            <AlertTriangle size={14} /> Drought Prevention Platform for India
          </div>

          <h1 style={{
            fontSize: "3.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem",
            maxWidth: 800, margin: "0 auto 1.5rem",
          }}>
            <span style={{ background: "linear-gradient(135deg, #f9fafb 0%, #14b8a6 50%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Predict Droughts.
            </span>
            <br />
            <span style={{ color: "#f9fafb" }}>Save Communities.</span>
          </h1>

          <p style={{ fontSize: "1.15rem", color: "#9ca3af", maxWidth: 600, margin: "0 auto 2rem", lineHeight: 1.7 }}>
            AI-powered drought early warning system with smart tanker allocation.
            Transforming crisis response into <strong style={{ color: "#14b8a6" }}>preventive water governance</strong>.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
              <BarChart3 size={18} /> Open Dashboard
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
              <MapPin size={18} /> View Map
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ display: "flex", justifyContent: "center", gap: "3rem", padding: "2rem", position: "relative", zIndex: 10 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} style={{ textAlign: "center" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#14b8a6" }}>{s.value}</div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: "4rem", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
            Powered by <span style={{ color: "#14b8a6" }}>Advanced Analytics</span>
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>From data to actionable drought intelligence</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {features.map((f, i) => (
            <motion.div key={f.title} className="glass-card" style={{ padding: "2rem" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: `${f.color}15`, border: `1px solid ${f.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "2rem",
        borderTop: "1px solid var(--border-light)",
        fontSize: "0.8rem", color: "#6b7280",
        position: "relative", zIndex: 10
      }}>
        JalMitra — Integrated Drought Warning & Smart Tanker Management System © 2026
      </footer>
    </div>
  );
}
