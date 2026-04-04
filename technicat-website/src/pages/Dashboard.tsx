import React, { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { handleAuthError } from "../lib/auth";
import { useTheme } from "../context/ThemeContext";
import {
  Zap, LogOut, Building2, Hospital, Server, Factory,
  Activity, ChevronRight, AlertTriangle, RefreshCw,
  LayoutDashboard, Bell, Settings, Globe, Sun, Moon, Menu,
} from "lucide-react";

/* ─── Design Tokens ──────────────────────────────────────────────────────────── */
const LIGHT_THEME = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  border:    "#e2e8f0",
  accent:    "#1a5fff",
  accentDim: "#eff6ff",
  text:      "#0f172a",
  muted:     "#64748b",
  muted2:    "#94a3b8",
  danger:    "#ef4444",
  dangerBg:  "#fef2f2",
  dangerBdr: "#fecaca",
  amber:     "#f59e0b",
  amberBg:   "#fffbeb",
  amberBdr:  "#fde68a",
  green:     "#10b981",
  greenBg:   "#ecfdf5",
  greenBdr:  "#a7f3d0",
  sidebar:   "#ffffff",
  cardShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
};

const DARK_THEME = {
  bg:        "#050505",
  surface:   "#111111",
  border:    "#222222",
  accent:    "#1a5fff",
  accentDim: "rgba(26, 95, 255, 0.1)",
  text:      "#ffffff",
  muted:     "#a1a1aa",
  muted2:    "#52525b",
  danger:    "#ef4444",
  dangerBg:  "rgba(239, 68, 68, 0.1)",
  dangerBdr: "rgba(239, 68, 68, 0.2)",
  amber:     "#f59e0b",
  amberBg:   "rgba(245, 158, 11, 0.1)",
  amberBdr:  "rgba(245, 158, 11, 0.2)",
  green:     "#10b981",
  greenBg:   "rgba(16, 185, 129, 0.1)",
  greenBdr:  "rgba(16, 185, 129, 0.2)",
  sidebar:   "#0a0a0a",
  cardShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
};

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

const STATUS_LABEL: Record<string, string> = { online: "Online",  degraded: "Degraded", offline: "Offline"  };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ color }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={2.5}
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </svg>
  );
}

function SectionHeader({ title, sub, theme }: { title: string; sub?: string; theme: any }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 24, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 14, color: theme.muted, marginTop: 6, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

function DemoBanner({ theme }: { theme: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: theme.amberBg, border: `1px solid ${theme.amberBdr}`, borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
      <span style={{ fontWeight: 600, color: theme.amber }}>Demo mode</span>
      <span style={{ color: theme.muted }}>— backend offline, showing sample data</span>
    </div>
  );
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

type Tab = "projects" | "alerts" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "projects", label: "My Projects", icon: <LayoutDashboard size={18} /> },
  { id: "alerts",   label: "Alerts",      icon: <Bell size={18} />            },
  { id: "settings", label: "Settings",    icon: <Settings size={18} />        },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("projects");
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isDemo,       setIsDemo]       = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  const theme = dark ? DARK_THEME : LIGHT_THEME;

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

  const cardStyle: CSSProperties = {
    background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
    boxShadow: theme.cardShadow, overflow: "hidden"
  };

  const thStyle: CSSProperties = { textAlign: "left", padding: "14px 16px", color: theme.muted, fontWeight: 600, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${theme.border}`, background: theme.bg };
  const tdStyle: CSSProperties = { padding: "16px", color: theme.text, fontSize: 14, borderBottom: `1px solid ${theme.border}` };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'online') return theme.green;
    if (status.toLowerCase() === 'degraded') return theme.amber;
    return theme.danger;
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: theme.bg, color: theme.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .admin-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        flexShrink: 0,
        background: theme.sidebar,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden"
      }}>
        <div style={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Logo */}
          <div style={{ padding: "32px 24px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 20px ${theme.accent}40` }}>
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: theme.text, letterSpacing: "-0.02em" }}>TechniDAQ</div>
              <div style={{ fontSize: 11, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>Client Portal</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 16px" }}>
            {NAV_ITEMS.map((item) => {
              const active = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderRadius: 8, border: "none",
                  cursor: "pointer", textAlign: "left", fontFamily: "'Inter',sans-serif",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  background: active ? theme.accentDim : "transparent",
                  color: active ? theme.accent : theme.muted,
                  transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = theme.bg; e.currentTarget.style.color = theme.text; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.muted; } }}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "24px 16px", borderTop: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 12px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted }}>CLIENT</span>
              <button onClick={toggle} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6 }} onMouseEnter={(e) => e.currentTarget.style.color = theme.text} onMouseLeave={(e) => e.currentTarget.style.color = theme.muted}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            <button onClick={() => navigate("/")} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 16px", borderRadius: 8,
              background: "transparent", border: `1px solid ${theme.border}`,
              color: theme.text, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 13,
              transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg; e.currentTarget.style.borderColor = theme.muted2; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border; }}
            >
              <Globe size={16} /> Main Website
            </button>
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 16px", borderRadius: 8,
              background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`,
              color: theme.danger, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13,
              transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header Toggle */}
        <div style={{ padding: "24px 36px 0", display: "flex", alignItems: "center" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", padding: 8, marginLeft: -8, borderRadius: 6 }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surface} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
            <Menu size={20} />
          </button>
        </div>

        <div style={{ padding: "16px 36px 48px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          {tab === "projects" && (
            <div className="admin-fade">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 24, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>My Projects</h2>
                  <p style={{ fontSize: 14, color: theme.muted, marginTop: 6, marginBottom: 0 }}>
                    {loading ? "Loading…" : `${projects.length} site${projects.length !== 1 ? "s" : ""} connected`}
                  </p>
                </div>
                <button onClick={fetchProjects} disabled={loading} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: "transparent", border: `1px solid ${theme.border}`,
                  color: theme.muted, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 13,
                  transition: "all 0.2s", opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = theme.accentDim; e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; }}
                >
                  {loading ? <Spinner color={theme.accent} /> : <RefreshCw size={14} />}
                  Refresh
                </button>
              </div>

              {isDemo && <DemoBanner theme={theme} />}

              {projects.length > 0 ? (
                <div style={{ ...cardStyle }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Project</th>
                          <th style={thStyle}>Location</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Devices</th>
                          <th style={thStyle}>Alerts</th>
                          <th style={thStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => {
                          const IconComp  = CATEGORY_ICONS[p.category] ?? Building2;
                          const tierColor = TIER_COLORS[p.tier] ?? theme.muted2;
                          const statColor = getStatusColor(p.status);

                          return (
                            <tr key={p.id} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.bg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: `${tierColor}18`, border: `1px solid ${tierColor}30`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                  }}>
                                    <IconComp size={16} style={{ color: tierColor }} />
                                  </div>
                                  <div>
                                    <div style={{ color: theme.text }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{p.category} • {p.tier}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...tdStyle, color: theme.muted }}>{p.location}</td>
                              <td style={tdStyle}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: statColor }}>
                                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: statColor }} />
                                  {STATUS_LABEL[p.status]}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, color: theme.muted }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <Activity size={14} />
                                  {p.deviceCount}
                                </div>
                              </td>
                              <td style={tdStyle}>
                                {p.activeAlerts > 0 ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, fontSize: 12, background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.dangerBdr}`, fontWeight: 600 }}>
                                    <AlertTriangle size={12} />
                                    {p.activeAlerts}
                                  </span>
                                ) : (
                                  <span style={{ color: theme.muted2 }}>None</span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                <button
                                  onClick={() => navigate(`/dashboard/${p.id}`)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, padding: "6px 12px", color: theme.text, fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all 0.2s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg; e.currentTarget.style.borderColor = theme.muted2; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border; }}
                                >
                                  Open <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                !loading && (
                  <div style={{ ...cardStyle, padding: 40, textAlign: "center", color: theme.muted, fontSize: 14 }}>
                    No projects found.
                  </div>
                )
              )}
            </div>
          )}

          {tab === "alerts" && <div className="admin-fade"><SectionHeader title="Alerts" sub="System notifications and warnings" theme={theme} /><div style={{ padding: 40, textAlign: "center", color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface }}>This section is being updated to the new design system.</div></div>}
          {tab === "settings" && <div className="admin-fade"><SectionHeader title="Settings" sub="Manage your account preferences" theme={theme} /><div style={{ padding: 40, textAlign: "center", color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface }}>This section is being updated to the new design system.</div></div>}
        </div>
      </main>
    </div>
  );
}
