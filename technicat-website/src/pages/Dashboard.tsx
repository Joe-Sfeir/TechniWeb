import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { handleAuthError } from "../lib/auth";
import { useTheme } from "../context/ThemeContext";
import {
  Zap, LogOut, Building2, Hospital, Server, Factory,
  Activity, ChevronRight, AlertTriangle, RefreshCw,
  LayoutDashboard, Bell, Settings, Globe, Sun, Moon, Menu, X,
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

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isDemo,       setIsDemo]       = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const CLR = dark ? {
    bg:      "#0f172a",
    bg2:     "#1e293b",
    surface: "#1e293b",
    border:  "#334155",
    border2: "#1e293b",
    fg:      "#f1f5f9",
    fg2:     "#94a3b8",
    accent:  "#1a5fff",
    muted:   "#475569",
  } : {
    bg:      "#f8fafc",
    bg2:     "#f1f5f9",
    surface: "#ffffff",
    border:  "#e2e8f0",
    border2: "#f1f5f9",
    fg:      "#0f172a",
    fg2:     "#64748b",
    accent:  "#1a5fff",
    muted:   "#94a3b8",
  };

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

  const Sidebar = () => (
    <aside style={{
      width: 232, flexShrink: 0,
      background: CLR.surface,
      borderRight: `1px solid ${CLR.border}`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${CLR.border2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: CLR.accent,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: `0 4px 12px ${CLR.accent}40`,
          }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: CLR.fg, lineHeight: 1 }}>TechniDAQ</div>
            <div style={{ fontSize: 10, color: CLR.fg2, letterSpacing: "0.06em", lineHeight: 1.5 }}>Client Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => (
          <button key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, width: "100%",
            background: item.active ? `${CLR.accent}18` : "transparent",
            border: "none",
            borderLeft: item.active ? `3px solid ${CLR.accent}` : "3px solid transparent",
            color: item.active ? CLR.accent : CLR.fg2,
            fontFamily: "'Inter',sans-serif", fontWeight: item.active ? 600 : 500,
            fontSize: "0.85rem",
            cursor: "pointer", textAlign: "left", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.background = dark ? "#ffffff10" : "#f1f5f9"; e.currentTarget.style.color = CLR.fg; } }}
          onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = CLR.fg2; } }}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom buttons */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${CLR.border2}`, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Theme toggle */}
        <button onClick={toggle} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "9px 12px", borderRadius: 8,
          background: "transparent", border: `1px solid ${CLR.border}`,
          color: CLR.fg2, cursor: "pointer",
          fontFamily: "'Inter',sans-serif", fontWeight: 500,
          fontSize: "0.85rem", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${CLR.accent}12`; e.currentTarget.style.borderColor = `${CLR.accent}50`; e.currentTarget.style.color = CLR.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.fg2; }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        {/* Main Website */}
        <button onClick={() => navigate("/")} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "9px 12px", borderRadius: 8,
          background: "transparent", border: `1px solid ${CLR.border}`,
          color: CLR.fg2, cursor: "pointer",
          fontFamily: "'Inter',sans-serif", fontWeight: 500,
          fontSize: "0.85rem", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${CLR.accent}12`; e.currentTarget.style.borderColor = `${CLR.accent}50`; e.currentTarget.style.color = CLR.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.fg2; }}
        >
          <Globe size={14} /> Main Website
        </button>
        {/* Sign out */}
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "9px 12px", borderRadius: 8,
          background: "transparent", border: "1px solid #fca5a5",
          color: "#ef4444", cursor: "pointer",
          fontFamily: "'Inter',sans-serif", fontWeight: 500,
          fontSize: "0.85rem", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f220"; e.currentTarget.style.borderColor = "#ef444460"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#fca5a5"; }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        *,*::before,*::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes db-spin  { to { transform: rotate(360deg); } }
        @keyframes db-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes pulse-dot{ 0%,100%{opacity:1} 50%{opacity:0.3}  }
      `}</style>

      <div style={{ display: "flex", height: "100svh", background: CLR.bg, overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ══ Sidebar — desktop ══ */}
        <div style={{ display: "none" }} className="db-sidebar-desktop">
          <Sidebar />
        </div>
        <style>{`
          @media (min-width: 768px) { .db-sidebar-desktop { display: flex !important; } .db-mobile-bar { display: none !important; } }
          @media (max-width: 767px) { .db-sidebar-desktop { display: none !important; } }
        `}</style>

        {/* ══ Mobile sidebar overlay ══ */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <Sidebar />
            </div>
          </div>
        )}

        {/* ══ Main ══ */}
        <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Mobile top bar */}
          <div className="db-mobile-bar" style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${CLR.border}`,
            background: CLR.surface,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: CLR.fg, padding: 4 }}>
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: CLR.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={12} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: CLR.fg }}>TechniDAQ</span>
            </div>
            <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", color: CLR.fg2, padding: 4 }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Top bar */}
          <div style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${CLR.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: CLR.surface, flexShrink: 0,
          }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: CLR.fg, letterSpacing: "-0.02em", margin: 0 }}>
                My Projects
              </h1>
              <p style={{ fontSize: "0.75rem", color: CLR.fg2, margin: "3px 0 0" }}>
                {loading ? "Loading…" : `${projects.length} site${projects.length !== 1 ? "s" : ""} connected`}
              </p>
            </div>
            <button onClick={fetchProjects} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "transparent", border: `1px solid ${CLR.border}`,
              color: CLR.fg2, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.83rem",
              transition: "all 0.15s", opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = `${CLR.accent}12`; e.currentTarget.style.borderColor = `${CLR.accent}50`; e.currentTarget.style.color = CLR.accent; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.fg2; }}
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
              background: dark ? "#451a0320" : "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", color: dark ? "#fde68a" : "#92400e" }}>
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
                  borderRadius: 12, height: 172,
                  background: CLR.bg2,
                  animation: "db-pulse 1.5s ease-in-out infinite",
                }} />
              ))
            ) : (
              projects.map((project) => {
                const IconComp  = CATEGORY_ICONS[project.category] ?? Building2;
                const tierColor = TIER_COLORS[project.tier] ?? "#94a3b8";
                const statColor = STATUS_COLOR[project.status];
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/dashboard/${project.id}`)}
                    style={{
                      borderRadius: 12, padding: "18px 20px",
                      background: CLR.surface,
                      border: `1px solid ${CLR.border}`,
                      borderLeft: `4px solid ${tierColor}`,
                      cursor: "pointer", position: "relative",
                      transition: "all 0.2s",
                      display: "flex", flexDirection: "column", gap: 12,
                      boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = dark
                        ? `0 8px 24px rgba(0,0,0,0.4)`
                        : `0 4px 16px rgba(0,0,0,0.1)`;
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      if (arrow) arrow.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = dark ? "none" : "0 1px 3px rgba(0,0,0,0.05)";
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      if (arrow) arrow.style.opacity = "0";
                    }}
                  >
                    {/* Icon + badges */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 9,
                        background: `${tierColor}18`, border: `1px solid ${tierColor}30`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <IconComp size={17} style={{ color: tierColor }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 20,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}30`,
                        }}>{project.tier}</span>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 20,
                          background: `${statColor}18`, border: `1px solid ${statColor}30`,
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", background: statColor,
                            animation: project.status === "online" ? "pulse-dot 2s ease-in-out infinite" : "none",
                          }} />
                          <span style={{ fontSize: 10, color: statColor, fontWeight: 600 }}>
                            {STATUS_LABEL[project.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Name + location */}
                    <div>
                      <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "0.93rem", color: CLR.fg, margin: "0 0 3px", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: "0.72rem", color: CLR.fg2, margin: 0 }}>
                        {project.location}
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Activity size={11} style={{ color: CLR.muted }} />
                        <span style={{ fontSize: "0.7rem", color: CLR.muted }}>
                          {project.deviceCount} device{project.deviceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {project.activeAlerts > 0 && (
                        <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, background: "#ef444420", color: "#ef4444", border: "1px solid #ef444430", fontWeight: 600 }}>
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
