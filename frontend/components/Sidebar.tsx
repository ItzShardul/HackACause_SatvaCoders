"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, MapPin, Truck, BarChart3,
    Droplets, FileText, Zap, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
    { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
    { href: "/dashboard/map", label: "Drought Map", icon: MapPin },
    { href: "/dashboard/predictions", label: "Predictions", icon: BarChart3 },
    { href: "/dashboard/allocation", label: "Tanker Allocation", icon: Truck },
    { href: "/dashboard/routes", label: "Route Optimizer", icon: Zap },
    { href: "/dashboard/requests", label: "Water Requests", icon: Droplets },
    { href: "/dashboard/grievances", label: "Grievances", icon: FileText },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ padding: "0 24px", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem",
                    }}>
                        💧
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                            JalMitra
                        </div>
                        <div style={{
                            fontSize: "0.6rem", color: "var(--text-muted)",
                            letterSpacing: "1px", textTransform: "uppercase",
                        }}>
                            Nagpur District Pilot
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1 }}>
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? "active" : ""}`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div style={{
                padding: "1rem 16px",
                borderTop: "1px solid var(--border)",
                display: "flex", flexDirection: "column", gap: "0.75rem",
            }}>
                {/* Dark / Light Toggle */}
                <button
                    onClick={toggle}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        transition: "all 0.25s ease",
                        position: "relative",
                        overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-teal)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-teal)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    }}
                >
                    {/* Sliding pill indicator */}
                    <div style={{
                        position: "absolute",
                        left: isDark ? "calc(100% - 42px)" : "4px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 34,
                        height: 28,
                        borderRadius: 8,
                        background: isDark
                            ? "rgba(59,130,246,0.2)"
                            : "rgba(245,158,11,0.2)",
                        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease",
                        zIndex: 0,
                    }} />

                    {/* Sun icon */}
                    <Sun
                        size={14}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            color: !isDark ? "var(--accent-amber)" : "var(--text-muted)",
                            transition: "color 0.3s ease",
                        }}
                    />

                    {/* Label */}
                    <span style={{
                        flex: 1,
                        textAlign: "center",
                        position: "relative",
                        zIndex: 1,
                        color: "var(--text-primary)",
                    }}>
                        {isDark ? "Dark Mode" : "Light Mode"}
                    </span>

                    {/* Moon icon */}
                    <Moon
                        size={14}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            color: isDark ? "var(--accent-blue)" : "var(--text-muted)",
                            transition: "color 0.3s ease",
                        }}
                    />
                </button>

                {/* User profile */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: "white",
                        flexShrink: 0,
                    }}>
                        NA
                    </div>
                    <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            Nagpur Admin
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            District Collectorate
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
