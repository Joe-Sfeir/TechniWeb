import React, { useState, useEffect, Fragment } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Globe, Users, Key, LogOut, Copy, Check, X, RefreshCw, ExternalLink, UserPlus, Search, Send, Cpu, PlusCircle, Trash2, Upload, Sun, Moon, Menu, GitBranch, ChevronDown } from "lucide-react";
import { getToken, getRole, clearAuth, handleAuthError } from "../lib/auth";
import { API_URL } from "../config";
import { useTheme } from "../context/ThemeContext";

const API_BASE = API_URL;

// ─── Design Tokens ────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  clients: { id: number; email: string }[];
  tier: number;
  status: "online" | "offline" | "warning";
  device_count: number;
  last_seen: string;
  project_key?: string;
  activation_count?: number;
  node_count?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  reset_requested: boolean;
  last_login: string;
  project_count: number;
}

interface LicenseResult {
  license_key: string;
  username: string;
  project_name: string;
  tier?: number;
  mode: string;
  protocols: string;
  expires_at: string;
}

interface LicenseRecord {
  id: number;
  username: string;
  project_name: string;
  tier?: number;
  mode: string;
  protocols: string;
  expires_at: string;
  created_at: string;
}

interface OnlineProject {
  id: string;
  name: string;
  tier: number;
  project_key: string;
  max_activations: number;
  activation_count: number;
  node_count: number;
  duration_days: number;
  expires_at: string;
  is_active: boolean;
  allowed_meters: string[];
  protocols: string;
  notes?: string;
  status: "ONLINE" | "OFFLINE" | "NEVER";
  clients: { id: number; email: string }[];
}

interface OnlineActivation {
  machine_id: string;
  node_name: string;
  last_seen: string;
  is_active: boolean;
  polling_state?: "running" | "stopped" | "fault";
}

interface MeterRegister {
  name: string;
  address: number;
  length: 1 | 2;
  data_type: "Float32" | "UInt16" | "UInt32" | "INT16" | "INT32";
  multiplier: number;
}

interface MeterProfile {
  id: string;
  model: string;
  display_name: string;
  endianness: "ABCD" | "CDAB" | "BADC" | "DCBA";
  baud_rate: number;
  parity: "None" | "Even" | "Odd";
  registers: MeterRegister[];
  updated_at?: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  { id: "p1", name: "HVAC Complex A",    clients: [{ id: 1, email: "ali@alnoor.ae" }],   tier: 2, status: "online",  device_count: 6,  last_seen: "just now"  },
  { id: "p2", name: "Data Center UPS",   clients: [{ id: 2, email: "john@techco.com" }], tier: 3, status: "online",  device_count: 12, last_seen: "2 min ago" },
  { id: "p3", name: "Substation Grid",   clients: [{ id: 3, email: "sara@ep.ae" }],      tier: 1, status: "warning", device_count: 4,  last_seen: "8 min ago" },
  { id: "p4", name: "Mall Main Incomer", clients: [],                                     tier: 2, status: "offline", device_count: 3,  last_seen: "1 hr ago"  },
  { id: "p5", name: "Factory Line B",    clients: [],                                     tier: 1, status: "online",  device_count: 8,  last_seen: "just now"  },
];

const DEMO_USERS: User[] = [
  { id: "u1", email: "ali@alnoor.ae",      name: "Ali Hassan",    role: "CLIENT",     company: "Al Noor Contracting", reset_requested: false, last_login: "Today 09:14",  project_count: 2 },
  { id: "u2", email: "john@techco.com",    name: "John Smith",    role: "CLIENT",     company: "TechCo Systems",      reset_requested: true,  last_login: "Yesterday",     project_count: 1 },
  { id: "u3", email: "sara@ep.ae",         name: "Sara Ahmed",    role: "CLIENT",     company: "Emirates Power",      reset_requested: false, last_login: "3 days ago",    project_count: 3 },
  { id: "u4", email: "admin@technicat.com",name: "Admin User",    role: "SUB_MASTER", company: "Technicat Group",     reset_requested: false, last_login: "Today 08:00",   project_count: 0 },
];

const FALLBACK_METER_OPTIONS = [
  { id: "email_alerts", label: "Email Alerts" },
  { id: "diagnostics",  label: "Diagnostics"  },
];

// ─── Color Maps ───────────────────────────────────────────────────────────────
const TIER_COLOR: Record<number, string> = {
  1: "#6366f1",
  2: "#2563eb",
  3: "#d97706",
};

const getStatusDot  = (status: string, theme: any) =>
  ({ online: theme.green, offline: theme.muted2, warning: theme.amber }[status] ?? theme.muted2);
const getStatusBg   = (status: string, theme: any) =>
  ({ online: theme.greenBg, offline: theme.bg, warning: theme.amberBg }[status] ?? theme.bg);
const getOnlineStatusColor = (status: string, theme: any) =>
  ({ ONLINE: theme.green, OFFLINE: theme.muted2, NEVER: theme.muted2 }[status] ?? theme.muted2);
const getOnlineStatusBg    = (status: string, theme: any) =>
  ({ ONLINE: theme.greenBg, OFFLINE: theme.bg, NEVER: theme.bg }[status] ?? theme.bg);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const card = (theme: any, extra?: CSSProperties): CSSProperties => ({
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
  boxShadow: theme.cardShadow,
  ...extra,
});

const BLANK_REGISTER = (): MeterRegister => ({ name: "", address: 0, length: 1, data_type: "Float32", multiplier: 1.0 });

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

// ─── Fleet Tab ────────────────────────────────────────────────────────────────
function FleetTab({ theme }: { theme: any }) {
  const navigate = useNavigate();
  const cardStyle: CSSProperties = {
    background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
    boxShadow: theme.cardShadow, overflow: "hidden"
  };
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [demo,      setDemo]      = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [fleetSearch,  setFleetSearch]  = useState("");
  const [assignSel,    setAssignSel]    = useState<Record<string, string>>({});
  const [assigning,    setAssigning]    = useState<Record<string, boolean>>({});
  const [assignMsg,    setAssignMsg]    = useState<Record<string, { ok: boolean; text: string }>>({});
  const [unassigning,  setUnassigning]  = useState<Record<string, boolean>>({});
  const [unassignError, setUnassignError] = useState<Record<string, string>>({});

  async function fetchData() {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [pr, ur] = await Promise.all([
      fetch(`${API_BASE}/api/admin/projects`, { headers }),
      fetch(`${API_BASE}/api/admin/users`,    { headers }),
    ]);
    if (handleAuthError(pr, navigate) || handleAuthError(ur, navigate)) return;
    if (!pr.ok || !ur.ok) throw new Error("Server error");
    const pd = await pr.json();
    const ud = await ur.json();
    setProjects(Array.isArray(pd) ? pd : pd.projects ?? []);
    const allUsers: User[] = Array.isArray(ud) ? ud : ud.users ?? [];
    setUsers(allUsers.filter((u) => u.role === "CLIENT"));
  }

  useEffect(() => {
    fetchData()
      .catch(() => {
        setProjects(DEMO_PROJECTS);
        setUsers(DEMO_USERS.filter((u) => u.role === "CLIENT"));
        setDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  async function assign(projectId: string) {
    const userId = assignSel[projectId];
    if (!userId) return;
    setAssigning((prev) => ({ ...prev, [projectId]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) {
        const errText = await res.text().catch(() => "Request failed");
        throw new Error(errText || "Request failed");
      }
      const selectedUser = users.find((u) => String(u.id) === String(userId));
      setProjects((prev) => prev.map((p) => p.id === projectId
        ? { ...p, clients: [...(p.clients ?? []), { id: Number(userId), email: selectedUser?.email ?? "" }] }
        : p));
      setAssignSel((prev) => { const n = { ...prev }; delete n[projectId]; return n; });
      setAssignMsg((prev) => ({ ...prev, [projectId]: { ok: true, text: "Assigned" } }));
      setTimeout(() => setAssignMsg((prev) => { const n = { ...prev }; delete n[projectId]; return n; }), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setAssignMsg((prev) => ({ ...prev, [projectId]: { ok: false, text: msg } }));
      setTimeout(() => setAssignMsg((prev) => { const n = { ...prev }; delete n[projectId]; return n; }), 4000);
    } finally {
      setAssigning((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  async function unassign(projectId: string, clientId: number) {
    const key = `${projectId}-${clientId}`;
    setUnassigning((prev) => ({ ...prev, [key]: true }));
    setUnassignError((prev) => { const n = { ...prev }; delete n[key]; return n; });
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/unassign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: clientId }),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) {
        const errText = await res.text().catch(() => "Request failed");
        throw new Error(errText || "Request failed");
      }
      setProjects((prev) => prev.map((p) => p.id === projectId
        ? { ...p, clients: p.clients.filter((c) => c.id !== clientId) }
        : p));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setUnassignError((prev) => ({ ...prev, [key]: msg }));
      setTimeout(() => setUnassignError((prev) => { const n = { ...prev }; delete n[key]; return n; }), 4000);
    } finally {
      setUnassigning((prev) => ({ ...prev, [key]: false }));
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner color={theme.accent} /></div>;

  const fleetQ     = fleetSearch.trim().toLowerCase();
  const assigned   = projects.filter((p) => p.clients.length > 0  && (!fleetQ || p.name.toLowerCase().includes(fleetQ)));
  const unassigned = projects.filter((p) => p.clients.length === 0 && (!fleetQ || p.name.toLowerCase().includes(fleetQ)));

  const thStyle: CSSProperties = { textAlign: "left", padding: "14px 16px", color: theme.muted, fontWeight: 600, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${theme.border}`, background: theme.bg };
  const tdStyle: CSSProperties = { padding: "16px", color: theme.text, fontSize: 14, borderBottom: `1px solid ${theme.border}` };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'online') return theme.green;
    if (status.toLowerCase() === 'warning') return theme.amber;
    return theme.muted2;
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <SectionHeader title="Global Fleet" sub={`${projects.length} active projects across all clients`} theme={theme} />
      {demo && <DemoBanner theme={theme} />}

      <div style={{ marginBottom: 24, position: "relative", maxWidth: 400 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.muted2, pointerEvents: "none" }} />
        <input
          value={fleetSearch}
          onChange={(e) => setFleetSearch(e.target.value)}
          placeholder="Search projects…"
          style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = theme.accent; }}
          onBlur={(e) => { e.target.style.borderColor = theme.border; }}
        />
      </div>

      {assigned.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Project", "Clients", "Status", "Devices", "Last Seen", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((p) => (
                  <tr key={p.id} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.bg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {p.clients.map((c) => {
                          const key = `${p.id}-${c.id}`;
                          return (
                            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: theme.accent, fontWeight: 500 }}>
                              {c.email}
                              <button onClick={() => unassign(p.id, c.id)} disabled={unassigning[key]} style={{ background: "none", border: "none", padding: 0, cursor: unassigning[key] ? "not-allowed" : "pointer", color: theme.accent, opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}>
                                {unassigning[key] ? <Spinner color={theme.accent} /> : <X size={12} />}
                              </button>
                              {unassignError[key] && <span style={{ fontSize: 10, color: theme.danger }}>{unassignError[key]}</span>}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: getStatusColor(p.status) }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor(p.status) }} />
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.muted }}>{p.device_count}</td>
                    <td style={{ ...tdStyle, color: theme.muted }}>{p.last_seen}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          value={assignSel[p.id] ?? ""}
                          onChange={(e) => setAssignSel((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: assignSel[p.id] ? theme.text : theme.muted, fontSize: 13, outline: "none", cursor: "pointer", minWidth: 140 }}
                        >
                          <option value="" disabled>Add client…</option>
                          {users.filter((u) => !p.clients.some((c) => String(c.id) === String(u.id))).map((u) => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                          ))}
                        </select>
                        <button
                          disabled={!assignSel[p.id] || assigning[p.id]}
                          onClick={() => assign(p.id)}
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: assignSel[p.id] ? theme.accent : theme.bg, border: `1px solid ${assignSel[p.id] ? theme.accent : theme.border}`, borderRadius: 6, padding: "8px 16px", color: assignSel[p.id] ? "#fff" : theme.muted, fontSize: 13, cursor: assignSel[p.id] ? "pointer" : "not-allowed", fontWeight: 600, minWidth: 70 }}
                        >
                          {assigning[p.id] ? <Spinner color="#fff" /> : "Add"}
                        </button>
                        {assignMsg[p.id] && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: assignMsg[p.id].ok ? theme.green : theme.danger, background: assignMsg[p.id].ok ? theme.greenBg : theme.dangerBg, border: `1px solid ${assignMsg[p.id].ok ? theme.greenBdr : theme.dangerBdr}`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>
                            {assignMsg[p.id].text}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unassigned.length > 0 && (
        <div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 600, fontSize: 16, color: theme.amber, marginBottom: 16 }}>Unassigned Projects</h3>
          <div style={cardStyle}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Project", "Status", "Devices", "Last Seen", "Assign To"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((p) => (
                    <tr key={p.id} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.bg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: getStatusColor(p.status) }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor(p.status) }} />
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: theme.muted }}>{p.device_count}</td>
                      <td style={{ ...tdStyle, color: theme.muted }}>{p.last_seen}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select
                            value={assignSel[p.id] ?? ""}
                            onChange={(e) => setAssignSel((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: assignSel[p.id] ? theme.text : theme.muted, fontSize: 13, outline: "none", cursor: "pointer", minWidth: 140 }}
                          >
                            <option value="" disabled>Select client…</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>{u.email}</option>
                            ))}
                          </select>
                          <button
                            disabled={!assignSel[p.id] || assigning[p.id]}
                            onClick={() => assign(p.id)}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: assignSel[p.id] ? theme.accent : theme.bg, border: `1px solid ${assignSel[p.id] ? theme.accent : theme.border}`, borderRadius: 6, padding: "8px 16px", color: assignSel[p.id] ? "#fff" : theme.muted, fontSize: 13, cursor: assignSel[p.id] ? "pointer" : "not-allowed", fontWeight: 600, minWidth: 80 }}
                          >
                            {assigning[p.id] ? <Spinner color="#fff" /> : "Assign"}
                          </button>
                          {assignMsg[p.id] && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: assignMsg[p.id].ok ? theme.green : theme.danger, background: assignMsg[p.id].ok ? theme.greenBg : theme.dangerBg, border: `1px solid ${assignMsg[p.id].ok ? theme.greenBdr : theme.dangerBdr}`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>
                              {assignMsg[p.id].text}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div style={{ ...cardStyle, padding: 40, textAlign: "center", color: theme.muted, fontSize: 14 }}>
          No projects found.
        </div>
      )}
    </div>
  );
}

// ─── Set Password Modal ───────────────────────────────────────────────────────
function SetPasswordModal({ user, onClose, onSuccess, theme }: { user: User; onClose: () => void; onSuccess: (userId: string) => void; theme: any }) {
  const navigate = useNavigate();
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [done,        setDone]        = useState(false);
  const [copied,      setCopied]      = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { setError("Passwords do not match"); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(null);
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user.id, new_password: newPass }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Failed to set password");
      setDone(true);
      onSuccess(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(newPass).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ ...card(theme, { padding: 36, maxWidth: 440, width: "90%", position: "relative", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }) }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: theme.muted, cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: theme.text, marginBottom: 4 }}>Set Password</div>
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>{user.name} · {user.email}</div>

        {!done ? (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>New Password</label>
              <input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} required placeholder="Enter new password" style={inputStyle} autoFocus
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Confirm Password</label>
              <input type="text" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required placeholder="Repeat password" style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            {error && (
              <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={loading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 8, background: theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, transition: "all 0.2s" }}>
                {loading ? <Spinner color="#fff" /> : <><Check size={14} /> Set Password</>}
              </button>
              <button type="button" onClick={onClose} style={{ padding: "11px 18px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.green, fontWeight: 700, fontSize: 15 }}>
              <Check size={16} /> Password updated successfully
            </div>
            <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>New Password</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 18, color: theme.accent, wordBreak: "break-all" }}>{newPass}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, background: copied ? theme.greenBg : theme.accentDim, border: `1px solid ${copied ? theme.greenBdr : `${theme.accent}40`}`, color: copied ? theme.green : theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Password</>}
              </button>
              <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab({ theme }: { theme: any }) {
  const navigate = useNavigate();
  const [users,         setUsers]         = useState<User[]>([]);
  const [demo,          setDemo]          = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [clientSearch,  setClientSearch]  = useState("");
  const [setPassUser,   setSetPassUser]   = useState<User | null>(null);
  const [confirmDelete,   setConfirmDelete]   = useState<string | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);
  const [expandedUser,    setExpandedUser]    = useState<string | null>(null);
  const [allProjects,     setAllProjects]     = useState<Project[]>([]);
  const [projectsLoaded,  setProjectsLoaded]  = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
        if (handleAuthError(r, navigate)) return;
        const d = await r.json();
        setUsers(Array.isArray(d) ? d : d.users ?? []);
      } catch {
        setUsers(DEMO_USERS);
        setDemo(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function toggleUserProjects(userId: string) {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (projectsLoaded) return;
    setProjectsLoading(true);
    try {
      const token = getToken();
      const r = await fetch(`${API_BASE}/api/admin/projects`, { headers: { Authorization: `Bearer ${token}` } });
      if (handleAuthError(r, navigate)) return;
      const d = await r.json();
      setAllProjects(Array.isArray(d) ? d : d.projects ?? []);
      setProjectsLoaded(true);
    } catch {
      // panel will show "No projects"
    } finally {
      setProjectsLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner color={theme.accent} /></div>;

  const clientQ       = clientSearch.trim().toLowerCase();
  const filteredUsers = clientQ
    ? users.filter((u) => u.name?.toLowerCase().includes(clientQ) || u.email?.toLowerCase().includes(clientQ))
    : users;

  return (
    <div className="admin-fade">
      {setPassUser && (
        <SetPasswordModal
          user={setPassUser}
          onClose={() => setSetPassUser(null)}
          onSuccess={(userId) => {
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, reset_requested: false } : u));
            setSetPassUser(null);
          }}
          theme={theme}
        />
      )}
      <SectionHeader title="Client Management" sub={`${users.length} registered users`} theme={theme} />
      {demo && <DemoBanner theme={theme} />}

      <div style={{ marginBottom: 16, position: "relative", maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.muted2, pointerEvents: "none" }} />
        <input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
          onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
          onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredUsers.length === 0 && (
          <div style={{ ...card(theme, { padding: 32, textAlign: "center", color: theme.muted, fontSize: 13 }) }}>
            {clientQ ? "No users match your search." : "No users registered yet."}
          </div>
        )}
        {filteredUsers.map((u) => (
          <Fragment key={u.id}>
          <div style={{
            ...card(theme, { padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }),
            background: u.reset_requested ? theme.amberBg : theme.surface,
            borderColor: u.reset_requested ? theme.amberBdr : theme.border,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: theme.accentDim, border: `1px solid ${theme.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, color: theme.accent, fontSize: 16, flexShrink: 0 }}>
              {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: theme.text, fontSize: 14 }}>{u.name ?? u.email}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: u.role === "CLIENT" ? theme.muted : theme.accent, background: u.role === "CLIENT" ? theme.bg : theme.accentDim, padding: "1px 7px", borderRadius: 4, border: `1px solid ${u.role === "CLIENT" ? theme.border : `${theme.accent}40`}` }}>{u.role}</span>
                {u.reset_requested && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.amber, background: theme.amberBg, padding: "1px 7px", borderRadius: 4, border: `1px solid ${theme.amberBdr}`, letterSpacing: "0.04em" }}>Reset Requested</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{u.email}{u.company ? ` · ${u.company}` : ""}</div>
              <div style={{ fontSize: 11, color: theme.muted2, marginTop: 2 }}>{u.last_login ? `Last login: ${u.last_login} · ` : ""}{u.project_count ?? 0} project{(u.project_count ?? 0) !== 1 ? "s" : ""}</div>
            </div>

            <button
              onClick={() => toggleUserProjects(u.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: expandedUser === u.id ? theme.accentDim : theme.bg, border: `1px solid ${expandedUser === u.id ? `${theme.accent}40` : theme.border}`, color: expandedUser === u.id ? theme.accent : theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (expandedUser !== u.id) { e.currentTarget.style.borderColor = `${theme.accent}40`; e.currentTarget.style.color = theme.accent; e.currentTarget.style.background = theme.accentDim; } }}
              onMouseLeave={(e) => { if (expandedUser !== u.id) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = theme.bg; } }}
            >
              <Globe size={12} /> Projects ({u.project_count ?? 0})
            </button>

            <button
              onClick={() => setSetPassUser(u)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: u.reset_requested ? theme.amberBg : theme.bg, border: `1px solid ${u.reset_requested ? theme.amberBdr : theme.border}`, color: u.reset_requested ? theme.amber : theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${theme.accent}40`; e.currentTarget.style.color = theme.accent; e.currentTarget.style.background = theme.accentDim; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = u.reset_requested ? theme.amberBdr : theme.border; e.currentTarget.style.color = u.reset_requested ? theme.amber : theme.muted; e.currentTarget.style.background = u.reset_requested ? theme.amberBg : theme.bg; }}
            >
              <RefreshCw size={12} /> Set Password
            </button>

            {u.role !== "MASTER" && (
              confirmDelete === u.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span style={{ fontSize: 12, color: theme.danger, fontWeight: 600 }}>Are you sure?</span>
                  {deleteError && <span style={{ fontSize: 11, color: theme.danger }}>{deleteError}</span>}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={deleteLoading}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, fontSize: 12, fontWeight: 700, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.65 : 1 }}
                    >
                      {deleteLoading ? <Spinner color={theme.danger} /> : "Delete"}
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                      style={{ padding: "6px 12px", borderRadius: 7, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 12, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmDelete(u.id); setDeleteError(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.dangerBdr; e.currentTarget.style.color = theme.danger; e.currentTarget.style.background = theme.dangerBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = theme.bg; }}
                >
                  <X size={12} /> Delete
                </button>
              )
            )}
          </div>

          {expandedUser === u.id && (
            <div style={{ marginTop: -4, marginLeft: 8, borderLeft: `3px solid ${theme.accent}`, paddingLeft: 16, paddingTop: 12, paddingBottom: 12 }}>
              {projectsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.muted, fontSize: 13 }}><Spinner color={theme.accent} /> Loading projects…</div>
              ) : (() => {
                const userProjects = allProjects.filter((p) => p.clients.some((c) => c.email === u.email));
                if (userProjects.length === 0) {
                  return <div style={{ fontSize: 13, color: theme.muted2 }}>No projects assigned.</div>;
                }
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                    {userProjects.map((p) => (
                      <div key={p.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[p.tier] ?? theme.muted, background: `${TIER_COLOR[p.tier] ?? theme.muted}14`, padding: "2px 7px", borderRadius: 4, border: `1px solid ${TIER_COLOR[p.tier] ?? theme.muted}28` }}>TIER {p.tier}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: getStatusDot(p.status, theme), background: getStatusBg(p.status, theme), padding: "2px 8px", borderRadius: 20, border: `1px solid ${getStatusDot(p.status, theme)}30` }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: getStatusDot(p.status, theme), flexShrink: 0 }} />{p.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: theme.muted2 }}>Last seen: {p.last_seen}</div>
                        <button
                          onClick={() => navigate(`/dashboard/${p.id}`, { state: { from: "/admin" } })}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: theme.accentDim, border: `1px solid ${theme.accent}40`, borderRadius: 6, padding: "5px 10px", color: theme.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                        >
                          <ExternalLink size={11} /> View
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Create User Tab ──────────────────────────────────────────────────────────
function CreateUserTab({ theme }: { theme: any }) {
  const navigate = useNavigate();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [company,  setCompany]  = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [role,     setRole]     = useState<"CLIENT" | "SUB_MASTER">("CLIENT");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(null); setSuccess(null); setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: name, email, company, password, role }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? (data.message as string) ?? "Failed to create user");
      setSuccess(email);
      setName(""); setEmail(""); setCompany(""); setPassword(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const toggleBtnStyle = (active: boolean): CSSProperties => ({
    padding: "7px 20px", borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
    background: active ? theme.accentDim : theme.bg,
    border: `1px solid ${active ? `${theme.accent}40` : theme.border}`,
    color: active ? theme.accent : theme.muted,
  });

  return (
    <div className="admin-fade">
      <SectionHeader title="Create User" sub="Register a new client or sub-admin account" theme={theme} />

      <div style={{ maxWidth: 480 }}>
        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, borderRadius: 10, marginBottom: 20, color: theme.green, fontSize: 13 }}>
            <Check size={15} />
            <span>Account created for <strong>{success}</strong> — they can now log in.</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Full Name",     val: name,     set: setName,     ph: "John Smith",          type: "text"     },
            { label: "Email Address", val: email,    set: setEmail,    ph: "john@company.com",     type: "email"    },
            { label: "Company",       val: company,  set: setCompany,  ph: "TechCo Systems",       type: "text"     },
            { label: "Password",      val: password, set: setPassword, ph: "Set initial password", type: "text"     },
            { label: "Confirm",       val: confirm,  set: setConfirm,  ph: "Repeat password",      type: "text"     },
          ].map(({ label, val, set, ph, type }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
              <input type={type} value={val} onChange={(e) => set(e.target.value)} required={label !== "Company"} placeholder={ph} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Role</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setRole("CLIENT")} style={toggleBtnStyle(role === "CLIENT")}>Client</button>
              {getRole() === "MASTER" && (
                <button type="button" onClick={() => setRole("SUB_MASTER")} style={toggleBtnStyle(role === "SUB_MASTER")}>Sub Master</button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: loading ? "rgba(26,95,255,0.55)" : theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4, boxShadow: `0 4px 16px ${theme.accent}40`, transition: "all 0.2s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? <Spinner color="#fff" /> : <><UserPlus size={15} /> Create User</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Online Projects Tab ──────────────────────────────────────────────────────
function OnlineProjectsTab({ meterOptions, theme }: { meterOptions: { id: string; label: string }[]; theme: any }) {
  const navigate = useNavigate();

  // list state
  const [projects,     setProjects]     = useState<OnlineProject[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  // create form
  const [name,         setName]         = useState("");
  const [tier,         setTier]         = useState(1);
  const [maxAct,       setMaxAct]       = useState(1);
  const [durDays,      setDurDays]      = useState(365);
  const [meters,       setMeters]       = useState<string[]>([]);
  const [protocols,    setProtocols]    = useState("All");
  const [notes,        setNotes]        = useState("");
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState<string | null>(null);
  const [newKey,       setNewKey]       = useState<string | null>(null);
  const [copiedKey,    setCopiedKey]    = useState(false);

  // expand / activations
  const [expanded,           setExpanded]           = useState<string | null>(null);
  const [activations,        setActivations]        = useState<Record<string, OnlineActivation[]>>({});
  const [activationsLoading, setActivationsLoading] = useState<Record<string, boolean>>({});
  const [copiedProjectKey,   setCopiedProjectKey]   = useState<string | null>(null);

  // edit
  const [editId,       setEditId]       = useState<string | null>(null);
  const [editName,     setEditName]     = useState("");
  const [editTier,     setEditTier]     = useState(1);
  const [editMaxAct,   setEditMaxAct]   = useState(1);
  const [editDurDays,  setEditDurDays]  = useState(365);
  const [editMeters,   setEditMeters]   = useState<string[]>([]);
  const [editProtocols,setEditProtocols]= useState("All");
  const [editNotes,    setEditNotes]    = useState("");
  const [editing,      setEditing]      = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);

  // renew
  const [renewId,      setRenewId]      = useState<string | null>(null);
  const [renewDays,    setRenewDays]    = useState(365);
  const [renewing,     setRenewing]     = useState(false);
  const [renewError,   setRenewError]   = useState<string | null>(null);

  // activate toggle
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  // hide / show
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("hidden_online_projects") ?? "[]")); }
    catch { return new Set<string>(); }
  });
  const [showHiddenProjects, setShowHiddenProjects] = useState(false);

  function toggleHideProject(id: string) {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("hidden_online_projects", JSON.stringify([...next]));
      return next;
    });
  }

  // delete
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteInput,   setDeleteInput]   = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // node toggle
  const [nodeToggleLoading, setNodeToggleLoading] = useState<Record<string, boolean>>({});

  // push config modal
  const [pushCfgProjectId,  setPushCfgProjectId]  = useState<string | null>(null);
  const [pushCfgMachineId,  setPushCfgMachineId]  = useState<string | null>(null);
  const [pushCfgRegisters,  setPushCfgRegisters]  = useState<Set<string>>(new Set());
  const [pushCfgThresholds, setPushCfgThresholds] = useState<Record<string, { min: string; max: string }>>({});
  const [pushCfgPollRate,   setPushCfgPollRate]   = useState(5000);
  const [pushCfgSaving,     setPushCfgSaving]     = useState(false);
  const [pushCfgError,      setPushCfgError]      = useState<string | null>(null);
  const [pushCfgSuccess,    setPushCfgSuccess]    = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/admin/online-projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (handleAuthError(r, navigate)) throw new Error("auth"); return r.json(); })
      .then((d) => setProjects(Array.isArray(d) ? d : d.projects ?? []))
      .catch((err) => { if (err?.message !== "auth") setFetchError("Could not load online projects."); })
      .finally(() => setLoading(false));
  }, [navigate]);

  function openPushConfig(projectId: string, machineId: string, allowedMeters: string[]) {
    setPushCfgProjectId(projectId);
    setPushCfgMachineId(machineId);
    setPushCfgRegisters(new Set(allowedMeters));
    setPushCfgThresholds({});
    setPushCfgPollRate(5000);
    setPushCfgError(null);
    setPushCfgSuccess(null);
  }

  async function deployConfig() {
    if (!pushCfgProjectId || !pushCfgMachineId) return;
    setPushCfgSaving(true);
    setPushCfgError(null);
    setPushCfgSuccess(null);
    try {
      const token = getToken();
      const thresholds: Record<string, { min: number | null; max: number | null }> = {};
      Object.entries(pushCfgThresholds).forEach(([reg, vals]) => {
        thresholds[reg] = {
          min: vals.min !== "" ? Number(vals.min) : null,
          max: vals.max !== "" ? Number(vals.max) : null,
        };
      });
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${pushCfgProjectId}/push-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          machine_id: pushCfgMachineId,
          config: { registers: [...pushCfgRegisters], alarm_thresholds: thresholds, poll_rate_ms: pushCfgPollRate },
        }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Deploy failed");
      setPushCfgSuccess(`Deployed — config version ${data.config_version ?? "?"}`);
    } catch (err) {
      setPushCfgError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setPushCfgSaving(false);
    }
  }

  function toggleMeter(id: string) {
    setMeters((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }
  function toggleEditMeter(id: string) {
    setEditMeters((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, tier, max_activations: maxAct, duration_days: durDays, allowed_meters: meters, protocols, notes: notes || undefined }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Failed to create project");
      setNewKey((data.project_key as string) ?? "");
      setProjects((prev) => [data as unknown as OnlineProject, ...prev]);
      setName(""); setTier(1); setMaxAct(1); setDurDays(365); setMeters([]); setProtocols("All"); setNotes("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function expandProject(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (activations[id]) return;
    setActivationsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${id}/activations`, { headers: { Authorization: `Bearer ${token}` } });
      if (handleAuthError(res, navigate)) return;
      const d = await res.json().catch(() => []);
      setActivations((prev) => ({ ...prev, [id]: Array.isArray(d) ? d : d.activations ?? [] }));
    } catch {
      setActivations((prev) => ({ ...prev, [id]: [] }));
    } finally {
      setActivationsLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  function copyProjectKey(key: string, id: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedProjectKey(id);
      setTimeout(() => setCopiedProjectKey(null), 2000);
    });
  }

  function openEdit(p: OnlineProject) {
    setEditId(p.id);
    setEditName(p.name);
    setEditTier(p.tier);
    setEditMaxAct(p.max_activations);
    setEditDurDays(p.duration_days);
    setEditMeters(p.allowed_meters ?? []);
    setEditProtocols(p.protocols ?? "All");
    setEditNotes(p.notes ?? "");
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    setEditing(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, tier: editTier, max_activations: editMaxAct, duration_days: editDurDays, allowed_meters: editMeters, protocols: editProtocols, notes: editNotes || undefined }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Failed to save changes");
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: editName, tier: editTier, max_activations: editMaxAct, duration_days: editDurDays, allowed_meters: editMeters, protocols: editProtocols, notes: editNotes } : p));
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setEditing(false);
    }
  }

  async function renewProject() {
    if (!renewId) return;
    setRenewError(null);
    setRenewing(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${renewId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_days: renewDays }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Failed to renew project");
      if (data.expires_at) {
        setProjects((prev) => prev.map((p) => p.id === renewId ? { ...p, expires_at: data.expires_at as string } : p));
      }
      setRenewId(null);
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : "Failed to renew project");
    } finally {
      setRenewing(false);
    }
  }

  async function toggleActive(p: OnlineProject) {
    setToggleLoading((prev) => ({ ...prev, [p.id]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) throw new Error("Request failed");
      setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
    } catch {
      // silently ignore — button will re-enable
    } finally {
      setToggleLoading((prev) => ({ ...prev, [p.id]: false }));
    }
  }

  async function deleteProject() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirm: true }),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? "Failed to delete project");
      }
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      setDeleteInput("");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleNode(projectId: string, machineId: string, current: boolean) {
    const key = `${projectId}-${machineId}`;
    setNodeToggleLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/online-projects/${projectId}/activations/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !current }),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) throw new Error("Request failed");
      setActivations((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).map((a) => a.machine_id === machineId ? { ...a, is_active: !current } : a),
      }));
    } catch {
      // silently ignore
    } finally {
      setNodeToggleLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const toggleBtn = (active: boolean, color?: string): CSSProperties => ({
    padding: "7px 18px", borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
    background: active ? (color ? `${color}14` : theme.accentDim) : theme.bg,
    border: `1px solid ${active ? (color ? `${color}40` : `${theme.accent}40`) : theme.border}`,
    color: active ? (color ?? theme.accent) : theme.muted,
  });

  const thStyle: CSSProperties = { textAlign: "left", padding: "10px 14px", color: theme.muted, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${theme.border}`, background: theme.bg };
  const tdStyle: CSSProperties = { padding: "12px 14px", color: theme.text, fontSize: 13, borderBottom: `1px solid ${theme.border}` };

  const deleteProject_ = projects.find((p) => p.id === deleteId);
  const renewProject_  = projects.find((p) => p.id === renewId);

  return (
    <div className="admin-fade">
      {/* ── Renew Modal ─────────────────────────────────────────────────────── */}
      {renewId && renewProject_ && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ ...card(theme, { padding: 32, maxWidth: 400, width: "90%", position: "relative", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }) }}>
            <button onClick={() => { setRenewId(null); setRenewError(null); }} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: theme.muted, cursor: "pointer" }}><X size={18} /></button>
            <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: theme.text, marginBottom: 4 }}>Renew Project</div>
            <div style={{ fontSize: 13, color: theme.muted, marginBottom: 20 }}>{renewProject_.name}</div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Additional Days</label>
            <input type="number" min={1} value={renewDays} onChange={(e) => setRenewDays(Number(e.target.value))} style={{ ...inputStyle, marginBottom: 16 }}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            {renewError && <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 14 }}>{renewError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={renewProject} disabled={renewing} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 8, background: theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: renewing ? "not-allowed" : "pointer", opacity: renewing ? 0.65 : 1 }}>
                {renewing ? <Spinner color="#fff" /> : <><RefreshCw size={14} /> Renew</>}
              </button>
              <button onClick={() => { setRenewId(null); setRenewError(null); }} style={{ padding: "11px 18px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      {deleteId && deleteProject_ && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ ...card(theme, { padding: 32, maxWidth: 440, width: "90%", position: "relative", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }) }}>
            <button onClick={() => { setDeleteId(null); setDeleteInput(""); setDeleteError(null); }} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: theme.muted, cursor: "pointer" }}><X size={18} /></button>
            <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: theme.danger, marginBottom: 4 }}>Delete Project</div>
            <div style={{ fontSize: 13, color: theme.muted, marginBottom: 6 }}>This action cannot be undone. All activations will be invalidated.</div>
            <div style={{ fontSize: 13, color: theme.text, marginBottom: 16 }}>Type <strong>{deleteProject_.name}</strong> to confirm:</div>
            <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder={deleteProject_.name} style={{ ...inputStyle, marginBottom: 16 }}
              onFocus={(e) => { e.target.style.borderColor = theme.danger; e.target.style.boxShadow = `0 0 0 3px ${theme.danger}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            {deleteError && <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 14 }}>{deleteError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={deleteProject}
                disabled={deleteLoading || deleteInput !== deleteProject_.name}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 8, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, fontWeight: 700, fontSize: 14, cursor: (deleteLoading || deleteInput !== deleteProject_.name) ? "not-allowed" : "pointer", opacity: (deleteLoading || deleteInput !== deleteProject_.name) ? 0.55 : 1 }}
              >
                {deleteLoading ? <Spinner color={theme.danger} /> : <><X size={14} /> Delete</>}
              </button>
              <button onClick={() => { setDeleteId(null); setDeleteInput(""); setDeleteError(null); }} style={{ padding: "11px 18px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Push Config Modal ────────────────────────────────────────────────── */}
      {pushCfgProjectId && pushCfgMachineId && (() => {
        const proj = projects.find((p) => p.id === pushCfgProjectId);
        const allowedMeters = proj?.allowed_meters ?? [];
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
            <div style={{ ...card(theme, { padding: 28, maxWidth: 520, width: "90%", position: "relative", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }) }}>
              <button onClick={() => { setPushCfgProjectId(null); setPushCfgMachineId(null); }} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: theme.muted, cursor: "pointer" }}><X size={18} /></button>
              <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: theme.text, marginBottom: 2 }}>Push Config</div>
              <div style={{ fontSize: 12, color: theme.muted, marginBottom: 20, fontFamily: "'Share Tech Mono',monospace" }}>{pushCfgMachineId}</div>

              {/* Registers */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Registers to Include</div>
                {allowedMeters.length === 0 && (
                  <div style={{ fontSize: 13, color: theme.muted2 }}>No allowed meters defined for this project.</div>
                )}
                {allowedMeters.map((reg) => {
                  const checked = pushCfgRegisters.has(reg);
                  return (
                    <div key={reg} style={{ marginBottom: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: checked ? 6 : 0 }}>
                        <div
                          onClick={() => setPushCfgRegisters((prev) => { const s = new Set(prev); s.has(reg) ? s.delete(reg) : s.add(reg); return s; })}
                          style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${checked ? theme.accent : theme.border}`, background: checked ? theme.accentDim : theme.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                        >
                          {checked && <Check size={10} color={theme.accent} />}
                        </div>
                        <span style={{ fontSize: 13, color: checked ? theme.text : theme.muted, fontFamily: "'Share Tech Mono',monospace" }}>{meterOptions.find((o) => o.id === reg)?.label ?? reg}</span>
                      </label>
                      {checked && (
                        <div style={{ display: "flex", gap: 8, marginLeft: 27 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Min</label>
                            <input
                              type="number"
                              value={pushCfgThresholds[reg]?.min ?? ""}
                              onChange={(e) => setPushCfgThresholds((prev) => ({ ...prev, [reg]: { ...prev[reg], min: e.target.value } }))}
                              placeholder="—"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }}
                              onFocus={(e) => { e.target.style.borderColor = theme.accent; }}
                              onBlur={(e) => { e.target.style.borderColor = theme.border; }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Max</label>
                            <input
                              type="number"
                              value={pushCfgThresholds[reg]?.max ?? ""}
                              onChange={(e) => setPushCfgThresholds((prev) => ({ ...prev, [reg]: { ...prev[reg], max: e.target.value } }))}
                              placeholder="—"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }}
                              onFocus={(e) => { e.target.style.borderColor = theme.accent; }}
                              onBlur={(e) => { e.target.style.borderColor = theme.border; }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Poll Rate */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Poll Rate (ms)</label>
                <input
                  type="number"
                  min={500}
                  value={pushCfgPollRate}
                  onChange={(e) => setPushCfgPollRate(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
                  onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                  onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {pushCfgError   && <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 14 }}>{pushCfgError}</div>}
              {pushCfgSuccess && <div style={{ padding: "9px 12px", background: theme.greenBg,  border: `1px solid ${theme.greenBdr}`,  borderRadius: 8, color: theme.green,  fontSize: 13, marginBottom: 14 }}>{pushCfgSuccess}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={deployConfig}
                  disabled={pushCfgSaving}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 8, background: theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: pushCfgSaving ? "not-allowed" : "pointer", opacity: pushCfgSaving ? 0.65 : 1 }}
                >
                  {pushCfgSaving ? <Spinner color="#fff" /> : <><Send size={14} /> Deploy</>}
                </button>
                <button onClick={() => { setPushCfgProjectId(null); setPushCfgMachineId(null); }} style={{ padding: "11px 18px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      <SectionHeader title="Online Projects" sub="Create and manage cloud-connected project keys" theme={theme} />

      {/* ── Create Project Form ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 500, marginBottom: 40 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 16, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>Create Project</div>

        {/* New key success box */}
        {newKey && (
          <div style={{ padding: 20, background: theme.greenBg, border: `2px solid ${theme.greenBdr}`, borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: theme.green, marginBottom: 4 }}>
              <Check size={16} /> Project Created — Save this key now!
            </div>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>This key will not be shown again.</div>
            <div style={{ background: theme.surface, border: `1px solid ${theme.greenBdr}`, borderRadius: 8, padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: theme.accent, wordBreak: "break-all", lineHeight: 1.6, marginBottom: 12 }}>{newKey}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { navigator.clipboard.writeText(newKey).then(() => { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px", borderRadius: 8, background: copiedKey ? theme.greenBg : theme.accentDim, border: `1px solid ${copiedKey ? theme.greenBdr : `${theme.accent}40`}`, color: copiedKey ? theme.green : theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                {copiedKey ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy to Clipboard</>}
              </button>
              <button onClick={() => setNewKey(null)} style={{ padding: "9px 16px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Dismiss</button>
            </div>
          </div>
        )}

        <form onSubmit={createProject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Project Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="HVAC Complex A" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Tier</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2].map((t) => (
                <button key={t} type="button" onClick={() => setTier(t)} style={toggleBtn(tier === t, TIER_COLOR[t])}>Tier {t}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Max Activations</label>
              <input type="number" min={1} value={maxAct} onChange={(e) => setMaxAct(Number(e.target.value))} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Duration (days)</label>
              <input type="number" min={1} value={durDays} onChange={(e) => setDurDays(Number(e.target.value))} required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Allowed Meters</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meterOptions.map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div onClick={() => toggleMeter(opt.id)} style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${meters.includes(opt.id) ? theme.accent : theme.border}`, background: meters.includes(opt.id) ? theme.accentDim : theme.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                    {meters.includes(opt.id) && <Check size={10} color={theme.accent} />}
                  </div>
                  <span style={{ fontSize: 13, color: meters.includes(opt.id) ? theme.text : theme.muted }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocols</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["RTU", "TCP", "All"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProtocols(p)} style={toggleBtn(protocols === p)}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes…" style={{ ...inputStyle, resize: "vertical" as const }}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {createError && <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{createError}</div>}

          <button type="submit" disabled={creating}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: creating ? "rgba(26,95,255,0.55)" : theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1, boxShadow: `0 4px 16px ${theme.accent}40`, transition: "all 0.2s" }}
            onMouseEnter={(e) => { if (!creating) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {creating ? <Spinner color="#fff" /> : <><Zap size={14} /> Create Project</>}
          </button>
        </form>
      </div>

      {/* ── Project Management List ───────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>Projects</h3>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent, background: theme.accentDim, border: `1px solid ${theme.accent}40`, padding: "1px 8px", borderRadius: 4 }}>{projects.length}</span>
          {hiddenProjects.size > 0 && (
            <button type="button" onClick={() => setShowHiddenProjects((v) => !v)} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6, background: showHiddenProjects ? theme.amberBg : theme.bg, border: `1px solid ${showHiddenProjects ? theme.amberBdr : theme.border}`, color: showHiddenProjects ? theme.amber : theme.muted, cursor: "pointer" }}>
              {showHiddenProjects ? "Hide hidden" : `Show hidden (${hiddenProjects.size})`}
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner color={theme.accent} /></div>
        ) : fetchError ? (
          <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{fetchError}</div>
        ) : projects.length === 0 ? (
          <div style={{ ...card(theme, { padding: 28, textAlign: "center", color: theme.muted, fontSize: 13 }) }}>No online projects yet. Create one above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {projects.filter((p) => showHiddenProjects || !hiddenProjects.has(p.id)).map((p) => (
              <Fragment key={p.id}>
                {/* Main row */}
                <div style={{ ...card(theme, { padding: 0, overflow: "hidden", marginBottom: 8, borderRadius: 10 }) }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(160px,2fr) 80px 120px 100px minmax(100px,1fr) auto", alignItems: "center", padding: "12px 14px", gap: 0 }}>
                    {/* Name (clickable) */}
                    <button onClick={() => expandProject(p.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontWeight: 600, color: theme.accent, fontSize: 14, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                        {expanded === p.id ? "▾" : "▸"} {p.name}
                      </span>
                    </button>
                    {/* Tier */}
                    <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[p.tier] ?? theme.muted, background: `${TIER_COLOR[p.tier] ?? theme.muted}14`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${TIER_COLOR[p.tier] ?? theme.muted}28`, display: "inline-flex", alignSelf: "center" }}>
                      TIER {p.tier}
                    </span>
                    {/* Status */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: getOnlineStatusColor(p.status, theme), background: getOnlineStatusBg(p.status, theme), padding: "3px 9px", borderRadius: 20, border: `1px solid ${getOnlineStatusColor(p.status, theme)}30` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: getOnlineStatusColor(p.status, theme), flexShrink: 0 }} />
                      {p.status}
                    </span>
                    {/* Activations */}
                    <span style={{ fontSize: 13, color: theme.muted }}>
                      {p.activation_count ?? 0}<span style={{ color: theme.muted2 }}>/{p.max_activations}</span>
                    </span>
                    {/* Expires */}
                    <span style={{ fontSize: 12, color: theme.muted }}>{p.expires_at ?? "—"}</span>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                      <button onClick={() => toggleHideProject(p.id)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: hiddenProjects.has(p.id) ? theme.accentDim : theme.bg, border: `1px solid ${hiddenProjects.has(p.id) ? `${theme.accent}40` : theme.border}`, color: hiddenProjects.has(p.id) ? theme.accent : theme.muted, cursor: "pointer" }}>
                        {hiddenProjects.has(p.id) ? "Show" : "Hide"}
                      </button>
                      <button onClick={() => openEdit(p)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => { setRenewId(p.id); setRenewDays(365); setRenewError(null); }} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: theme.amberBg, border: `1px solid ${theme.amberBdr}`, color: theme.amber, cursor: "pointer" }}>Renew</button>
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={!!toggleLoading[p.id]}
                        style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: p.is_active ? theme.dangerBg : theme.greenBg, border: `1px solid ${p.is_active ? theme.dangerBdr : theme.greenBdr}`, color: p.is_active ? theme.danger : theme.green, cursor: toggleLoading[p.id] ? "not-allowed" : "pointer", opacity: toggleLoading[p.id] ? 0.65 : 1 }}
                      >
                        {toggleLoading[p.id] ? <Spinner /> : (p.is_active ? "Deactivate" : "Activate")}
                      </button>
                      <button onClick={() => { setDeleteId(p.id); setDeleteInput(""); setDeleteError(null); }} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editId === p.id && (
                    <div style={{ borderTop: `1px solid ${theme.border}`, padding: "20px 20px", background: theme.bg }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 14 }}>Edit Project</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Project Name</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                            onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Max Activations</label>
                          <input type="number" min={1} value={editMaxAct} onChange={(e) => setEditMaxAct(Number(e.target.value))} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                            onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Duration (days)</label>
                          <input type="number" min={1} value={editDurDays} onChange={(e) => setEditDurDays(Number(e.target.value))} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                            onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Tier</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[1, 2].map((t) => (
                            <button key={t} type="button" onClick={() => setEditTier(t)} style={toggleBtn(editTier === t, TIER_COLOR[t])}>Tier {t}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Allowed Meters</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {meterOptions.map((opt) => (
                            <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                              <div onClick={() => toggleEditMeter(opt.id)} style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${editMeters.includes(opt.id) ? theme.accent : theme.border}`, background: editMeters.includes(opt.id) ? theme.accentDim : theme.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                                {editMeters.includes(opt.id) && <Check size={10} color={theme.accent} />}
                              </div>
                              <span style={{ fontSize: 13, color: editMeters.includes(opt.id) ? theme.text : theme.muted }}>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocols</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {(["RTU", "TCP", "All"] as const).map((pr) => (
                            <button key={pr} type="button" onClick={() => setEditProtocols(pr)} style={toggleBtn(editProtocols === pr)}>{pr}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Notes</label>
                        <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const }}
                          onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                          onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                      </div>
                      {editError && <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 14 }}>{editError}</div>}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => saveEdit(p.id)} disabled={editing} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, background: theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: editing ? "not-allowed" : "pointer", opacity: editing ? 0.65 : 1 }}>
                          {editing ? <Spinner color="#fff" /> : <><Check size={13} /> Save Changes</>}
                        </button>
                        <button onClick={() => setEditId(null)} style={{ padding: "9px 16px", borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expanded === p.id && (
                    <div style={{ borderTop: `1px solid ${theme.border}`, padding: "20px 20px", background: theme.surface }}>
                      {/* Details panel */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
                        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Project Key</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: theme.accent }}>
                              {p.project_key ? `${p.project_key.slice(0, 8)}...${p.project_key.slice(-4)}` : "—"}
                            </span>
                            {p.project_key && (
                              <button onClick={() => copyProjectKey(p.project_key, p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: copiedProjectKey === p.id ? theme.green : theme.muted, display: "flex", alignItems: "center", padding: 0 }}>
                                {copiedProjectKey === p.id ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                        {p.notes && (
                          <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Notes</div>
                            <div style={{ fontSize: 13, color: theme.text }}>{p.notes}</div>
                          </div>
                        )}
                        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Meters</div>
                          <div style={{ fontSize: 12, color: theme.text }}>{(p.allowed_meters ?? []).join(", ") || "—"}</div>
                        </div>
                        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Protocols</div>
                          <div style={{ fontSize: 13, color: theme.text }}>{p.protocols ?? "—"}</div>
                        </div>
                      </div>

                      {/* Clients */}
                      {p.clients && p.clients.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Assigned Clients</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {p.clients.map((c) => (
                              <span key={c.id} style={{ background: theme.accentDim, border: `1px solid ${theme.accent}40`, borderRadius: 5, padding: "3px 10px", fontSize: 12, color: theme.accent, fontWeight: 500 }}>{c.email}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activations */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Activations / Nodes</div>
                        {activationsLoading[p.id] ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.muted, fontSize: 13 }}><Spinner color={theme.accent} /> Loading…</div>
                        ) : (activations[p.id] ?? []).length === 0 ? (
                          <div style={{ fontSize: 13, color: theme.muted2 }}>No activations yet.</div>
                        ) : (
                          <div style={{ ...card(theme), overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif" }}>
                              <thead>
                                <tr>
                                  {["Node Name", "Machine ID", "Last Seen", "Polling", "Active", ""].map((h) => (
                                    <th key={h} style={{ ...thStyle, background: theme.bg }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(activations[p.id] ?? []).map((a) => {
                                  const nKey = `${p.id}-${a.machine_id}`;
                                  return (
                                    <tr key={a.machine_id}>
                                      <td style={{ ...tdStyle, fontWeight: 500 }}>{a.node_name || "—"}</td>
                                      <td style={{ ...tdStyle, fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: theme.muted }}>{a.machine_id}</td>
                                      <td style={{ ...tdStyle, color: theme.muted }}>{a.last_seen || "—"}</td>
                                      <td style={tdStyle}>
                                        {a.polling_state ? (
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: a.polling_state === "running" ? theme.green : a.polling_state === "fault" ? theme.amber : theme.muted, background: a.polling_state === "running" ? theme.greenBg : a.polling_state === "fault" ? theme.amberBg : theme.bg, border: `1px solid ${a.polling_state === "running" ? theme.greenBdr : a.polling_state === "fault" ? theme.amberBdr : theme.border}` }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: a.polling_state === "running" ? theme.green : a.polling_state === "fault" ? theme.amber : theme.muted2 }} />
                                            {a.polling_state.toUpperCase()}
                                          </span>
                                        ) : <span style={{ color: theme.muted2, fontSize: 12 }}>—</span>}
                                      </td>
                                      <td style={tdStyle}>
                                        <button
                                          onClick={() => toggleNode(p.id, a.machine_id, a.is_active)}
                                          disabled={!!nodeToggleLoading[nKey]}
                                          style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 5, background: a.is_active ? theme.greenBg : theme.bg, border: `1px solid ${a.is_active ? theme.greenBdr : theme.border}`, color: a.is_active ? theme.green : theme.muted, cursor: nodeToggleLoading[nKey] ? "not-allowed" : "pointer", opacity: nodeToggleLoading[nKey] ? 0.65 : 1, display: "inline-flex", alignItems: "center", gap: 5 }}
                                        >
                                          {nodeToggleLoading[nKey] ? <Spinner /> : (a.is_active ? "Active" : "Inactive")}
                                        </button>
                                      </td>
                                      <td style={tdStyle}>
                                        <button
                                          onClick={() => openPushConfig(p.id, a.machine_id, p.allowed_meters ?? [])}
                                          style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 5, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                                        >
                                          <Send size={11} /> Push Config
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── License Tab ──────────────────────────────────────────────────────────────
type LicenseProtocol = "RTU Only" | "TCP Only" | "All Protocols";

function LicenseTab({ meterOptions, theme }: { meterOptions: { id: string; label: string }[]; theme: any }) {
  const navigate = useNavigate();
  const [username,    setUsername]    = useState("");
  const [projectName, setProjectName] = useState("");
  const [protocols,   setProtocols]   = useState<LicenseProtocol>("All Protocols");
  const [ttl,         setTtl]         = useState(365);
  const [meters,      setMeters]      = useState<string[]>(["schneider_pm2220"]);
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState<LicenseResult | null>(null);
  const [copied,         setCopied]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [licenseHistory, setLicenseHistory] = useState<LicenseRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError,   setHistoryError]   = useState<string | null>(null);
  const [hiddenLicenses, setHiddenLicenses] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("hidden_offline_licenses") ?? "[]")); }
    catch { return new Set<string>(); }
  });
  const [showHidden,     setShowHidden]     = useState(false);

  useEffect(() => {
    const token = getToken();
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/admin/licenses`, { headers: { Authorization: `Bearer ${token}` } });
        if (handleAuthError(r, navigate)) return;
        const d = await r.json();
        setLicenseHistory(Array.isArray(d) ? d : d.licenses ?? []);
      } catch {
        setHistoryError("Could not load license history.");
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [navigate]);

  function toggleMeter(id: string) {
    setMeters((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const token = getToken();
      const backendProtocols = protocols === "RTU Only" ? "RTU" : protocols === "TCP Only" ? "TCP" : "All";
      const body: Record<string, unknown> = {
        user_name:      username,
        project_name:   projectName,
        mode:           "offline",
        protocols:      backendProtocols,
        ttl_hours:      ttl * 24,
        allowed_meters: meters,
      };
      const res = await fetch(`${API_BASE}/api/admin/generate-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json() as { license_key?: string; error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Failed to generate license");
      const exp = new Date(Date.now() + ttl * 86_400_000).toISOString().split("T")[0];
      setResult({
        license_key:  data.license_key ?? "",
        username,
        project_name: projectName,
        tier:         undefined,
        mode:         "Offline Air-Gapped",
        protocols,
        expires_at:   exp,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate license");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.license_key).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const toggleBtn = (active: boolean, color?: string): CSSProperties => ({
    padding: "7px 18px", borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
    background: active ? (color ? `${color}14` : theme.accentDim) : theme.bg,
    border: `1px solid ${active ? (color ? `${color}40` : `${theme.accent}40`) : theme.border}`,
    color: active ? (color ?? theme.accent) : theme.muted,
  });

  return (
    <div className="admin-fade">
      <SectionHeader title="Offline Licenses" sub="Generate TechniDAQ offline client licenses" theme={theme} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, maxWidth: 820 }}>
        {/* Form */}
        <form onSubmit={generate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="client_username" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Project Name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="HVAC Complex A" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocols</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["RTU Only", "TCP Only", "All Protocols"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProtocols(p)} style={toggleBtn(protocols === p)}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Validity (days)</label>
            <input type="number" min={1} max={3650} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} style={{ ...inputStyle, width: 120 }}
              onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
              onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Allowed Meters</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meterOptions.map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div onClick={() => toggleMeter(opt.id)} style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${meters.includes(opt.id) ? theme.accent : theme.border}`, background: meters.includes(opt.id) ? theme.accentDim : theme.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                    {meters.includes(opt.id) && <Check size={10} color={theme.accent} />}
                  </div>
                  <span style={{ fontSize: 13, color: meters.includes(opt.id) ? theme.text : theme.muted }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: loading ? "rgba(26,95,255,0.55)" : theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 4px 16px ${theme.accent}40`, transition: "all 0.2s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? <Spinner color="#fff" /> : <><Key size={14} /> Generate License</>}
          </button>
        </form>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ ...card(theme, { padding: 24, display: "flex", flexDirection: "column", gap: 16 }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.green, fontWeight: 700, fontSize: 15 }}>
                <Check size={16} /> License Generated
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  ["User",      result.username],
                  ["Project",   result.project_name],
                  ["Mode",      result.mode],
                  result.tier != null ? ["Tier", `Tier ${result.tier}`] : null,
                  ["Protocols", result.protocols],
                  ["Expires",   result.expires_at],
                ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ color: theme.muted }}>{k}</span>
                    <span style={{ color: theme.text, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>License Key</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: theme.accent, wordBreak: "break-all", lineHeight: 1.6 }}>{result.license_key}</div>
              </div>
              <button onClick={copy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, background: copied ? theme.greenBg : theme.accentDim, border: `1px solid ${copied ? theme.greenBdr : `${theme.accent}40`}`, color: copied ? theme.green : theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Key</>}
              </button>
              <button onClick={() => setResult(null)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>
                Generate Another
              </button>
            </div>
          ) : (
            <div style={{ ...card(theme, { padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, textAlign: "center", gap: 10 }) }}>
              <Key size={28} color={theme.muted2} />
              <div style={{ color: theme.muted, fontSize: 13 }}>Fill in the form and generate a license key</div>
            </div>
          )}
        </div>
      </div>

      {/* License History */}
      <div style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>License History</h3>
            <p style={{ fontSize: 13, color: theme.muted, marginTop: 4, marginBottom: 0 }}>All previously generated licenses</p>
          </div>
          {hiddenLicenses.size > 0 && (
            <button type="button" onClick={() => setShowHidden((v) => !v)}
              style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: showHidden ? theme.accentDim : theme.bg, border: `1px solid ${showHidden ? `${theme.accent}40` : theme.border}`, color: showHidden ? theme.accent : theme.muted, transition: "all 0.15s" }}>
              {showHidden ? "Hide hidden" : `Show hidden (${hiddenLicenses.size})`}
            </button>
          )}
        </div>
        {historyLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner color={theme.accent} /></div>
        ) : historyError ? (
          <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{historyError}</div>
        ) : licenseHistory.length === 0 ? (
          <div style={{ ...card(theme, { padding: 24, textAlign: "center", color: theme.muted, fontSize: 13 }) }}>No licenses generated yet.</div>
        ) : (
          <div style={{ ...card(theme), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif" }}>
                <thead>
                  <tr>
                    {["Username", "Project", "Mode", "Tier", "Protocols", "Expires", "Created", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: theme.muted, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, borderBottom: `1px solid ${theme.border}`, background: theme.bg }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {licenseHistory.filter((r) => showHidden || !hiddenLicenses.has(String(r.id))).map((r) => (
                    <tr key={r.id} style={{ opacity: hiddenLicenses.has(String(r.id)) ? 0.4 : 1 }}>
                      <td style={{ padding: "11px 14px", color: theme.text, fontSize: 13, borderBottom: `1px solid ${theme.border}`, fontWeight: 500 }}>{r.username}</td>
                      <td style={{ padding: "11px 14px", color: theme.text, fontSize: 13, borderBottom: `1px solid ${theme.border}` }}>{r.project_name}</td>
                      <td style={{ padding: "11px 14px", color: theme.muted, fontSize: 13, borderBottom: `1px solid ${theme.border}` }}>{r.mode}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, borderBottom: `1px solid ${theme.border}` }}>
                        {r.tier != null ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[r.tier] ?? theme.muted, background: `${TIER_COLOR[r.tier] ?? theme.muted}14`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${TIER_COLOR[r.tier] ?? theme.muted}28` }}>TIER {r.tier}</span>
                        ) : <span style={{ color: theme.muted2 }}>—</span>}
                      </td>
                      <td style={{ padding: "11px 14px", color: theme.muted, fontSize: 13, borderBottom: `1px solid ${theme.border}` }}>{r.protocols}</td>
                      <td style={{ padding: "11px 14px", color: theme.muted, fontSize: 13, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" as const }}>{r.expires_at}</td>
                      <td style={{ padding: "11px 14px", color: theme.muted2, fontSize: 12, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" as const }}>{r.created_at}</td>
                      <td style={{ padding: "11px 14px", borderBottom: `1px solid ${theme.border}` }}>
                        <button type="button" onClick={() => setHiddenLicenses((prev) => { const next = new Set(prev); if (next.has(String(r.id))) next.delete(String(r.id)); else next.add(String(r.id)); localStorage.setItem("hidden_offline_licenses", JSON.stringify([...next])); return next; })}
                          style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", background: hiddenLicenses.has(String(r.id)) ? theme.accentDim : theme.bg, border: `1px solid ${hiddenLicenses.has(String(r.id)) ? `${theme.accent}40` : theme.border}`, color: hiddenLicenses.has(String(r.id)) ? theme.accent : theme.muted, whiteSpace: "nowrap" }}>
                          {hiddenLicenses.has(String(r.id)) ? "Show" : "Hide"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Meter Profiles Tab ───────────────────────────────────────────────────────

function MeterProfilesTab({ theme }: { theme: any }) {
  const navigate = useNavigate();

  const [profiles,     setProfiles]     = useState<MeterProfile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  // add form
  const [addModel,       setAddModel]       = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addEndianness,  setAddEndianness]  = useState<MeterProfile["endianness"]>("ABCD");
  const [addBaudRate,    setAddBaudRate]    = useState(9600);
  const [addParity,      setAddParity]      = useState<MeterProfile["parity"]>("None");
  const [addRegisters,   setAddRegisters]   = useState<MeterRegister[]>([BLANK_REGISTER()]);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  // edit
  const [editId,          setEditId]          = useState<string | null>(null);
  const [editModel,       setEditModel]       = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEndianness,  setEditEndianness]  = useState<MeterProfile["endianness"]>("ABCD");
  const [editBaudRate,    setEditBaudRate]    = useState(9600);
  const [editParity,      setEditParity]      = useState<MeterProfile["parity"]>("None");
  const [editRegisters,   setEditRegisters]   = useState<MeterRegister[]>([]);
  const [editSaving,      setEditSaving]      = useState(false);
  const [editError,       setEditError]       = useState<string | null>(null);

  // delete
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // publish
  const [publishing,     setPublishing]     = useState(false);
  const [publishResult,  setPublishResult]  = useState<string | null>(null);
  const [publishError,   setPublishError]   = useState<string | null>(null);

  // json import
  const [importMode,    setImportMode]    = useState<"none" | "paste" | "file">("none");
  const [importJson,    setImportJson]    = useState("");
  const [importParsed,  setImportParsed]  = useState<Omit<MeterProfile, "id" | "updated_at"> | null>(null);
  const [importError,   setImportError]   = useState<string | null>(null);
  const [importSaving,  setImportSaving]  = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/admin/meter-profiles`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (handleAuthError(r, navigate)) throw new Error("auth"); return r.json(); })
      .then((d) => setProfiles(Array.isArray(d) ? d : d.profiles ?? []))
      .catch((err) => { if (err?.message !== "auth") setFetchError("Could not load meter profiles."); })
      .finally(() => setLoading(false));
  }, [navigate]);

  function openEdit(p: MeterProfile) {
    setEditId(p.id);
    setEditModel(p.model);
    setEditDisplayName(p.display_name);
    setEditEndianness(p.endianness);
    setEditBaudRate(p.baud_rate);
    setEditParity(p.parity);
    setEditRegisters(p.registers.map((r) => ({ ...r })));
    setEditError(null);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/meter-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model: addModel, display_name: addDisplayName, endianness: addEndianness, baud_rate: addBaudRate, parity: addParity, registers: addRegisters }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Save failed");
      setProfiles((prev) => [...prev, data as unknown as MeterProfile]);
      setAddModel(""); setAddDisplayName(""); setAddEndianness("ABCD"); setAddBaudRate(9600); setAddParity("None"); setAddRegisters([BLANK_REGISTER()]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editId) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/meter-profiles/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model: editModel, display_name: editDisplayName, endianness: editEndianness, baud_rate: editBaudRate, parity: editParity, registers: editRegisters }),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Update failed");
      setProfiles((prev) => prev.map((p) => p.id === editId ? (data as unknown as MeterProfile) : p));
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteProfile() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/meter-profiles/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data.error as string) ?? "Delete failed");
      }
      setProfiles((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function publishAll() {
    setPublishing(true);
    setPublishResult(null);
    setPublishError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/meter-profiles/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Publish failed");
      setPublishResult(`Published to ${data.node_count ?? "?"} node${Number(data.node_count) !== 1 ? "s" : ""}`);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  function validateAndSetImport(text: string) {
    setImportJson(text);
    setImportSuccess(null);
    if (!text.trim()) { setImportParsed(null); setImportError(null); return; }
    try {
      const raw = JSON.parse(text) as Record<string, unknown>;
      if (typeof raw.model !== "string" || !raw.model.trim()) throw new Error("\"model\" must be a non-empty string");
      if (typeof raw.display_name !== "string" || !raw.display_name.trim()) throw new Error("\"display_name\" must be a non-empty string");
      if (!Array.isArray(raw.registers) || raw.registers.length === 0) throw new Error("\"registers\" must be a non-empty array");
      const validTypes = ["Float32", "UInt16", "UInt32", "INT16", "INT32"];
      (raw.registers as Record<string, unknown>[]).forEach((r, i) => {
        if (typeof r.name !== "string" || !r.name.trim()) throw new Error(`registers[${i}].name must be a non-empty string`);
        if (typeof r.address !== "number") throw new Error(`registers[${i}].address must be a number`);
        if (r.data_type && !validTypes.includes(r.data_type as string)) throw new Error(`registers[${i}].data_type must be one of: ${validTypes.join(", ")}`);
      });
      setImportParsed({
        model: (raw.model as string).trim(),
        display_name: (raw.display_name as string).trim(),
        endianness: (["ABCD","CDAB","BADC","DCBA"].includes(raw.endianness as string) ? raw.endianness : "ABCD") as MeterProfile["endianness"],
        baud_rate: typeof raw.baud_rate === "number" ? raw.baud_rate : 9600,
        parity: (["None","Even","Odd"].includes(raw.parity as string) ? raw.parity : "None") as MeterProfile["parity"],
        registers: (raw.registers as Record<string, unknown>[]).map((r) => ({
          name: (r.name as string).trim(),
          address: r.address as number,
          length: ([1,2].includes(r.length as number) ? r.length : 1) as 1 | 2,
          data_type: (validTypes.includes(r.data_type as string) ? r.data_type : "Float32") as MeterRegister["data_type"],
          multiplier: typeof r.multiplier === "number" ? r.multiplier : 1,
        })),
      });
      setImportError(null);
    } catch (err) {
      setImportParsed(null);
      setImportError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  async function saveImport() {
    if (!importParsed) return;
    setImportSaving(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/meter-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(importParsed),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (res.status === 409) throw new Error("A profile with this model ID already exists");
      if (!res.ok) throw new Error((data.error as string) ?? "Save failed");
      setProfiles((prev) => [...prev, data as unknown as MeterProfile]);
      setImportSuccess(`"${importParsed.display_name}" imported successfully`);
      setImportMode("none");
      setImportJson("");
      setImportParsed(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportSaving(false);
    }
  }

  function RegistersBuilder({ regs, onChange }: { regs: MeterRegister[]; onChange: (r: MeterRegister[]) => void }) {
    function updateReg(i: number, field: keyof MeterRegister, value: string | number) {
      const next = regs.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
      onChange(next);
    }
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Registers</div>
        {regs.map((reg, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 110px 70px auto", gap: 6, marginBottom: 8, alignItems: "end" }}>
            <div>
              {i === 0 && <div style={{ fontSize: 10, color: theme.muted, marginBottom: 3, fontWeight: 600 }}>Name</div>}
              <input value={reg.name} onChange={(e) => updateReg(i, "name", e.target.value)} placeholder="e.g. voltage_l1" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div>
              {i === 0 && <div style={{ fontSize: 10, color: theme.muted, marginBottom: 3, fontWeight: 600 }}>Address</div>}
              <input type="number" value={reg.address} onChange={(e) => updateReg(i, "address", Number(e.target.value))} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div>
              {i === 0 && <div style={{ fontSize: 10, color: theme.muted, marginBottom: 3, fontWeight: 600 }}>Len</div>}
              <select value={reg.length} onChange={(e) => updateReg(i, "length", Number(e.target.value) as 1 | 2)} style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none" }}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
            <div>
              {i === 0 && <div style={{ fontSize: 10, color: theme.muted, marginBottom: 3, fontWeight: 600 }}>Data Type</div>}
              <select value={reg.data_type} onChange={(e) => updateReg(i, "data_type", e.target.value as MeterRegister["data_type"])} style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none" }}>
                {(["Float32", "UInt16", "UInt32", "INT16", "INT32"] as const).map((dt) => <option key={dt} value={dt}>{dt}</option>)}
              </select>
            </div>
            <div>
              {i === 0 && <div style={{ fontSize: 10, color: theme.muted, marginBottom: 3, fontWeight: 600 }}>Mult</div>}
              <input type="number" step="any" value={reg.multiplier} onChange={(e) => updateReg(i, "multiplier", Number(e.target.value))} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ paddingTop: i === 0 ? 16 : 0 }}>
              <button type="button" onClick={() => onChange(regs.filter((_, idx) => idx !== i))} style={{ padding: "6px 8px", borderRadius: 6, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...regs, BLANK_REGISTER()])} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
          <PlusCircle size={13} /> Add Register
        </button>
      </div>
    );
  }

  const inputStyle: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Inter',sans-serif" };
  const selectStyle: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, outline: "none" };

  return (
    <div className="admin-fade">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 20, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>Meter Profiles</h2>
          <p style={{ fontSize: 13, color: theme.muted, marginTop: 4, marginBottom: 0 }}>Define Modbus meter register maps</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button onClick={publishAll} disabled={publishing} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, fontWeight: 600, fontSize: 13, cursor: publishing ? "not-allowed" : "pointer", opacity: publishing ? 0.65 : 1 }}>
            {publishing ? <Spinner color={theme.accent} /> : <><Send size={13} /> Publish All to Nodes</>}
          </button>
          {publishResult && <div style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>{publishResult}</div>}
          {publishError  && <div style={{ fontSize: 12, color: theme.danger }}>{publishError}</div>}
        </div>
      </div>

      {fetchError && <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 20 }}>{fetchError}</div>}

      {/* ── Profile List ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner color={theme.accent} /></div>
      ) : profiles.length === 0 ? (
        <div style={{ ...card(theme, { padding: 28, textAlign: "center", color: theme.muted, fontSize: 13, marginBottom: 32 }) }}>No meter profiles yet. Add one below.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {profiles.map((p) => (
            <div key={p.id} style={{ ...card(theme, { padding: 0, overflow: "hidden" }) }}>
              {/* Summary row */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", flexWrap: "wrap" as const }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{p.display_name}</div>
                  <div style={{ fontSize: 12, color: theme.muted, fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>{p.model}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center", flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted, background: theme.bg, border: `1px solid ${theme.border}`, padding: "2px 8px", borderRadius: 5 }}>{p.endianness}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted, background: theme.bg, border: `1px solid ${theme.border}`, padding: "2px 8px", borderRadius: 5 }}>{p.baud_rate} baud</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted, background: theme.bg, border: `1px solid ${theme.border}`, padding: "2px 8px", borderRadius: 5 }}>{p.parity}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.accent, background: theme.accentDim, border: `1px solid ${theme.accent}40`, padding: "2px 8px", borderRadius: 5 }}>{p.registers.length} reg{p.registers.length !== 1 ? "s" : ""}</span>
                  {p.updated_at && <span style={{ fontSize: 11, color: theme.muted2 }}>Updated {p.updated_at}</span>}
                  <button onClick={() => openEdit(p)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, cursor: "pointer" }}>Edit</button>
                  {deleteId === p.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: theme.danger }}>Confirm?</span>
                      {deleteError && <span style={{ fontSize: 11, color: theme.danger }}>{deleteError}</span>}
                      <button onClick={deleteProfile} disabled={deleteLoading} style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 5, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, cursor: deleteLoading ? "not-allowed" : "pointer" }}>
                        {deleteLoading ? <Spinner color={theme.danger} /> : "Delete"}
                      </button>
                      <button onClick={() => { setDeleteId(null); setDeleteError(null); }} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 5, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(p.id)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, color: theme.danger, cursor: "pointer" }}>Delete</button>
                  )}
                </div>
              </div>
              {/* Inline edit */}
              {editId === p.id && (
                <div style={{ borderTop: `1px solid ${theme.border}`, padding: "20px 18px", background: theme.bg }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 14 }}>Edit Profile</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Model</label>
                      <input value={editModel} onChange={(e) => setEditModel(e.target.value)} style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                        onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Display Name</label>
                      <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                        onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Endianness</label>
                      <select value={editEndianness} onChange={(e) => setEditEndianness(e.target.value as MeterProfile["endianness"])} style={selectStyle}>
                        {(["ABCD", "CDAB", "BADC", "DCBA"] as const).map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Baud Rate</label>
                      <input type="number" value={editBaudRate} onChange={(e) => setEditBaudRate(Number(e.target.value))} style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                        onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Parity</label>
                      <select value={editParity} onChange={(e) => setEditParity(e.target.value as MeterProfile["parity"])} style={selectStyle}>
                        {(["None", "Even", "Odd"] as const).map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <RegistersBuilder regs={editRegisters} onChange={setEditRegisters} />
                  </div>
                  {editError && <div style={{ padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 14 }}>{editError}</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={saveEdit} disabled={editSaving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, background: theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.65 : 1 }}>
                      {editSaving ? <Spinner color="#fff" /> : <><Check size={13} /> Save Changes</>}
                    </button>
                    <button onClick={() => setEditId(null)} style={{ padding: "9px 16px", borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Import from JSON ─────────────────────────────────────────────────── */}
      <div style={{ ...card(theme, { padding: 28 }), maxWidth: 700, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: importMode === "none" ? 0 : 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>Import from JSON</div>
          <div style={{ display: "flex", gap: 8 }}>
            {importMode !== "paste" && (
              <button type="button" onClick={() => { setImportMode("paste"); setImportJson(""); setImportParsed(null); setImportError(null); setImportSuccess(null); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Paste JSON
              </button>
            )}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, background: theme.accentDim, border: `1px solid ${theme.accent}40`, color: theme.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={12} /> Upload .json
              <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                setImportMode("file");
                setImportSuccess(null);
                const reader = new FileReader();
                reader.onload = (ev) => validateAndSetImport((ev.target?.result as string) ?? "");
                reader.readAsText(file);
              }} />
            </label>
            {importMode !== "none" && (
              <button type="button" onClick={() => { setImportMode("none"); setImportJson(""); setImportParsed(null); setImportError(null); setImportSuccess(null); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 10px", borderRadius: 7, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 12, cursor: "pointer" }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {importMode === "paste" && (
          <textarea
            value={importJson}
            onChange={(e) => validateAndSetImport(e.target.value)}
            placeholder={`{\n  "model": "schneider_pm2220",\n  "display_name": "Schneider PM2220",\n  "endianness": "ABCD",\n  "baud_rate": 9600,\n  "parity": "None",\n  "registers": [\n    { "name": "voltage_l1", "address": 3000, "length": 2, "data_type": "Float32", "multiplier": 1 }\n  ]\n}`}
            style={{ width: "100%", minHeight: 180, padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 12, fontFamily: "'Share Tech Mono',monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
            onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }}
          />
        )}

        {importParsed && (
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 8, background: theme.greenBg, border: `1px solid ${theme.greenBdr}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.green, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Preview</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
              <div><span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>Display Name </span><span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{importParsed.display_name}</span></div>
              <div><span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>Model </span><span style={{ fontSize: 12, color: theme.text, fontFamily: "'Share Tech Mono',monospace" }}>{importParsed.model}</span></div>
              <div><span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>Registers </span><span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{importParsed.registers.length}</span></div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {importParsed.registers.map((r, i) => (
                <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, color: theme.green, fontFamily: "'Share Tech Mono',monospace" }}>{r.name}</span>
              ))}
            </div>
          </div>
        )}

        {importError && (
          <div style={{ marginTop: 12, padding: "9px 12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{importError}</div>
        )}
        {importSuccess && (
          <div style={{ marginTop: 12, padding: "9px 12px", background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, borderRadius: 8, color: theme.green, fontSize: 13, fontWeight: 600 }}>{importSuccess}</div>
        )}

        {importParsed && !importSuccess && (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button type="button" onClick={saveImport} disabled={importSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: importSaving ? "rgba(26,95,255,0.55)" : theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: importSaving ? "not-allowed" : "pointer", boxShadow: `0 4px 16px ${theme.accent}20` }}>
              {importSaving ? <Spinner color="#fff" /> : <><Check size={13} /> Confirm &amp; Save</>}
            </button>
            <button type="button" onClick={() => { setImportParsed(null); setImportJson(""); setImportMode("none"); setImportError(null); }}
              style={{ padding: "10px 16px", borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Add Profile Form ─────────────────────────────────────────────────── */}
      <div style={{ ...card(theme, { padding: 28 }), maxWidth: 700 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 16, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>Add Profile</div>
        <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Model</label>
              <input value={addModel} onChange={(e) => setAddModel(e.target.value)} required placeholder="e.g. schneider_pm2220" style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Display Name</label>
              <input value={addDisplayName} onChange={(e) => setAddDisplayName(e.target.value)} required placeholder="e.g. Schneider PM2220" style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Endianness</label>
              <select value={addEndianness} onChange={(e) => setAddEndianness(e.target.value as MeterProfile["endianness"])} style={selectStyle}>
                {(["ABCD", "CDAB", "BADC", "DCBA"] as const).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Baud Rate</label>
              <input type="number" value={addBaudRate} onChange={(e) => setAddBaudRate(Number(e.target.value))} required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}18`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Parity</label>
              <select value={addParity} onChange={(e) => setAddParity(e.target.value as MeterProfile["parity"])} style={selectStyle}>
                {(["None", "Even", "Odd"] as const).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <RegistersBuilder regs={addRegisters} onChange={setAddRegisters} />
          {saveError && <div style={{ padding: "10px 14px", background: theme.dangerBg, border: `1px solid ${theme.dangerBdr}`, borderRadius: 8, color: theme.danger, fontSize: 13 }}>{saveError}</div>}
          <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: saving ? "rgba(26,95,255,0.55)" : theme.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: `0 4px 16px ${theme.accent}40` }}>
            {saving ? <Spinner color="#fff" /> : <><Check size={14} /> Save Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── DevOps Tab ───────────────────────────────────────────────────────────────

interface DevBranchInfo { sha: string; message: string; author: string; date: string; }
interface DevRepoStatus { name: string; label: string; url: string; main: DevBranchInfo; dev: DevBranchInfo; devAhead: number; devBehind: number; }
interface DevAppVersion { version: string; notes: string; url: string; }
interface DevOpsData    { repos: DevRepoStatus[]; appVersion: DevAppVersion; }

function DevOpsTab({ theme }: { theme: any }) {
  const navigate = useNavigate();
  const [data,          setData]          = useState<DevOpsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error503,      setError503]      = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState({ version: "", notes: "", url: "" });
  const [publishing,    setPublishing]    = useState(false);
  const [publishMsg,    setPublishMsg]    = useState<{ ok: boolean; text: string } | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  async function fetchData() {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/admin/devops/repo-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (handleAuthError(res, navigate)) return;
    if (res.status === 503) { setError503(true); setLoading(false); return; }
    if (!res.ok) throw new Error("Server error");
    const d: DevOpsData = await res.json();
    setData(d);
    setLastUpdated(new Date());
    setError503(false);
    setLoading(false);
  }

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
    const id = setInterval(() => { fetchData().catch(() => {}); }, 60_000);
    return () => clearInterval(id);
  }, []);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/devops/publish-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) throw new Error("Failed");
      setPublishMsg({ ok: true, text: "Published successfully" });
      setShowForm(false);
      setForm({ version: "", notes: "", url: "" });
      await fetchData();
    } catch {
      setPublishMsg({ ok: false, text: "Failed to publish update" });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(null), 4000);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner color={theme.accent} /></div>;

  if (error503) return (
    <div style={{ padding: "16px 20px", background: theme.amberBg, border: `1px solid ${theme.amberBdr}`, borderRadius: 12, color: theme.amber, fontSize: 14 }}>
      GitHub token not configured on server. Add GITHUB_TOKEN env var in Railway.
    </div>
  );

  const inputStyle: CSSProperties = { width: "100%", padding: "9px 12px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 14, fontFamily: "'Inter',sans-serif", boxSizing: "border-box" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 24, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>DevOps</h2>
          <p style={{ fontSize: 14, color: theme.muted, marginTop: 6, marginBottom: 0 }}>App version and repository status</p>
        </div>
        {lastUpdated && (
          <span style={{ fontSize: 12, color: theme.muted2, marginTop: 6 }}>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Published App Version */}
      {data && (
        <div style={{ ...card(theme), padding: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Published App Version</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: theme.accent, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1 }}>v{data.appVersion.version}</div>
              {data.appVersion.notes && (
                <div style={{ fontSize: 14, color: theme.muted, marginBottom: 12 }}>{data.appVersion.notes}</div>
              )}
              {data.appVersion.url && (
                <a href={data.appVersion.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: theme.accent, textDecoration: "none", fontWeight: 500 }}>
                  <ExternalLink size={13} /> {data.appVersion.url}
                </a>
              )}
            </div>
            <button onClick={() => setShowForm((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: theme.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
              <Upload size={15} /> Publish New Version
            </button>
          </div>

          {showForm && (
            <form onSubmit={handlePublish} style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 20, marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.muted, display: "block", marginBottom: 6 }}>Version</label>
                  <input value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="e.g. 1.2.3" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.muted, display: "block", marginBottom: 6 }}>Download URL</label>
                  <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.muted, display: "block", marginBottom: 6 }}>Release Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="What's new in this version…" rows={3} style={{ ...inputStyle, resize: "vertical" } as CSSProperties} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={publishing} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: publishing ? "rgba(26,95,255,0.55)" : theme.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: publishing ? "wait" : "pointer", fontFamily: "'Inter',sans-serif", opacity: publishing ? 0.7 : 1 }}>
                  {publishing ? <Spinner color="#fff" /> : <Send size={14} />} Publish
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {publishMsg && (
        <div style={{ padding: "12px 16px", background: publishMsg.ok ? theme.greenBg : theme.dangerBg, border: `1px solid ${publishMsg.ok ? theme.greenBdr : theme.dangerBdr}`, borderRadius: 8, color: publishMsg.ok ? theme.green : theme.danger, fontSize: 14, marginBottom: 24 }}>
          {publishMsg.text}
        </div>
      )}

      {/* Release Guide */}
      <div style={{ marginTop: 48 }}>
        {/* Section header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 20, color: theme.text, letterSpacing: "-0.02em", margin: 0 }}>OTA Release Checklist</h3>
          <p style={{ fontSize: 14, color: theme.muted, marginTop: 6, marginBottom: 0 }}>Follow these steps exactly every time you publish a new TechniDAQ version.</p>
        </div>

        {/* Step table */}
        <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: theme.surface, fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", width: 60 }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", width: 200 }}>Action</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {/* Step 1 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>1</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Bump version in 3 files</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Open these 3 files and change the version string to the new version (e.g. <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>0.2.0</code> → <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>0.3.0</code>). All 3 MUST match:
                  <br /><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>src-tauri/tauri.conf.json</code> → <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>"version": "X.Y.Z"</code>
                  <br /><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>src-tauri/Cargo.toml</code> → <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>version = "X.Y.Z"</code>
                  <br /><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>package.json</code> (repo root) → <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>"version": "X.Y.Z"</code>
                </td>
              </tr>
              {/* Step 2 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>2</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Commit your code changes</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>git add -A && git commit -m "release: vX.Y.Z — description"</code>
                  <br />Make sure all your feature/fix code is committed to <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>dev</code> before building.
                </td>
              </tr>
              {/* Step 3 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>3</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Set signing key in terminal</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Open PowerShell in the <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>powermeter-demo</code> repo root and run:
                  <br /><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME\.tauri\technidaq.key" -Raw</code>
                  <br />then <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""</code>
                  <br />These must be set in the <strong style={{ color: theme.text }}>SAME terminal session</strong> where you build.
                </td>
              </tr>
              {/* Step 4 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>4</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Build the signed release</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Run: <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>pnpm tauri build --features cloud_sync</code>
                  <br />Takes 5–10 minutes. Wait until you see: <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>Finished 2 updater signatures at: ...\nsis\TechniDAQ_X.Y.Z_x64-setup.exe.sig</code>
                  <br />If no <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>.sig</code> line appears, the signing failed. Check that the env vars from Step 3 are set.
                </td>
              </tr>
              {/* Step 5 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>5</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Verify build output</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Open <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>src-tauri\target\release\bundle\nsis\</code> in File Explorer. You MUST see 2 files:
                  <br /><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>TechniDAQ_X.Y.Z_x64-setup.exe</code> (~15–30 MB) and <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>TechniDAQ_X.Y.Z_x64-setup.exe.sig</code> (~1 KB).
                  <br />If the <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>.sig</code> is missing, do <strong style={{ color: theme.danger }}>NOT</strong> proceed — go back to Step 3.
                </td>
              </tr>
              {/* Step 6 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>6</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Run the publish script</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Double-click <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>publish-update.bat</code> in the repo root (or run <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>.\publish-update.ps1</code> in PowerShell).
                  <br />It will: confirm the version → find the .exe and .sig → ask for release notes → create GitHub Release → upload files → notify cloud API.
                  <br />Type <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>Y</code> to confirm, enter release notes, done.
                </td>
              </tr>
              {/* Step 7 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>7</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Verify on GitHub</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Open <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>https://github.com/Joe-Sfeir/TechniDAQ/releases/latest</code>
                  <br />Confirm tag is <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>vX.Y.Z</code>, assets include the <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>.exe</code> and <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>latest.json</code>.
                  <br />Click <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>latest.json</code> and check the <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>version</code> field matches.
                </td>
              </tr>
              {/* Step 8 */}
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>8</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Test on a live app</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  Open TechniDAQ on any machine with an older version. Within 5 seconds a blue "Update Available" banner should appear.
                  <br />Click "Install Now" — the app downloads, installs, and restarts automatically. Verify the new version is running.
                </td>
              </tr>
              {/* Step 9 */}
              <tr>
                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: theme.accent, color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>9</span>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", fontWeight: 600, color: theme.text, whiteSpace: "nowrap" }}>Push and merge</td>
                <td style={{ padding: "14px 16px", verticalAlign: "top", color: theme.muted, lineHeight: 1.7 }}>
                  <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>git push origin dev</code>
                  <br />If this is production-ready: <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>git checkout main && git merge dev && git push origin main && git checkout dev</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Troubleshooting collapsible */}
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
          <div
            onClick={() => setShowTroubleshooting((v) => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", cursor: "pointer", userSelect: "none", background: theme.surface }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>Troubleshooting</span>
            <ChevronDown size={16} color={theme.muted} style={{ transition: "transform 0.2s", transform: showTroubleshooting ? "rotate(180deg)" : "rotate(0deg)" }} />
          </div>
          {showTroubleshooting && (
            <div style={{ borderTop: `1px solid ${theme.border}`, padding: "20px 20px", background: theme.surface, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { problem: "No .sig file after build", solution: <><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>TAURI_SIGNING_PRIVATE_KEY</code> env var not set in the terminal, or <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>createUpdaterArtifacts</code> is missing from <code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>tauri.conf.json</code>. Re-run Step 3 then Step 4.</> },
                { problem: "publish-update.ps1 says \"Build artifacts not found\"", solution: "You haven't built yet or the build failed. Run Step 4 first." },
                { problem: "GitHub release fails: \"tag already exists\"", solution: "You already published this version. Delete the old release on GitHub (Releases → find it → Delete → also delete the tag), or bump to a newer version." },
                { problem: "No update banner on desktop app", solution: <><span>App must be an online </span><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>cloud_sync</code><span> build, connected to a project, actively ingesting. Check that the cloud API was notified (Step 6 should print success). The version check happens inside the ingest response.</span></> },
                { problem: "\"Install Now\" clicked but nothing happens", solution: <><span>Open DevTools (right-click → Inspect → Console). Look for signature mismatch or download errors. Verify </span><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>https://github.com/Joe-Sfeir/TechniDAQ/releases/latest/download/latest.json</code><span> returns valid JSON in browser.</span></> },
                { problem: "Signature verification failed", solution: "The .sig was generated with a different key than the pubkey baked into the installed app. If you regenerated your signing key, existing installs can't update via OTA — they need manual reinstall." },
                { problem: "GitHub token expired", solution: <><span>Delete </span><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>$HOME\.technidaq-github-token</code><span> and re-run the publish script. It will prompt for a new token. Generate one at GitHub → Settings → Developer settings → Personal access tokens (needs </span><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>repo</code><span> scope).</span></> },
                { problem: "Admin JWT expired", solution: <><span>Delete </span><code style={{ fontFamily: "'Share Tech Mono',monospace", background: theme.bg, padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: theme.text }}>$HOME\.technidaq-admin-token</code><span> and re-run. Or notify manually from this dashboard's DevOps tab.</span></> },
              ].map(({ problem, solution }, i) => (
                <div key={i} style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6 }}>
                  <strong style={{ color: theme.text }}>{problem}</strong> → {solution}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Files warning card */}
        <div style={{ border: `1px solid ${theme.dangerBdr}`, background: theme.dangerBg, borderRadius: 12, padding: "16px 20px", color: theme.danger, fontSize: 14, lineHeight: 1.6 }}>
          <strong>NEVER lose your private signing key</strong> at <code style={{ fontFamily: "'Share Tech Mono',monospace", background: "rgba(0,0,0,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem", color: "inherit" }}>$HOME\.tauri\technidaq.key</code>. If lost, you can never push OTA updates to existing users — they'd all need to manually reinstall. Back it up to a USB drive or password manager.
        </div>
      </div>

      {/* Repository Status */}
      {data && (
        <div style={{ marginTop: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Repository Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.repos.map((repo) => (
              <div key={repo.name} style={{ ...card(theme), padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>{repo.name}</span>
                    <span style={{ fontSize: 13, color: theme.muted, marginLeft: 8 }}>— {repo.label}</span>
                  </div>
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.accent, textDecoration: "none", fontWeight: 500 }}>
                    <ExternalLink size={12} /> GitHub
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  {/* main */}
                  <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>main</div>
                    <div style={{ fontSize: 13, color: theme.text, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
                      {repo.main.message.length > 60 ? repo.main.message.slice(0, 60) + "…" : repo.main.message}
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted2 }}>{repo.main.author} · {relativeTime(repo.main.date)}</div>
                  </div>
                  {/* badge */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {repo.devAhead === 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted2, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "5px 12px", whiteSpace: "nowrap" }}>
                        In sync
                      </span>
                    ) : repo.devBehind === 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: theme.green, background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, borderRadius: 20, padding: "5px 12px", whiteSpace: "nowrap" }}>
                        ✓ {repo.devAhead} commit{repo.devAhead !== 1 ? "s" : ""} ahead — ready to merge
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: theme.amber, background: theme.amberBg, border: `1px solid ${theme.amberBdr}`, borderRadius: 20, padding: "5px 12px", whiteSpace: "nowrap" }}>
                        ⚠ {repo.devAhead} ahead, {repo.devBehind} behind — needs rebase
                      </span>
                    )}
                  </div>
                  {/* dev */}
                  <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>dev</div>
                    <div style={{ fontSize: 13, color: theme.text, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
                      {repo.dev.message.length > 60 ? repo.dev.message.slice(0, 60) + "…" : repo.dev.message}
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted2 }}>{repo.dev.author} · {relativeTime(repo.dev.date)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
type Tab = "fleet" | "clients" | "create" | "online-projects" | "licenses" | "meter-profiles" | "devops";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "fleet",           label: "Global Fleet",      icon: <Globe size={18} />       },
  { id: "clients",         label: "Client Management", icon: <Users size={18} />       },
  { id: "create",          label: "Create User",       icon: <UserPlus size={18} />    },
  { id: "online-projects", label: "Online Projects",   icon: <Zap size={18} />         },
  { id: "licenses",        label: "Offline Licenses",  icon: <Key size={18} />         },
  { id: "meter-profiles",  label: "Meter Profiles",    icon: <Cpu size={18} />         },
  { id: "devops",          label: "DevOps",            icon: <GitBranch size={18} />   },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("fleet");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const role = getRole();
  const [allMeterProfiles, setAllMeterProfiles] = useState<MeterProfile[]>([]);

  const theme = dark ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/admin/meter-profiles`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (handleAuthError(r, navigate)) throw new Error("auth"); return r.json(); })
      .then((d) => setAllMeterProfiles(Array.isArray(d) ? d : d.profiles ?? []))
      .catch(() => { /* fall back to FALLBACK_METER_OPTIONS */ });
  }, [navigate]);

  const meterOptions = [
    ...allMeterProfiles.map((p) => ({ id: p.model, label: p.display_name })),
    ...FALLBACK_METER_OPTIONS,
  ];

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

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
              <div style={{ fontSize: 11, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>Admin Portal</div>
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
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted }}>{role ?? "ADMIN"}</span>
              <button onClick={toggle} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6 }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.text}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.muted}>
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
            <button onClick={logout} style={{
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", padding: 8, marginLeft: -8, borderRadius: 6 }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme.surface}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
            <Menu size={20} />
          </button>
        </div>

        <div style={{ padding: "16px 36px 48px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          {tab === "fleet"           && <FleetTab theme={theme} />}
          {tab === "clients"         && <ClientsTab theme={theme} />}
          {tab === "create"          && <CreateUserTab theme={theme} />}
          {tab === "online-projects" && <OnlineProjectsTab meterOptions={meterOptions} theme={theme} />}
          {tab === "licenses"        && <LicenseTab meterOptions={meterOptions} theme={theme} />}
          {tab === "meter-profiles"  && <MeterProfilesTab theme={theme} />}
          {tab === "devops"          && <DevOpsTab theme={theme} />}
        </div>
      </main>
    </div>
  );
}
