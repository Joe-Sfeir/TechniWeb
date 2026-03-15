import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, LogOut, Building2, Hospital, Server, Factory,
  Activity, ChevronRight, AlertTriangle, RefreshCw,
  LayoutDashboard, Bell, Settings,
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isDemo,   setIsDemo]   = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) throw new Error("Server error");
      const data = await res.json() as Project[];
      setProjects(data);
      setIsDemo(false);
    } catch {
      // Backend offline — fall back to demo data
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

  /* ─── Sidebar nav items ─────────────────────────────────────────────────── */

  const navItems = [
    { icon: LayoutDashboard, label: "My Projects", active: true  },
    { icon: Bell,            label: "Alerts",      active: false },
    { icon: Settings,        label: "Settings",    active: false },
  ];

  return (
    <>
      <style>{`
        @keyframes db-spin    { to { transform: rotate(360deg); } }
        @keyframes db-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>

      <div style={{ display: "flex", height: "100svh", background: "#0d1117", overflow: "hidden", fontFamily: "'Inter',sans-serif" }}>

        {/* ══ Sidebar ══ */}
        <aside style={{
          width: 228, flexShrink: 0,
          background: "rgba(255,255,255,0.018)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => navigate("/")}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.35)" }}>
                <Zap size={15} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.92rem", letterSpacing: "0.06em", color: "#e6edf3", lineHeight: 1 }}>TechniDAQ</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em" }}>Portal</div>
              </div>
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => (
              <button key={item.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, width: "100%",
                background: item.active ? "rgba(37,99,235,0.14)" : "transparent",
                border: item.active ? "1px solid rgba(37,99,235,0.22)" : "1px solid transparent",
                color: item.active ? "#93c5fd" : "rgba(255,255,255,0.38)",
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
                fontSize: "0.83rem", letterSpacing: "0.04em",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
              onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.38)"; } }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
              color: "rgba(239,68,68,0.75)", cursor: "pointer",
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
              fontSize: "0.83rem", letterSpacing: "0.04em", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "rgba(239,68,68,0.75)"; }}
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
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.012)", backdropFilter: "blur(12px)",
            flexShrink: 0,
          }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0 }}>
                My Projects
              </h1>
              <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", margin: "3px 0 0", letterSpacing: "0.05em" }}>
                {loading ? "Loading…" : `${projects.length} site${projects.length !== 1 ? "s" : ""} connected`}
              </p>
            </div>
            <button onClick={fetchProjects} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.45)", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: "0.8rem",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
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
              background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertTriangle size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.06em", color: "rgba(245,158,11,0.75)" }}>
                DEMO MODE — Backend not connected. Showing sample projects.
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
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                  animation: "db-pulse 1.5s ease-in-out infinite",
                }} />
              ))
            ) : (
              projects.map((project) => {
                const IconComp   = CATEGORY_ICONS[project.category] ?? Building2;
                const tierColor  = TIER_COLORS[project.tier] ?? "#94a3b8";
                const statColor  = STATUS_COLOR[project.status];
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/dashboard/${project.id}`)}
                    style={{
                      borderRadius: 14, padding: "20px",
                      background: "rgba(255,255,255,0.028)",
                      border: "1px solid rgba(255,255,255,0.065)",
                      cursor: "pointer", position: "relative", overflow: "hidden",
                      transition: "all 0.22s",
                      display: "flex", flexDirection: "column", gap: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.052)";
                      e.currentTarget.style.borderColor = `${tierColor}45`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px ${tierColor}18`;
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      const glow  = e.currentTarget.querySelector<HTMLElement>(".card-glow");
                      if (arrow) arrow.style.opacity = "1";
                      if (glow)  glow.style.opacity  = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.028)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.065)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".card-arrow");
                      const glow  = e.currentTarget.querySelector<HTMLElement>(".card-glow");
                      if (arrow) arrow.style.opacity = "0";
                      if (glow)  glow.style.opacity  = "0";
                    }}
                  >
                    {/* Icon + Tier + Status row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${tierColor}14`, border: `1px solid ${tierColor}28`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <IconComp size={18} style={{ color: tierColor }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 20,
                          fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.06em", background: `${tierColor}14`,
                          color: tierColor, border: `1px solid ${tierColor}28`,
                        }}>{project.tier}</span>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 20,
                          background: `${statColor}10`, border: `1px solid ${statColor}22`,
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", background: statColor,
                            boxShadow: project.status === "online" ? `0 0 5px ${statColor}` : "none",
                            animation: project.status === "online" ? "pulse-dot 2s ease-in-out infinite" : "none",
                          }} />
                          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: statColor, letterSpacing: "0.06em" }}>
                            {STATUS_LABEL[project.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Name + location */}
                    <div>
                      <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                        {project.name}
                      </h3>
                      <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", margin: 0, letterSpacing: "0.04em" }}>
                        {project.location}
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Activity size={11} style={{ color: "rgba(255,255,255,0.28)" }} />
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                          {project.deviceCount} device{project.deviceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {project.activeAlerts > 0 && (
                        <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, background: "rgba(239,68,68,0.13)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.04em" }}>
                          {project.activeAlerts} alert{project.activeAlerts > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="card-arrow" style={{ opacity: 0, transition: "opacity 0.15s", display: "flex", alignItems: "center", gap: 3, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.72rem", color: tierColor, letterSpacing: "0.06em" }}>
                        Open <ChevronRight size={12} />
                      </span>
                    </div>

                    {/* Corner glow (revealed on hover) */}
                    <div className="card-glow" style={{
                      position: "absolute", top: 0, right: 0, width: 80, height: 80,
                      background: `radial-gradient(circle at 100% 0%, ${tierColor}14, transparent 70%)`,
                      pointerEvents: "none", opacity: 0, transition: "opacity 0.22s",
                    }} />
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
