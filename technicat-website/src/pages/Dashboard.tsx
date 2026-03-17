import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { handleAuthError } from "../lib/auth";
import {
  Zap, LogOut, Building2, Hospital, Server, Factory,
  Activity, ChevronRight, AlertTriangle, RefreshCw,
  LayoutDashboard, Bell, Settings, Globe,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Project {
  id: string;
  name: string;
  tier: string;
  location: string;
  deviceCount: number;
  status: "online" | "degraded" | "offline";
  category: string;
  activeAlerts: number;
}

/* ─── Demo fallback data ──────────────────────────────────────────────────── */

const DEMO_PROJECTS: Project[] = [
  { id: "1", name: "Beirut Medical Center",   tier: "Tier 3", location: "Beirut, Lebanon",   deviceCount: 8,  status: "online",   category: "Healthcare",     activeAlerts: 0 },
  { id: "2", name: "Tier-IV Data Center",     tier: "Tier 4", location: "Jdeideh, Lebanon",  deviceCount: 12, status: "online",   category: "Technology",     activeAlerts: 0 },
  { id: "3", name: "RHI Airport Expansion",   tier: "Tier 2", location: "Khaldeh, Lebanon",  deviceCount: 5,  status: "degraded", category: "Infrastructure", activeAlerts: 2 },
  { id: "4", name: "Byblos Petrochemical",    tier: "Tier 2", location: "Byblos, Lebanon",   deviceCount: 6,  status: "online",   category: "Industrial",     activeAlerts: 0 },
  { id: "5", name: "Zahle Smart Grid",        tier: "Tier 1", location: "Zahle, Lebanon",    deviceCount: 3,  status: "online",   category: "Energy",         activeAlerts: 0 },
  { id: "6", name: "AUB Campus Upgrade",      tier: "Tier 2", location: "Beirut, Lebanon",   deviceCount: 4,  status: "online",   category: "Education",      activeAlerts: 0 },
];

/* ─── Look-up tables ──────────────────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Healthcare:     Hospital,
  Technology:     Server,
  Infrastructure: Building2,
  Industrial:     Factory,
  Energy:         Zap,
  Education:      Building2,
};

const TIER_COLORS: Record<string, string> = {
  "Tier 1": "#22c55e",
  "Tier 2": "#3b82f6",
  "Tier 3": "#a855f7",
  "Tier 4": "#f59e0b",
};

const STATUS_COLOR: Record<string, string> = { online: "#22c55e", degraded: "#f59e0b", offline: "#ef4444" };
const STATUS_LABEL: Record<string, string> = { online: "Online",  degraded: "Degraded", offline: "Offline"  };
const STATUS_BG:    Record<string, string> = { online: "#f0fdf4", degraded: "#fffbeb",  offline: "#fef2f2"   };

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isDemo,   setIsDemo]   = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) throw new Error("Server error");
      const data = await res.json() as Project[];
      setProjects(data);
      setIsDemo(false);
    } catch {
      setProjects(DEMO_PROJECTS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "My Projects", active: true  },
    { icon: Bell,            label: "Alerts",      active: false },
    { icon: Settings,        label: "Settings",    active: false },
  ];

  return (
    <>
      <style>{`
        *,*::before,*::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes db-spin  { to { transform: rotate(360deg); } }
        @keyframes db-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes pulse-dot{ 0%,100%{opacity:1} 50%{opacity:0.3}  }
      `}</style>

      <div style={{ display: "flex", height: "100svh", background: "#f1f5f9", overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ══ Sidebar ══ */}
        <aside style={{
          width: 232, flexShrink: 0,
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", lineHeight: 1 }}>TechniDAQ</div>
                <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.06em", lineHeight: 1.5 }}>Client Portal</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => (
              <button key={item.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, width: "100%",
                background: item.active ? "#eff6ff" : "transparent",
                border: item.active ? "1px solid #bfdbfe" : "1px solid transparent",
                color: item.active ? "#2563eb" : "#64748b",
                fontFamily: "'Inter',sans-serif", fontWeight: item.active ? 600 : 500,
                fontSize: "0.85rem",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; } }}
              onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom buttons */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 6 }}>
            {/* ← Main Website */}
            <button onClick={() => navigate("/")} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              color: "#475569", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500,
              fontSize: "0.85rem", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
            >
              <Globe size={14} /> Main Website
            </button>
            {/* Sign out */}
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500,
              fontSize: "0.85rem", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ══ Main ══ */}
        <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

          {/* Top bar */}
          <div style={{
            padding: "20px 28px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#ffffff", flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
                My Projects
              </h1>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "3px 0 0" }}>
                {loading ? "Loading…" : `${projects.length} site${projects.length !== 1 ? "s" : ""} connected`}
              </p>
            </div>
            <button onClick={fetchProjects} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              color: "#64748b", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.83rem",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "db-spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>

          {/* Demo banner */}
          {isDemo && (
            <div style={{
              margin: "16px 28px 0",
              padding: "10px 16px", borderRadius: 8,
              background: "#fffbeb", border: "1px solid #fde68a",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", color: "#92400e" }}>
                Demo mode — backend not connected. Showing sample projects.
              </span>
            </div>
          )}

          {/* Project grid */}
          <div style={{
            padding: "20px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: 16,
            alignContent: "start",
          }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: 14, height: 172,
                  background: "#e2e8f0",
                  animation: "db-pulse 1.5s ease-in-out infinite",
                }} />
              ))
            ) : (
              projects.map((project) => {
                const IconComp  = CATEGORY_ICONS[project.category] ?? Building2;
                const tierColor = TIER_COLORS[project.tier] ?? "#94a3b8";
                const statColor = STATUS_COLOR[project.status];
                const statBg    = STATUS_BG[project.status];
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/dashboard/${project.id}`)}
                    style={{
                      borderRadius: 14, padding: "20px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer", position: "relative", overflow: "hidden",
                      transition: "all 0.22s",
                      display: "flex", flexDirection: "column", gap: 12,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)`;
                      e.currentTarget.style.borderColor = `${tierColor}60`;
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      if (arrow) arrow.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      if (arrow) arrow.style.opacity = "0";
                    }}
                  >
                    {/* Top accent strip */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)`, borderRadius: "14px 14px 0 0" }} />

                    {/* Icon + badges */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${tierColor}15`, border: `1px solid ${tierColor}30`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <IconComp size={18} style={{ color: tierColor }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 20,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          background: `${tierColor}14`, color: tierColor, border: `1px solid ${tierColor}28`,
                        }}>{project.tier}</span>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 20,
                          background: statBg, border: `1px solid ${statColor}30`,
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", background: statColor,
                            animation: project.status === "online" ? "pulse-dot 2s ease-in-out infinite" : "none",
                          }} />
                          <span style={{ fontSize: 10, color: statColor, fontWeight: 600, letterSpacing: "0.03em" }}>
                            {STATUS_LABEL[project.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Name + location */}
                    <div>
                      <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", margin: "0 0 3px", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>
                        {project.location}
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Activity size={11} style={{ color: "#94a3b8" }} />
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          {project.deviceCount} device{project.deviceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {project.activeAlerts > 0 && (
                        <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 600 }}>
                          {project.activeAlerts} alert{project.activeAlerts > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="card-arrow" style={{ opacity: 0, transition: "opacity 0.15s", display: "flex", alignItems: "center", gap: 3, fontSize: "0.75rem", fontWeight: 600, color: tierColor }}>
                        Open <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
