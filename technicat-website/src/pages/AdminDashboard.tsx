import { useState, useEffect, Fragment } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Globe, Users, Key, LogOut, Copy, Check, X, RefreshCw, ExternalLink, UserPlus } from "lucide-react";
import { getToken, getRole, clearAuth, handleAuthError } from "../lib/auth";

import { API_URL } from "../config";
const API_BASE = API_URL;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const CLR = {
  bg:        "#f1f5f9",
  surface:   "#ffffff",
  border:    "#e2e8f0",
  accent:    "#2563eb",
  accentDim: "#eff6ff",
  text:      "#0f172a",
  muted:     "#64748b",
  muted2:    "#94a3b8",
  danger:    "#dc2626",
  dangerBg:  "#fef2f2",
  dangerBdr: "#fecaca",
  amber:     "#d97706",
  amberBg:   "#fffbeb",
  amberBdr:  "#fde68a",
  green:     "#16a34a",
  greenBg:   "#f0fdf4",
  greenBdr:  "#bbf7d0",
  sidebar:   "#ffffff",
};

const card = (extra?: CSSProperties): CSSProperties => ({
  background: "#ffffff",
  border: `1px solid ${CLR.border}`,
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  ...extra,
});

const DOT_GRID = `
  *,*::before,*::after { box-sizing: border-box; }
  body { margin: 0; }
  .admin-bg {
    background-color: ${CLR.bg};
    background-image: radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .admin-fade { animation: fadeIn 0.3s ease both; }
  @keyframes spin-admin { to { transform:rotate(360deg); } }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  clients: { id: number; email: string }[];
  tier: number;
  status: "online" | "offline" | "warning";
  device_count: number;
  last_seen: string;
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

const METER_OPTIONS = [
  { id: "schneider_pm2220", label: "Schneider PM2220" },
  { id: "socomec",          label: "Socomec"           },
  { id: "custom",           label: "Custom"            },
  { id: "simulation",       label: "Simulation"        },
  { id: "email_alerts",     label: "Email Alerts"      },
  { id: "diagnostics",      label: "Diagnostics"       },
];

const STATUS_DOT: Record<string, string> = {
  online:  CLR.green,
  offline: CLR.muted2,
  warning: CLR.amber,
};

const STATUS_BG: Record<string, string> = {
  online:  CLR.greenBg,
  offline: "#f8fafc",
  warning: CLR.amberBg,
};

const TIER_COLOR: Record<number, string> = {
  1: "#6366f1",
  2: "#2563eb",
  3: "#d97706",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CLR.accent} strokeWidth={2.5}
      style={{ animation: "spin-admin 1s linear infinite" }}>
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 20, color: CLR.text, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: CLR.muted, marginTop: 4, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

function DemoBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: CLR.amberBg, border: `1px solid ${CLR.amberBdr}`, borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
      <span style={{ fontWeight: 600, color: CLR.amber }}>Demo mode</span>
      <span style={{ color: CLR.muted }}>— backend offline, showing sample data</span>
    </div>
  );
}

// ─── Fleet Tab ────────────────────────────────────────────────────────────────
function FleetTab() {
  const navigate = useNavigate();
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [demo,      setDemo]      = useState(false);
  const [loading,   setLoading]   = useState(true);
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
      setAssignMsg((prev) => ({ ...prev, [projectId]: { ok: true, text: "Project assigned successfully" } }));
      setTimeout(() => setAssignMsg((prev) => { const n = { ...prev }; delete n[projectId]; return n; }), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Assignment failed";
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
      const msg = err instanceof Error ? err.message : "Unassign failed";
      setUnassignError((prev) => ({ ...prev, [key]: msg }));
      setTimeout(() => setUnassignError((prev) => { const n = { ...prev }; delete n[key]; return n; }), 4000);
    } finally {
      setUnassigning((prev) => ({ ...prev, [key]: false }));
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  const assigned   = projects.filter((p) => p.clients.length > 0);
  const unassigned = projects.filter((p) => p.clients.length === 0);

  const thStyle: CSSProperties = { textAlign: "left", padding: "10px 14px", color: CLR.muted, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${CLR.border}`, background: "#f8fafc" };
  const tdStyle: CSSProperties = { padding: "12px 14px", color: CLR.text, fontSize: 13, borderBottom: `1px solid #f1f5f9` };

  return (
    <div className="admin-fade">
      <SectionHeader title="Global Fleet" sub={`${projects.length} active projects across all clients`} />
      {demo && <DemoBanner />}

      {/* Assigned */}
      {assigned.length > 0 && (
        <div style={{ ...card(), overflow: "hidden", marginBottom: 28 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif" }}>
              <thead>
                <tr>
                  {["Project", "Clients", "Tier", "Status", "Devices", "Last Seen", "", "Add Client", ""].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((p) => (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{p.name}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
                        {p.clients.map((c) => {
                          const key = `${p.id}-${c.id}`;
                          return (
                            <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: CLR.accentDim, border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 7px", fontSize: 12, color: CLR.accent, fontWeight: 500 }}>
                                {c.email}
                                <button
                                  onClick={() => unassign(p.id, c.id)}
                                  disabled={unassigning[key]}
                                  title="Remove client"
                                  style={{ background: "none", border: "none", padding: 0, cursor: unassigning[key] ? "not-allowed" : "pointer", display: "flex", alignItems: "center", color: CLR.muted, lineHeight: 1 }}
                                >
                                  {unassigning[key] ? <Spinner /> : <X size={11} />}
                                </button>
                              </span>
                              {unassignError[key] && (
                                <span style={{ fontSize: 10, color: CLR.danger }}>{unassignError[key]}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[p.tier] ?? CLR.muted, background: `${TIER_COLOR[p.tier] ?? CLR.muted}14`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${TIER_COLOR[p.tier] ?? CLR.muted}28` }}>
                        TIER {p.tier}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: STATUS_DOT[p.status], background: STATUS_BG[p.status], padding: "3px 9px", borderRadius: 20, border: `1px solid ${STATUS_DOT[p.status]}30` }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT[p.status], flexShrink: 0 }} />
                        {p.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: CLR.muted }}>{p.device_count}</td>
                    <td style={{ ...tdStyle, color: CLR.muted }}>{p.last_seen}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/dashboard/${p.id}`, { state: { from: "/admin" } })}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: CLR.accentDim, border: `1px solid #bfdbfe`, borderRadius: 6, padding: "5px 10px", color: CLR.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                      >
                        <ExternalLink size={11} /> View
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={assignSel[p.id] ?? ""}
                        onChange={(e) => setAssignSel((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${CLR.border}`, background: "#f8fafc", color: assignSel[p.id] ? CLR.text : CLR.muted, fontSize: 13, outline: "none", cursor: "pointer", minWidth: 160 }}
                      >
                        <option value="" disabled>Add client…</option>
                        {users.filter((u) => !p.clients.some((c) => String(c.id) === String(u.id))).map((u) => (
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button
                          disabled={!assignSel[p.id] || assigning[p.id]}
                          onClick={() => assign(p.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, background: assignSel[p.id] ? CLR.accentDim : "#f8fafc", border: `1px solid ${assignSel[p.id] ? "#bfdbfe" : CLR.border}`, borderRadius: 6, padding: "5px 12px", color: assignSel[p.id] ? CLR.accent : CLR.muted, fontSize: 12, cursor: assignSel[p.id] ? "pointer" : "not-allowed", fontWeight: 700, whiteSpace: "nowrap" }}
                        >
                          {assigning[p.id] ? <Spinner /> : "Add"}
                        </button>
                        {assignMsg[p.id] && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: assignMsg[p.id].ok ? CLR.green : CLR.danger, background: assignMsg[p.id].ok ? CLR.greenBg : CLR.dangerBg, border: `1px solid ${assignMsg[p.id].ok ? CLR.greenBdr : CLR.dangerBdr}`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>
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

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: CLR.amber, letterSpacing: "0.04em" }}>Unassigned Projects</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: CLR.amber, background: CLR.amberBg, border: `1px solid ${CLR.amberBdr}`, padding: "1px 8px", borderRadius: 4 }}>{unassigned.length}</span>
          </div>
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif" }}>
                <thead>
                  <tr>
                    {["Project", "Tier", "Status", "Devices", "Last Seen", "", "Assign To", ""].map((h) => (
                      <th key={h} style={{ ...thStyle, background: "#fffbeb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((p) => (
                    <tr key={p.id} style={{ background: "#fffdf5" }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{p.name}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[p.tier] ?? CLR.muted, background: `${TIER_COLOR[p.tier] ?? CLR.muted}14`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${TIER_COLOR[p.tier] ?? CLR.muted}28` }}>
                          TIER {p.tier}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: STATUS_DOT[p.status], background: STATUS_BG[p.status], padding: "3px 9px", borderRadius: 20, border: `1px solid ${STATUS_DOT[p.status]}30` }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT[p.status], flexShrink: 0 }} />
                          {p.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: CLR.muted }}>{p.device_count}</td>
                      <td style={{ ...tdStyle, color: CLR.muted }}>{p.last_seen}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => navigate(`/dashboard/${p.id}`, { state: { from: "/admin" } })}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, background: CLR.accentDim, border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 10px", color: CLR.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                        >
                          <ExternalLink size={11} /> View
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={assignSel[p.id] ?? ""}
                          onChange={(e) => setAssignSel((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${CLR.border}`, background: "#f8fafc", color: assignSel[p.id] ? CLR.text : CLR.muted, fontSize: 13, outline: "none", cursor: "pointer", minWidth: 160 }}
                        >
                          <option value="" disabled>Select client…</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <button
                            disabled={!assignSel[p.id] || assigning[p.id]}
                            onClick={() => assign(p.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: assignSel[p.id] ? CLR.amberBg : "#f8fafc", border: `1px solid ${assignSel[p.id] ? CLR.amberBdr : CLR.border}`, borderRadius: 6, padding: "5px 12px", color: assignSel[p.id] ? CLR.amber : CLR.muted, fontSize: 12, cursor: assignSel[p.id] ? "pointer" : "not-allowed", fontWeight: 700, whiteSpace: "nowrap" }}
                          >
                            {assigning[p.id] ? <Spinner /> : "Assign"}
                          </button>
                          {assignMsg[p.id] && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: assignMsg[p.id].ok ? CLR.green : CLR.danger, background: assignMsg[p.id].ok ? CLR.greenBg : CLR.dangerBg, border: `1px solid ${assignMsg[p.id].ok ? CLR.greenBdr : CLR.dangerBdr}`, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>
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
        <div style={{ ...card(), padding: 32, textAlign: "center", color: CLR.muted, fontSize: 13 }}>
          No projects found.
        </div>
      )}
    </div>
  );
}

// ─── Set Password Modal ───────────────────────────────────────────────────────
function SetPasswordModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: (userId: string) => void }) {
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
    border: `1px solid ${CLR.border}`, background: "#f8fafc",
    color: CLR.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ ...card({ padding: 36, maxWidth: 440, width: "90%", position: "relative", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }) }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: CLR.muted, cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: CLR.text, marginBottom: 4 }}>Set Password</div>
        <div style={{ fontSize: 13, color: CLR.muted, marginBottom: 24 }}>{user.name} · {user.email}</div>

        {!done ? (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>New Password</label>
              <input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} required placeholder="Enter new password" style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Confirm Password</label>
              <input type="text" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required placeholder="Repeat password" style={inputStyle} />
            </div>
            {error && (
              <div style={{ padding: "9px 12px", background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`, borderRadius: 8, color: CLR.danger, fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={loading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 8, background: CLR.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, transition: "all 0.2s" }}>
                {loading ? <Spinner /> : <><Check size={14} /> Set Password</>}
              </button>
              <button type="button" onClick={onClose} style={{ padding: "11px 18px", borderRadius: 8, background: "#f8fafc", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: CLR.green, fontWeight: 700, fontSize: 15 }}>
              <Check size={16} /> Password updated successfully
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${CLR.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>New Password</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 18, color: CLR.accent, wordBreak: "break-all" }}>{newPass}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, background: copied ? CLR.greenBg : CLR.accentDim, border: `1px solid ${copied ? CLR.greenBdr : "#bfdbfe"}`, color: copied ? CLR.green : CLR.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Password</>}
              </button>
              <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, background: "#f8fafc", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 13, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab() {
  const navigate = useNavigate();
  const [users,         setUsers]         = useState<User[]>([]);
  const [demo,          setDemo]          = useState(false);
  const [loading,       setLoading]       = useState(true);
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

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

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
        />
      )}
      <SectionHeader title="Client Management" sub={`${users.length} registered users`} />
      {demo && <DemoBanner />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.length === 0 && (
          <div style={{ ...card(), padding: 32, textAlign: "center", color: CLR.muted, fontSize: 13 }}>
            No users registered yet.
          </div>
        )}
        {users.map((u) => (
          <Fragment key={u.id}>
          <div style={{
            ...card({ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }),
            background: u.reset_requested ? CLR.amberBg : "#ffffff",
            borderColor: u.reset_requested ? CLR.amberBdr : CLR.border,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: CLR.accentDim, border: `1px solid #bfdbfe`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, color: CLR.accent, fontSize: 16, flexShrink: 0 }}>
              {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: CLR.text, fontSize: 14 }}>{u.name ?? u.email}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: u.role === "CLIENT" ? CLR.muted : CLR.accent, background: u.role === "CLIENT" ? "#f1f5f9" : CLR.accentDim, padding: "1px 7px", borderRadius: 4, border: `1px solid ${u.role === "CLIENT" ? CLR.border : "#bfdbfe"}` }}>{u.role}</span>
                {u.reset_requested && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: CLR.amber, background: CLR.amberBg, padding: "1px 7px", borderRadius: 4, border: `1px solid ${CLR.amberBdr}`, letterSpacing: "0.04em" }}>Reset Requested</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: CLR.muted, marginTop: 3 }}>{u.email}{u.company ? ` · ${u.company}` : ""}</div>
              <div style={{ fontSize: 11, color: CLR.muted2, marginTop: 2 }}>{u.last_login ? `Last login: ${u.last_login} · ` : ""}{u.project_count ?? 0} project{(u.project_count ?? 0) !== 1 ? "s" : ""}</div>
            </div>

            <button
              onClick={() => toggleUserProjects(u.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: expandedUser === u.id ? CLR.accentDim : "#f8fafc", border: `1px solid ${expandedUser === u.id ? "#bfdbfe" : CLR.border}`, color: expandedUser === u.id ? CLR.accent : CLR.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (expandedUser !== u.id) { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = CLR.accent; e.currentTarget.style.background = CLR.accentDim; } }}
              onMouseLeave={(e) => { if (expandedUser !== u.id) { e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.muted; e.currentTarget.style.background = "#f8fafc"; } }}
            >
              <Globe size={12} /> Projects ({u.project_count ?? 0})
            </button>

            <button
              onClick={() => setSetPassUser(u)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: u.reset_requested ? CLR.amberBg : "#f8fafc", border: `1px solid ${u.reset_requested ? CLR.amberBdr : CLR.border}`, color: u.reset_requested ? CLR.amber : CLR.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = CLR.accent; e.currentTarget.style.background = CLR.accentDim; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = u.reset_requested ? CLR.amberBdr : CLR.border; e.currentTarget.style.color = u.reset_requested ? CLR.amber : CLR.muted; e.currentTarget.style.background = u.reset_requested ? CLR.amberBg : "#f8fafc"; }}
            >
              <RefreshCw size={12} /> Set Password
            </button>

            {u.role !== "MASTER" && (
              confirmDelete === u.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span style={{ fontSize: 12, color: CLR.danger, fontWeight: 600 }}>Are you sure?</span>
                  {deleteError && <span style={{ fontSize: 11, color: CLR.danger }}>{deleteError}</span>}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={deleteLoading}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`, color: CLR.danger, fontSize: 12, fontWeight: 700, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.65 : 1 }}
                    >
                      {deleteLoading ? <Spinner /> : "Delete"}
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                      style={{ padding: "6px 12px", borderRadius: 7, background: "#f8fafc", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 12, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmDelete(u.id); setDeleteError(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "#f8fafc", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = CLR.dangerBdr; e.currentTarget.style.color = CLR.danger; e.currentTarget.style.background = CLR.dangerBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.muted; e.currentTarget.style.background = "#f8fafc"; }}
                >
                  <X size={12} /> Delete
                </button>
              )
            )}
          </div>

          {expandedUser === u.id && (
            <div style={{ marginTop: -4, marginLeft: 8, borderLeft: `3px solid ${CLR.accent}`, paddingLeft: 16, paddingTop: 12, paddingBottom: 12 }}>
              {projectsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: CLR.muted, fontSize: 13 }}><Spinner /> Loading projects…</div>
              ) : (() => {
                const userProjects = allProjects.filter((p) => p.clients.some((c) => c.email === u.email));
                if (userProjects.length === 0) {
                  return <div style={{ fontSize: 13, color: CLR.muted2 }}>No projects assigned.</div>;
                }
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                    {userProjects.map((p) => (
                      <div key={p.id} style={{ background: "#ffffff", border: `1px solid ${CLR.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontWeight: 600, color: CLR.text, fontSize: 13 }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[p.tier] ?? CLR.muted, background: `${TIER_COLOR[p.tier] ?? CLR.muted}14`, padding: "2px 7px", borderRadius: 4, border: `1px solid ${TIER_COLOR[p.tier] ?? CLR.muted}28` }}>TIER {p.tier}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: STATUS_DOT[p.status], background: STATUS_BG[p.status], padding: "2px 8px", borderRadius: 20, border: `1px solid ${STATUS_DOT[p.status]}30` }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[p.status], flexShrink: 0 }} />{p.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: CLR.muted2 }}>Last seen: {p.last_seen}</div>
                        <button
                          onClick={() => navigate(`/dashboard/${p.id}`, { state: { from: "/admin" } })}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: CLR.accentDim, border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 10px", color: CLR.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
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
function CreateUserTab() {
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
    border: `1px solid ${CLR.border}`, background: "#f8fafc",
    color: CLR.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const toggleBtnStyle = (active: boolean): CSSProperties => ({
    padding: "7px 20px", borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
    background: active ? CLR.accentDim : "#f8fafc",
    border: `1px solid ${active ? "#bfdbfe" : CLR.border}`,
    color: active ? CLR.accent : CLR.muted,
  });

  return (
    <div className="admin-fade">
      <SectionHeader title="Create User" sub="Register a new client or sub-admin account" />

      <div style={{ maxWidth: 480 }}>
        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: CLR.greenBg, border: `1px solid ${CLR.greenBdr}`, borderRadius: 10, marginBottom: 20, color: CLR.green, fontSize: 13 }}>
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
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
              <input type={type} value={val} onChange={(e) => set(e.target.value)} required={label !== "Company"} placeholder={ph} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = CLR.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Role</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setRole("CLIENT")} style={toggleBtnStyle(role === "CLIENT")}>Client</button>
              {getRole() === "MASTER" && (
                <button type="button" onClick={() => setRole("SUB_MASTER")} style={toggleBtnStyle(role === "SUB_MASTER")}>Sub Master</button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`, borderRadius: 8, color: CLR.danger, fontSize: 13 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: loading ? "rgba(37,99,235,0.55)" : CLR.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4, boxShadow: "0 4px 16px rgba(37,99,235,0.25)", transition: "all 0.2s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = loading ? "rgba(37,99,235,0.55)" : CLR.accent; }}
          >
            {loading ? <Spinner /> : <><UserPlus size={15} /> Create User</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── License Tab ──────────────────────────────────────────────────────────────
type LicenseMode     = "Offline Air-Gapped" | "Online SaaS";
type LicenseProtocol = "RTU Only" | "TCP Only" | "All Protocols";

function LicenseTab() {
  const navigate = useNavigate();
  const [username,    setUsername]    = useState("");
  const [projectName, setProjectName] = useState("");
  const [tier,        setTier]        = useState(1);
  const [mode,        setMode]        = useState<LicenseMode>("Offline Air-Gapped");
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

  const isOffline = mode === "Offline Air-Gapped";

  function handleModeChange(m: LicenseMode) {
    setMode(m);
    if (m === "Offline Air-Gapped") setTier(1);
  }

  function toggleMeter(id: string) {
    setMeters((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const token = getToken();
      const backendMode      = isOffline ? "offline" : "online";
      const backendProtocols = protocols === "RTU Only" ? "RTU" : protocols === "TCP Only" ? "TCP" : "All";
      const body: Record<string, unknown> = {
        user_name:      username,
        project_name:   projectName,
        mode:           backendMode,
        protocols:      backendProtocols,
        ttl_hours:      ttl * 24,
        allowed_meters: meters,
      };
      if (!isOffline) body.tier = tier;
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
        tier:         isOffline ? undefined : tier,
        mode,
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
    border: `1px solid ${CLR.border}`, background: "#f8fafc",
    color: CLR.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const toggleBtn = (active: boolean, color?: string): CSSProperties => ({
    padding: "7px 18px", borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
    background: active ? (color ? `${color}14` : CLR.accentDim) : "#f8fafc",
    border: `1px solid ${active ? (color ? `${color}40` : "#bfdbfe") : CLR.border}`,
    color: active ? (color ?? CLR.accent) : CLR.muted,
  });

  return (
    <div className="admin-fade">
      <SectionHeader title="License Generator" sub="Generate TechniDAQ client licenses" />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, maxWidth: 820 }}>
        {/* Form */}
        <form onSubmit={generate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="client_username" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = CLR.border; e.target.style.boxShadow = "none"; }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Project Name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="HVAC Complex A" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = CLR.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Mode</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["Offline Air-Gapped", "Online SaaS"] as const).map((m) => (
                <button key={m} type="button" onClick={() => handleModeChange(m)} style={toggleBtn(mode === m)}>{m}</button>
              ))}
            </div>
          </div>

          {!isOffline && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Tier</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2].map((t) => (
                  <button key={t} type="button" onClick={() => setTier(t)} style={toggleBtn(tier === t, TIER_COLOR[t])}>Tier {t}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocols</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["RTU Only", "TCP Only", "All Protocols"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProtocols(p)} style={toggleBtn(protocols === p)}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Validity (days)</label>
            <input type="number" min={1} max={3650} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} style={{ ...inputStyle, width: 120 }}
              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = CLR.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Allowed Meters</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {METER_OPTIONS.map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div onClick={() => toggleMeter(opt.id)} style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${meters.includes(opt.id) ? CLR.accent : CLR.border}`, background: meters.includes(opt.id) ? CLR.accentDim : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                    {meters.includes(opt.id) && <Check size={10} color={CLR.accent} />}
                  </div>
                  <span style={{ fontSize: 13, color: meters.includes(opt.id) ? CLR.text : CLR.muted }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`, borderRadius: 8, color: CLR.danger, fontSize: 13 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: loading ? "rgba(37,99,235,0.55)" : CLR.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(37,99,235,0.25)", transition: "all 0.2s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = loading ? "rgba(37,99,235,0.55)" : CLR.accent; }}
          >
            {loading ? <Spinner /> : <><Key size={14} /> Generate License</>}
          </button>
        </form>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ ...card({ padding: 24, display: "flex", flexDirection: "column", gap: 16 }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: CLR.green, fontWeight: 700, fontSize: 15 }}>
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
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid #f1f5f9` }}>
                    <span style={{ color: CLR.muted }}>{k}</span>
                    <span style={{ color: CLR.text, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f8fafc", border: `1px solid ${CLR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>License Key</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: CLR.accent, wordBreak: "break-all", lineHeight: 1.6 }}>{result.license_key}</div>
              </div>
              <button onClick={copy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, background: copied ? CLR.greenBg : CLR.accentDim, border: `1px solid ${copied ? CLR.greenBdr : "#bfdbfe"}`, color: copied ? CLR.green : CLR.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Key</>}
              </button>
              <button onClick={() => setResult(null)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, background: "#f8fafc", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 13, cursor: "pointer" }}>
                Generate Another
              </button>
            </div>
          ) : (
            <div style={{ ...card({ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, textAlign: "center", gap: 10 }) }}>
              <Key size={28} color={CLR.muted2} />
              <div style={{ color: CLR.muted, fontSize: 13 }}>Fill in the form and generate a license key</div>
            </div>
          )}
        </div>
      </div>

      {/* License History */}
      <div style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: CLR.text, letterSpacing: "-0.02em", margin: 0 }}>License History</h3>
          <p style={{ fontSize: 13, color: CLR.muted, marginTop: 4, marginBottom: 0 }}>All previously generated licenses</p>
        </div>
        {historyLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner /></div>
        ) : historyError ? (
          <div style={{ padding: "10px 14px", background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`, borderRadius: 8, color: CLR.danger, fontSize: 13 }}>{historyError}</div>
        ) : licenseHistory.length === 0 ? (
          <div style={{ ...card({ padding: 24, textAlign: "center", color: CLR.muted, fontSize: 13 }) }}>No licenses generated yet.</div>
        ) : (
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif" }}>
                <thead>
                  <tr>
                    {["Username", "Project", "Mode", "Tier", "Protocols", "Expires", "Created"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: CLR.muted, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, borderBottom: `1px solid ${CLR.border}`, background: "#f8fafc" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {licenseHistory.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "11px 14px", color: CLR.text, fontSize: 13, borderBottom: `1px solid #f1f5f9`, fontWeight: 500 }}>{r.username}</td>
                      <td style={{ padding: "11px 14px", color: CLR.text, fontSize: 13, borderBottom: `1px solid #f1f5f9` }}>{r.project_name}</td>
                      <td style={{ padding: "11px 14px", color: CLR.muted, fontSize: 13, borderBottom: `1px solid #f1f5f9` }}>{r.mode}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, borderBottom: `1px solid #f1f5f9` }}>
                        {r.tier != null ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[r.tier] ?? CLR.muted, background: `${TIER_COLOR[r.tier] ?? CLR.muted}14`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${TIER_COLOR[r.tier] ?? CLR.muted}28` }}>TIER {r.tier}</span>
                        ) : <span style={{ color: CLR.muted2 }}>—</span>}
                      </td>
                      <td style={{ padding: "11px 14px", color: CLR.muted, fontSize: 13, borderBottom: `1px solid #f1f5f9` }}>{r.protocols}</td>
                      <td style={{ padding: "11px 14px", color: CLR.muted, fontSize: 13, borderBottom: `1px solid #f1f5f9`, whiteSpace: "nowrap" as const }}>{r.expires_at}</td>
                      <td style={{ padding: "11px 14px", color: CLR.muted2, fontSize: 12, borderBottom: `1px solid #f1f5f9`, whiteSpace: "nowrap" as const }}>{r.created_at}</td>
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

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
type Tab = "fleet" | "clients" | "create" | "licenses";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "fleet",    label: "Global Fleet",      icon: <Globe size={15} />    },
  { id: "clients",  label: "Client Management", icon: <Users size={15} />    },
  { id: "create",   label: "Create User",       icon: <UserPlus size={15} /> },
  { id: "licenses", label: "License Generator", icon: <Key size={15} />      },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("fleet");
  const role = getRole();

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <style>{DOT_GRID}</style>
      <div className="admin-bg" style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* Sidebar */}
        <aside style={{ width: 232, flexShrink: 0, background: CLR.sidebar, borderRight: `1px solid ${CLR.border}`, display: "flex", flexDirection: "column", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid #f1f5f9` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: CLR.text, lineHeight: 1 }}>TechniDAQ</div>
                <div style={{ fontSize: 10, color: CLR.muted2, letterSpacing: "0.06em", lineHeight: 1.5 }}>Admin Portal</div>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div style={{ padding: "10px 18px 12px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: CLR.amber, background: CLR.amberBg, border: `1px solid ${CLR.amberBdr}`, padding: "3px 10px", borderRadius: 5, letterSpacing: "0.06em" }}>
              {role ?? "ADMIN"}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
            {NAV_ITEMS.map((item) => {
              const active = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, border: active ? `1px solid #bfdbfe` : "1px solid transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: "'Inter',sans-serif",
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  background: active ? CLR.accentDim : "transparent",
                  color: active ? CLR.accent : CLR.muted,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = CLR.muted; } }}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom buttons */}
          <div style={{ padding: "12px 10px", borderTop: `1px solid #f1f5f9`, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Main Website */}
            <button onClick={() => navigate("/")} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: "#f8fafc", border: `1px solid ${CLR.border}`,
              color: CLR.muted, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.85rem",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CLR.accentDim; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = CLR.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.muted; }}
            >
              <Globe size={14} /> Main Website
            </button>
            {/* Sign out */}
            <button onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8,
              background: CLR.dangerBg, border: `1px solid ${CLR.dangerBdr}`,
              color: CLR.danger, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.85rem",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = CLR.dangerBg; e.currentTarget.style.borderColor = CLR.dangerBdr; }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
          {tab === "fleet"    && <FleetTab />}
          {tab === "clients"  && <ClientsTab />}
          {tab === "create"   && <CreateUserTab />}
          {tab === "licenses" && <LicenseTab />}
        </main>
      </div>
    </>
  );
}
