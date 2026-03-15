import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Key, LogOut, Copy, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import { getToken, getRole, clearAuth } from "../lib/auth";

const API_BASE = "http://localhost:8080";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const CLR = {
  bg: "#080c14",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  accent: "#00d4ff",
  accentDim: "rgba(0,212,255,0.12)",
  text: "#dde3ed",
  muted: "#5a6475",
  danger: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  sidebar: "rgba(255,255,255,0.025)",
};

const glass = (extra?: CSSProperties): CSSProperties => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${CLR.border}`,
  borderRadius: 12,
  ...extra,
});

const DOT_GRID = `
  .admin-bg {
    background-color: ${CLR.bg};
    background-image: radial-gradient(circle, rgba(0,212,255,0.07) 1px, transparent 1px);
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
  client: string;
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

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  { id: "p1", name: "HVAC Complex A", client: "Al Noor Contracting", tier: 2, status: "online",  device_count: 6,  last_seen: "just now" },
  { id: "p2", name: "Data Center UPS", client: "TechCo Systems",     tier: 3, status: "online",  device_count: 12, last_seen: "2 min ago" },
  { id: "p3", name: "Substation Grid", client: "Emirates Power",     tier: 1, status: "warning", device_count: 4,  last_seen: "8 min ago" },
  { id: "p4", name: "Mall Main Incomer",client:"ReedSpace Group",    tier: 2, status: "offline", device_count: 3,  last_seen: "1 hr ago" },
  { id: "p5", name: "Factory Line B",  client: "Gulf Mfg Ltd",       tier: 1, status: "online",  device_count: 8,  last_seen: "just now" },
];

const DEMO_USERS: User[] = [
  { id: "u1", email: "ali@alnoor.ae",    name: "Ali Hassan",    role: "CLIENT",     company: "Al Noor Contracting", reset_requested: false, last_login: "Today 09:14",  project_count: 2 },
  { id: "u2", email: "john@techco.com",  name: "John Smith",    role: "CLIENT",     company: "TechCo Systems",      reset_requested: true,  last_login: "Yesterday",     project_count: 1 },
  { id: "u3", email: "sara@ep.ae",       name: "Sara Ahmed",    role: "CLIENT",     company: "Emirates Power",      reset_requested: false, last_login: "3 days ago",    project_count: 3 },
  { id: "u4", email: "admin@technicat.com", name: "Admin User", role: "SUB_MASTER", company: "Technicat Group",     reset_requested: false, last_login: "Today 08:00",   project_count: 0 },
];

const METER_OPTIONS = [
  { id: "schneider_pm2220", label: "Schneider PM2220" },
  { id: "socomec",          label: "Socomec" },
  { id: "custom",           label: "Custom" },
  { id: "simulation",       label: "Simulation" },
  { id: "email_alerts",     label: "Email Alerts" },
  { id: "diagnostics",      label: "Diagnostics" },
];

const STATUS_DOT: Record<string, string> = {
  online:  CLR.green,
  offline: CLR.muted,
  warning: CLR.amber,
};

const TIER_COLOR: Record<number, string> = {
  1: "#6366f1",
  2: CLR.accent,
  3: CLR.amber,
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
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 20, color: CLR.text, letterSpacing: "0.05em" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: CLR.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function DemoBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, marginBottom: 20, fontSize: 12, color: CLR.amber }}>
      <span style={{ fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.08em" }}>DEMO MODE</span>
      <span style={{ color: CLR.muted }}>— backend offline, showing sample data</span>
    </div>
  );
}

// ─── Fleet Tab ────────────────────────────────────────────────────────────────
function FleetTab() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [demo,     setDemo]     = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/admin/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d : d.projects ?? []); })
      .catch(() => { setProjects(DEMO_PROJECTS); setDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  return (
    <div className="admin-fade">
      <SectionHeader title="GLOBAL FLEET" sub={`${projects.length} active projects across all clients`} />
      {demo && <DemoBanner />}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${CLR.border}` }}>
              {["Project", "Client", "Tier", "Status", "Devices", "Last Seen", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: CLR.muted, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${CLR.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "12px 12px", color: CLR.text, fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: "12px 12px", color: CLR.muted }}>{p.client}</td>
                <td style={{ padding: "12px 12px" }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: TIER_COLOR[p.tier] ?? CLR.muted, background: `${TIER_COLOR[p.tier] ?? CLR.muted}18`, padding: "2px 8px", borderRadius: 4 }}>
                    TIER {p.tier}
                  </span>
                </td>
                <td style={{ padding: "12px 12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: CLR.text }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[p.status] ?? CLR.muted, flexShrink: 0 }} />
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "12px 12px", color: CLR.muted, fontFamily: "'Share Tech Mono',monospace" }}>{p.device_count}</td>
                <td style={{ padding: "12px 12px", color: CLR.muted }}>{p.last_seen}</td>
                <td style={{ padding: "12px 12px" }}>
                  <button
                    onClick={() => navigate(`/dashboard/${p.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: CLR.accentDim, border: `1px solid rgba(0,212,255,0.2)`, borderRadius: 6, padding: "5px 10px", color: CLR.accent, fontSize: 12, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}
                  >
                    <ExternalLink size={11} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div style={{ ...glass(), padding: 36, maxWidth: 480, width: "90%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: CLR.muted, cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 18, color: CLR.text, letterSpacing: "0.06em", marginBottom: 6 }}>TEMP PASSWORD</div>
        <div style={{ fontSize: 12, color: CLR.muted, marginBottom: 24 }}>Share this with the user — it expires on first login</div>

        <div style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${CLR.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 22, color: CLR.accent, letterSpacing: "0.1em", wordBreak: "break-all", lineHeight: 1.5 }}>
            {password}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={copy}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.15)" : CLR.accentDim, border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(0,212,255,0.25)"}`, color: copied ? CLR.green : CLR.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.06em" }}
          >
            {copied ? <><Check size={14} /> COPIED</> : <><Copy size={14} /> COPY PASSWORD</>}
          </button>
          <button
            onClick={onClose}
            style={{ padding: "12px 18px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 13, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [demo,     setDemo]     = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [modal,    setModal]    = useState<string | null>(null); // holds temp password

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : d.users ?? []))
      .catch(() => { setUsers(DEMO_USERS); setDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  async function resetPassword(userId: string) {
    setResetting(userId);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json() as { temp_password?: string };
      if (data.temp_password) {
        setModal(data.temp_password);
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, reset_requested: false } : u));
      }
    } catch {
      // demo fallback — show a fake password
      setModal("TechniDAQ#" + Math.random().toString(36).slice(2, 10).toUpperCase());
    } finally {
      setResetting(null);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  const currentRole = getRole();

  return (
    <div className="admin-fade">
      {modal && <PasswordModal password={modal} onClose={() => setModal(null)} />}
      <SectionHeader title="CLIENT MANAGEMENT" sub={`${users.length} registered users`} />
      {demo && <DemoBanner />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              ...glass(),
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              background: u.reset_requested ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
              borderColor: u.reset_requested ? "rgba(245,158,11,0.2)" : CLR.border,
            }}
          >
            {/* Avatar */}
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid rgba(0,212,255,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: CLR.accent, fontSize: 15, flexShrink: 0 }}>
              {u.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: CLR.text, fontSize: 14 }}>{u.name}</span>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: u.role === "CLIENT" ? CLR.muted : CLR.accent, background: u.role === "CLIENT" ? "rgba(255,255,255,0.05)" : CLR.accentDim, padding: "1px 7px", borderRadius: 4 }}>{u.role}</span>
                {u.reset_requested && (
                  <span style={{ fontSize: 10, color: CLR.amber, background: "rgba(245,158,11,0.12)", padding: "1px 7px", borderRadius: 4, letterSpacing: "0.06em" }}>RESET REQUESTED</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: CLR.muted, marginTop: 2 }}>{u.email} · {u.company}</div>
              <div style={{ fontSize: 11, color: CLR.muted, marginTop: 2 }}>Last login: {u.last_login} · {u.project_count} project{u.project_count !== 1 ? "s" : ""}</div>
            </div>

            {/* Action */}
            {currentRole === "MASTER" && (
              <button
                onClick={() => resetPassword(u.id)}
                disabled={resetting === u.id}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: u.reset_requested ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${u.reset_requested ? "rgba(245,158,11,0.3)" : CLR.border}`, color: u.reset_requested ? CLR.amber : CLR.muted, fontSize: 12, cursor: resetting === u.id ? "not-allowed" : "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: "0.05em", opacity: resetting === u.id ? 0.6 : 1 }}
              >
                {resetting === u.id ? <Spinner /> : <RefreshCw size={12} />}
                Reset Password
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── License Tab ──────────────────────────────────────────────────────────────
type LicenseMode     = "Offline Air-Gapped" | "Online SaaS";
type LicenseProtocol = "RTU Only" | "TCP Only" | "All Protocols";

function LicenseTab() {
  const [username,    setUsername]    = useState("");
  const [projectName, setProjectName] = useState("");
  const [tier,        setTier]        = useState(1);
  const [mode,        setMode]        = useState<LicenseMode>("Offline Air-Gapped");
  const [protocols,   setProtocols]   = useState<LicenseProtocol>("All Protocols");
  const [ttl,         setTtl]         = useState(365);
  const [meters,      setMeters]      = useState<string[]>(["schneider_pm2220"]);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<LicenseResult | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

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
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const token = getToken();
      const body: Record<string, unknown> = { username, project_name: projectName, mode, protocols, ttl_days: ttl, allowed_meters: meters };
      if (!isOffline) body.tier = tier;
      const res = await fetch(`${API_BASE}/api/admin/generate-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json() as LicenseResult & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to generate license");
      setResult(data);
    } catch {
      // demo fallback
      const exp = new Date();
      exp.setDate(exp.getDate() + ttl);
      const modeTag = isOffline ? "AIR" : "SAS";
      const protoTag = protocols === "RTU Only" ? "RTU" : protocols === "TCP Only" ? "TCP" : "ALL";
      setResult({
        license_key: `TDQ-${modeTag}-${protoTag}-${Math.random().toString(36).slice(2,8).toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        username, project_name: projectName, tier: isOffline ? undefined : tier, mode, protocols,
        expires_at: exp.toISOString().split("T")[0],
      });
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.license_key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${CLR.border}`, background: "rgba(255,255,255,0.05)",
    color: CLR.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter',sans-serif",
  };

  const toggleBtnStyle = (active: boolean, color?: string): CSSProperties => ({
    padding: "7px 18px", borderRadius: 7, fontSize: 13, fontFamily: "'Rajdhani',sans-serif",
    fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s",
    background: active ? (color ?? CLR.accentDim) : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? (color ? color + "55" : "rgba(0,212,255,0.3)") : CLR.border}`,
    color: active ? (color ? "#fff" : CLR.accent) : CLR.muted,
  });

  return (
    <div className="admin-fade">
      <SectionHeader title="LICENSE GENERATOR" sub="Generate TechniDAQ client licenses" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 820 }}>
        {/* Form */}
        <form onSubmit={generate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="client_username" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Project Name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="HVAC Complex A" style={inputStyle} />
          </div>

          {/* Mode */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Mode</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["Offline Air-Gapped", "Online SaaS"] as const).map((m) => (
                <button key={m} type="button" onClick={() => handleModeChange(m)} style={toggleBtnStyle(mode === m)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Tier — only shown for Online SaaS */}
          {!isOffline && (
            <div>
              <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Tier</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2].map((t) => (
                  <button key={t} type="button" onClick={() => setTier(t)}
                    style={toggleBtnStyle(tier === t, TIER_COLOR[t])}>
                    TIER {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protocols */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocols</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["RTU Only", "TCP Only", "All Protocols"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProtocols(p)} style={toggleBtnStyle(protocols === p)}>{p}</button>
              ))}
            </div>
          </div>

          {/* TTL */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Validity (days)</label>
            <input type="number" min={1} max={3650} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} style={{ ...inputStyle, width: 120 }} />
          </div>

          {/* Meters */}
          <div>
            <label style={{ display: "block", fontSize: 11, color: CLR.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Allowed Meters</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {METER_OPTIONS.map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div
                    onClick={() => toggleMeter(opt.id)}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${meters.includes(opt.id) ? CLR.accent : CLR.border}`, background: meters.includes(opt.id) ? CLR.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    {meters.includes(opt.id) && <Check size={10} color={CLR.accent} />}
                  </div>
                  <span style={{ fontSize: 13, color: meters.includes(opt.id) ? CLR.text : CLR.muted }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: CLR.danger, fontSize: 13 }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: loading ? "rgba(0,212,255,0.2)" : "linear-gradient(135deg, #00d4ff, #0099bb)", border: "none", color: "#000", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner /> : <><Key size={14} /> GENERATE LICENSE</>}
          </button>
        </form>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ ...glass(), padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 15, color: CLR.green, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} /> LICENSE GENERATED
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
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: CLR.muted }}>{k}</span>
                    <span style={{ color: CLR.text, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${CLR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, color: CLR.muted, letterSpacing: "0.1em", marginBottom: 8 }}>LICENSE KEY</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 14, color: CLR.accent, wordBreak: "break-all", lineHeight: 1.6 }}>{result.license_key}</div>
              </div>

              <button
                onClick={copy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, background: copied ? "rgba(34,197,94,0.12)" : CLR.accentDim, border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(0,212,255,0.25)"}`, color: copied ? CLR.green : CLR.accent, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer" }}
              >
                {copied ? <><Check size={14} /> COPIED!</> : <><Copy size={14} /> COPY KEY</>}
              </button>

              <button
                onClick={() => setResult(null)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, background: "transparent", border: `1px solid ${CLR.border}`, color: CLR.muted, fontSize: 12, cursor: "pointer" }}
              >
                Generate Another
              </button>
            </div>
          ) : (
            <div style={{ ...glass(), padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, textAlign: "center", gap: 10 }}>
              <Key size={28} color={CLR.muted} />
              <div style={{ color: CLR.muted, fontSize: 13 }}>Fill in the form and generate a license key</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
type Tab = "fleet" | "clients" | "licenses";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "fleet",    label: "Global Fleet",       icon: <Globe size={16} /> },
  { id: "clients",  label: "Client Management",  icon: <Users size={16} /> },
  { id: "licenses", label: "License Generator",  icon: <Key size={16} /> },
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
      <div className="admin-bg" style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter',sans-serif" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, background: CLR.sidebar, borderRight: `1px solid ${CLR.border}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>
          {/* Logo */}
          <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${CLR.border}`, marginBottom: 8 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 18, color: CLR.accent, letterSpacing: "0.1em" }}>TECHNICAT</div>
            <div style={{ fontSize: 10, color: CLR.muted, letterSpacing: "0.15em", marginTop: 2 }}>GOD MODE</div>
          </div>

          {/* Role badge */}
          <div style={{ padding: "8px 20px 16px", marginBottom: 4 }}>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: CLR.amber, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 10px", borderRadius: 4 }}>
              {role ?? "ADMIN"}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
            {NAV_ITEMS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, background: active ? CLR.accentDim : "transparent", color: active ? CLR.accent : CLR.muted, transition: "all 0.15s" }}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: "12px 10px 0", borderTop: `1px solid ${CLR.border}`, marginTop: 8 }}>
            <button
              onClick={logout}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: CLR.muted, fontSize: 13, width: "100%", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = CLR.danger; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = CLR.muted; }}
            >
              <LogOut size={15} /> Log Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", padding: 32 }}>
          {tab === "fleet"    && <FleetTab />}
          {tab === "clients"  && <ClientsTab />}
          {tab === "licenses" && <LicenseTab />}
        </main>
      </div>
    </>
  );
}
