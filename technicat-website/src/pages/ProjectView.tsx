import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { ChevronLeft, Sun, Moon, LogOut, Download } from "lucide-react";
import { getToken, handleAuthError } from "../lib/auth";
import { API_URL } from "../config";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY   = 120;
const SPARK_HISTORY = 20;
const POLL_MS       = 3000;

// Keys in a telemetry row that are NOT variables
const NON_VAR = new Set(["timestamp", "device_name", "id", "project_id", "created_at", "updated_at"]);

// ─── Design tokens ────────────────────────────────────────────────────────────

const CLR = {
  bgPage:    (d: boolean) => d ? "#0f1117" : "#f1f5f9",
  bgHeader:  (d: boolean) => d ? "rgba(15,17,23,0.92)"    : "rgba(15,23,42,0.96)",
  bgTabBar:  (d: boolean) => d ? "rgba(15,17,23,0.85)"    : "rgba(255,255,255,0.75)",
  border:    (d: boolean) => d ? "rgba(255,255,255,0.08)"  : "rgba(15,23,42,0.10)",
  borderDim: (d: boolean) => d ? "rgba(255,255,255,0.04)"  : "rgba(15,23,42,0.06)",
  text1:     (d: boolean) => d ? "#f1f5f9"  : "#0f172a",
  text2:     (d: boolean) => d ? "#94a3b8"  : "#475569",
  text3:     (d: boolean) => d ? "#3d4a5e"  : "#94a3b8",
  blue:   "#3b82f6",
  green:  "#22c55e",
  amber:  "#f59e0b",
  red:    "#ef4444",
  purple: "#a855f7",
  teal:   "#14b8a6",
  orange: "#f97316",
  indigo: "#6366f1",
};

const glass = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.82)",
  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.09)"}`,
  borderRadius: "12px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: isDark
    ? "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 2px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
});

const SCADA_CSS = `
  .scada-page {
    background-color: var(--pg);
    background-image: radial-gradient(circle, var(--dot) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  [data-theme="dark"]  { --pg: #0f1117; --dot: rgba(255,255,255,0.055); }
  [data-theme="light"] { --pg: #f1f5f9; --dot: rgba(15,23,42,0.07); }
  @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
`;

const TAB_ACCENTS = [CLR.blue, CLR.green, CLR.amber, CLR.purple, CLR.red, CLR.teal, CLR.orange, CLR.indigo];
const LINE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6", "#f97316", "#6366f1"];

function regPalette(name: string, idx: number) {
  const n = name.toLowerCase();
  const P = [
    { border: CLR.blue,   value: CLR.blue   },
    { border: CLR.amber,  value: CLR.amber  },
    { border: CLR.purple, value: CLR.purple },
    { border: CLR.green,  value: CLR.green  },
    { border: CLR.red,    value: CLR.red    },
    { border: CLR.teal,   value: CLR.teal   },
    { border: CLR.orange, value: CLR.orange },
    { border: CLR.indigo, value: CLR.indigo },
  ];
  if (n.includes("voltage"))                                    return P[0];
  if (n.includes("current"))                                    return P[1];
  if (n.includes("apparent"))                                   return P[7];
  if (n.includes("reactive"))                                   return P[4];
  if (n.includes("active power") || n.includes("power total")) return P[2];
  if (n.includes("energy"))                                     return P[3];
  if (n.includes("frequen"))                                    return P[5];
  if (n.includes("factor"))                                     return P[6];
  return P[idx % P.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelemetryRow {
  timestamp: string;
  device_name: string;
  [key: string]: string | number;
}

type ChartPoint = Record<string, string | number>;
type Theme      = "dark" | "light";
type ViewMode   = "chart" | "grid";

// ─── Demo data (offline fallback) ─────────────────────────────────────────────

const DEMO_ROWS: TelemetryRow[] = Array.from({ length: 30 }, (_, i) => {
  const ts = new Date(Date.now() - (29 - i) * POLL_MS).toISOString();
  const s  = Math.sin(i * 0.35);
  const c  = Math.cos(i * 0.4);
  return [
    { timestamp: ts, device_name: "Main Incomer",
      "Voltage L1": +(230 + s * 1.8).toFixed(2),   "Current L1": +(12.4 + c * 0.6).toFixed(3),
      "Active Power Total": +(8200 + s * 180).toFixed(1), "Power Factor": +(0.92 + c * 0.005).toFixed(4),
      "Frequency": +(50.0 + s * 0.08).toFixed(3) },
    { timestamp: ts, device_name: "HVAC Panel",
      "Voltage L1": +(229 + s * 1.5).toFixed(2),   "Current L1": +(7.5 + c * 0.4).toFixed(3),
      "Active Power Total": +(3100 + s * 80).toFixed(1),  "Power Factor": +(0.88 + c * 0.004).toFixed(4),
      "Frequency": +(50.0 + s * 0.06).toFixed(3) },
  ];
}).flat();

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ name, value, idx, isDark, sparkData }: {
  name: string; value: number | undefined; idx: number; isDark: boolean; sparkData?: number[];
}) {
  const p      = regPalette(name, idx);
  const hasVal = value !== undefined && !isNaN(value);
  const abs    = hasVal ? Math.abs(value!) : 0;
  const display = hasVal
    ? (abs >= 10000 ? value!.toFixed(0) : abs >= 100 ? value!.toFixed(1) : abs >= 1 ? value!.toFixed(2) : value!.toFixed(4))
    : "——";

  return (
    <div style={{ ...glass(isDark), padding: 0, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ height: "2px", width: "100%", flexShrink: 0, background: `linear-gradient(90deg, ${p.border}, ${p.border}88, transparent)` }} />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Share Tech Mono',monospace", letterSpacing: "-0.03em", lineHeight: 1, color: hasVal ? CLR.text1(isDark) : CLR.text3(isDark) }}>{display}</div>
        <div style={{ height: "2px", borderRadius: "1px", background: CLR.borderDim(isDark), overflow: "hidden" }}>
          {hasVal && <div style={{ height: "100%", borderRadius: "1px", width: `${Math.min(100, (Math.abs(value!) / 500) * 100)}%`, background: `linear-gradient(90deg,${p.border},${p.border}99)`, transition: "width 0.5s ease" }} />}
        </div>
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ padding: "0 16px 10px", marginTop: "-4px" }}>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={sparkData.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line type="monotone" dataKey="v" stroke={p.border} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "60px", background: `radial-gradient(circle at 100% 100%, ${p.border}22, transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
}

// ─── DeviceTabBar ─────────────────────────────────────────────────────────────

function DeviceTabBar({ devices, activeTab, onSelect, isLive, isDark }: {
  devices: string[]; activeTab: string; onSelect: (n: string) => void;
  isLive: boolean; isDark: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 20px", height: "48px", background: CLR.bgTabBar(isDark), borderBottom: `1px solid ${CLR.border(isDark)}`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", overflowX: "auto", overflowY: "hidden", flexShrink: 0 }}>
      {devices.map((name, i) => {
        const isActive = activeTab === name;
        const accent   = TAB_ACCENTS[i % TAB_ACCENTS.length];
        return (
          <button key={name} onClick={() => onSelect(name)} style={{ padding: "0 16px", height: "32px", border: isActive ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}` : "1px solid transparent", borderRadius: "8px", background: isActive ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.95)") : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s ease", boxShadow: isActive ? (isDark ? "0 1px 6px rgba(0,0,0,0.4)" : "0 1px 4px rgba(15,23,42,0.12)") : "none" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: isActive ? (isLive ? accent : CLR.text3(isDark)) : CLR.text3(isDark), boxShadow: isActive && isLive ? `0 0 7px ${accent}` : "none", animation: isActive && isLive ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: isActive ? 700 : 500, fontSize: "0.83rem", letterSpacing: "0.04em", color: isActive ? CLR.text1(isDark) : CLR.text2(isDark) }}>{name}</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.54rem", letterSpacing: "0.08em", color: isActive ? accent : CLR.text3(isDark), padding: "1px 6px", borderRadius: "20px", border: `1px solid ${isActive ? accent + "40" : CLR.border(isDark)}`, background: isActive ? accent + "10" : "transparent" }}>S{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── WaveformChart ────────────────────────────────────────────────────────────

function WaveformChart({ history, chartKeys, isLive, tabAccent, isDark }: {
  history: ChartPoint[]; chartKeys: string[]; isLive: boolean; tabAccent: string; isDark: boolean;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [chartVisibleVars, setChartVisibleVars] = useState<Set<string>>(() => new Set(chartKeys));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setChartVisibleVars(new Set(chartKeys)); }, [chartKeys.join(",")]);

  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const axisTick  = CLR.text3(isDark);

  const gridKeys = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    history.forEach((pt) => Object.keys(pt).forEach((k) => { if (k !== "time" && !seen.has(k)) { seen.add(k); order.push(k); } }));
    return order;
  }, [history]);

  const emptyState = (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={CLR.text3(isDark)} strokeWidth={1.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: CLR.text3(isDark), textTransform: "uppercase" }}>Awaiting data…</span>
    </div>
  );

  return (
    <div style={{ ...glass(isDark), overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={tabAccent} strokeWidth={2.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: CLR.text1(isDark) }}>Waveform</span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", color: CLR.text3(isDark) }}>{history.length}/{MAX_HISTORY}pts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${CLR.border(isDark)}` }}>
            {(["chart", "grid"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              return (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "3px 10px", height: "26px", background: active ? (isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)") : "transparent", border: "none", borderRight: mode === "chart" ? `1px solid ${CLR.border(isDark)}` : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: active ? CLR.text1(isDark) : CLR.text3(isDark), transition: "background 0.15s" }}>
                  {mode === "chart"
                    ? <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    : <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>}
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: active ? 700 : 500, fontSize: "0.68rem", letterSpacing: "0.06em" }}>{mode === "chart" ? "Chart" : "Grid"}</span>
                </button>
              );
            })}
          </div>
          {/* Legend pills */}
          {viewMode === "chart" && chartKeys.map((k, i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "10px", height: "3px", borderRadius: "2px", background: LINE_COLORS[i % LINE_COLORS.length] }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", color: CLR.text2(isDark), maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            </div>
          ))}
          {/* Live badge */}
          <span style={{ padding: "2px 8px", borderRadius: "4px", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.12em", background: isLive ? tabAccent + "20" : CLR.borderDim(isDark), color: isLive ? tabAccent : CLR.text3(isDark), border: `1px solid ${isLive ? tabAccent + "44" : CLR.borderDim(isDark)}` }}>
            {isLive ? "LIVE" : "DEMO"}
          </span>
        </div>
      </div>

      {/* Chart var toggles */}
      {viewMode === "chart" && chartKeys.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", padding: "8px 16px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), marginRight: "2px" }}>LINES</span>
          {chartKeys.map((k, i) => {
            const on = chartVisibleVars.has(k);
            const c  = LINE_COLORS[i % LINE_COLORS.length];
            return (
              <button
                key={k}
                onClick={() => setChartVisibleVars((prev) => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; })}
                style={{ padding: "3px 12px", height: "24px", borderRadius: "20px", background: on ? c + "22" : "transparent", border: `1px solid ${on ? c + "88" : CLR.border(isDark)}`, color: on ? c : CLR.text3(isDark), fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.06em", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.12s" }}
              >
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: on ? c : CLR.borderDim(isDark), flexShrink: 0 }} />
                {k}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {viewMode === "chart" && (
        <div style={{ flex: "1 1 0", minHeight: "280px", padding: "8px 4px 8px 0", position: "relative" }}>
          {history.length === 0 ? emptyState : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: axisTick }} axisLine={{ stroke: CLR.border(isDark) }} tickLine={false} interval="preserveStartEnd" minTickGap={60} />
                {chartKeys.slice(0, 1).map(() => (
                  <YAxis key="l" yAxisId="l" orientation="left" tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: LINE_COLORS[0] }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => v.toFixed(1)} />
                ))}
                {chartKeys.slice(1, 2).map(() => (
                  <YAxis key="r" yAxisId="r" orientation="right" tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: LINE_COLORS[1] }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => v.toFixed(2)} />
                ))}
                <Tooltip contentStyle={{ background: isDark ? "#1c2128" : "#ffffff", border: `1px solid ${CLR.border(isDark)}`, borderRadius: "6px", padding: "8px 12px", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.66rem", color: CLR.text1(isDark), boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} cursor={{ stroke: CLR.borderDim(isDark), strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ display: "none" }} />
                {chartKeys.map((k, i) =>
                  chartVisibleVars.has(k) ? (
                    <Line key={k} yAxisId={i === 0 ? "l" : "r"} type="monotone" dataKey={k} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }} isAnimationActive={false} />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Grid */}
      {viewMode === "grid" && (
        <div style={{ flex: "1 1 0", minHeight: "280px", position: "relative", overflowX: "auto", overflowY: "auto" }}>
          {history.length === 0 ? emptyState : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.64rem", letterSpacing: "0.03em" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, zIndex: 2, background: isDark ? "#0f1117" : "#f1f5f9", borderBottom: `2px solid ${CLR.border(isDark)}` }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.54rem", color: CLR.text3(isDark), borderRight: `1px solid ${CLR.border(isDark)}`, minWidth: "92px" }}>Timestamp</th>
                  {gridKeys.map((k) => { const pal = regPalette(k, 0); return <th key={k} style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.52rem", color: pal.border, borderRight: `1px solid ${CLR.border(isDark)}`, minWidth: "110px" }}>{k}</th>; })}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((pt, i) => {
                  const alt   = i % 2 === 1;
                  const rowBg = alt ? (isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.03)") : "transparent";
                  return (
                    <tr key={i} style={{ background: rowBg }}>
                      <td style={{ padding: "5px 14px", whiteSpace: "nowrap", color: CLR.text2(isDark), borderRight: `1px solid ${CLR.borderDim(isDark)}`, borderBottom: `1px solid ${CLR.borderDim(isDark)}` }}>{String(pt.time)}</td>
                      {gridKeys.map((k) => { const raw = pt[k]; const num = typeof raw === "number" ? raw : NaN; const a = Math.abs(num); const disp = isNaN(num) ? "—" : a >= 10000 ? num.toFixed(0) : a >= 100 ? num.toFixed(1) : a >= 1 ? num.toFixed(3) : num.toFixed(5); const pal2 = regPalette(k, 0); return <td key={k} style={{ padding: "5px 10px", textAlign: "right", whiteSpace: "nowrap", color: isNaN(num) ? CLR.text3(isDark) : pal2.value, borderRight: `1px solid ${CLR.borderDim(isDark)}`, borderBottom: `1px solid ${CLR.borderDim(isDark)}`, fontVariantNumeric: "tabular-nums" }}>{disp}</td>; })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProjectView ──────────────────────────────────────────────────────────────

export default function ProjectView() {
  const navigate    = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const location    = useLocation();
  const backTo      = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [theme,       setTheme]       = useState<Theme>("dark");
  const [activeTab,   setActiveTab]   = useState("");
  const [devices,     setDevices]     = useState<string[]>([]);
  const [allVars,     setAllVars]     = useState<string[]>([]);
  const [hiddenVars,  setHiddenVars]  = useState<Set<string>>(new Set());
  const [latestData,  setLatestData]  = useState<Record<string, Record<string, number>>>({});
  const [history,     setHistory]     = useState<Record<string, ChartPoint[]>>({});
  const [sparkHistory,setSparkHistory]= useState<Record<string, Record<string, number[]>>>({});
  const [projectName, setProjectName] = useState(`Project #${projectId}`);
  const [lastPollMs,  setLastPollMs]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [demoMode,    setDemoMode]    = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const lastTimestampRef = useRef<string | null>(null);
  const isDark           = theme === "dark";

  // ── CSS injection ──
  useEffect(() => {
    if (document.getElementById("scada-css")) return;
    const el = document.createElement("style");
    el.id = "scada-css"; el.textContent = SCADA_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("scada-css")?.remove(); };
  }, []);

  // ── Process rows into state ──
  const processRows = useCallback((rows: TelemetryRow[], replace: boolean) => {
    if (rows.length === 0) return;

    const devSet  = new Set<string>();
    const varSet  = new Set<string>();

    rows.forEach((row) => {
      devSet.add(row.device_name);
      Object.keys(row).forEach((k) => { if (!NON_VAR.has(k)) varSet.add(k); });
    });

    const devList = [...devSet];
    const varList = [...varSet];

    // Group rows by device → ChartPoints
    const grouped: Record<string, ChartPoint[]> = {};
    const latest:  Record<string, Record<string, number>> = {};

    rows.forEach((row) => {
      const dev  = row.device_name;
      const time = new Date(row.timestamp).toLocaleTimeString("en-GB", { hour12: false });
      const pt: ChartPoint = { time };
      const vals: Record<string, number> = {};
      Object.keys(row).forEach((k) => {
        if (!NON_VAR.has(k)) { pt[k] = row[k] as number; vals[k] = row[k] as number; }
      });
      if (!grouped[dev]) grouped[dev] = [];
      grouped[dev].push(pt);
      latest[dev] = vals;
    });

    setDevices((prev) => {
      const next = replace ? devList : [...new Set([...prev, ...devList])];
      return next;
    });
    setAllVars((prev) => {
      const next = replace ? varList : [...new Set([...prev, ...varList])];
      return next;
    });
    setActiveTab((prev) => prev || devList[0] || "");
    setLatestData((prev) => replace ? latest : { ...prev, ...latest });

    setHistory((prev) => {
      const next = replace ? {} : { ...prev };
      Object.entries(grouped).forEach(([dev, pts]) => {
        const existing = replace ? [] : (next[dev] ?? []);
        next[dev] = [...existing, ...pts].slice(-MAX_HISTORY);
      });
      return next;
    });

    setSparkHistory((prev) => {
      const next = replace ? {} : { ...prev };
      Object.entries(grouped).forEach(([dev, pts]) => {
        const devSpark: Record<string, number[]> = replace ? {} : { ...(prev[dev] ?? {}) };
        pts.forEach((pt) => {
          Object.keys(pt).forEach((k) => {
            if (k === "time") return;
            devSpark[k] = [...(devSpark[k] ?? []), pt[k] as number].slice(-SPARK_HISTORY);
          });
        });
        next[dev] = devSpark;
      });
      return next;
    });

    // Track latest timestamp for incremental polling
    const newest = rows.reduce((best, r) => r.timestamp > best ? r.timestamp : best, rows[0].timestamp);
    lastTimestampRef.current = newest;
    setLastPollMs(Date.now());
  }, []);

  // ── Initial fetch ──
  useEffect(() => {
    if (!projectId) return;
    const token = getToken();
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/telemetry/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (handleAuthError(r, navigate)) return;
        if (r.status === 403) { navigate(backTo); return; }
        if (!r.ok) { setFetchError(`Server error (${r.status}) — contact support.`); return; }
        const data = await r.json() as { project_name?: string; rows: TelemetryRow[] } | TelemetryRow[];
        const rows = Array.isArray(data) ? data : (data.rows ?? []);
        if (!Array.isArray(data) && data.project_name) setProjectName(data.project_name);
        processRows(rows, true);
      } catch {
        processRows(DEMO_ROWS, true);
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, processRows, navigate, backTo]);

  // ── Polling ──
  useEffect(() => {
    if (loading || demoMode || !projectId) return;
    const token = getToken();
    const id = setInterval(async () => {
      const since = lastTimestampRef.current;
      const url   = `${API_URL}/api/telemetry/${projectId}${since ? `?since=${encodeURIComponent(since)}` : ""}`;
      try {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (handleAuthError(r, navigate)) return;
        if (!r.ok) return;
        const data = await r.json() as { rows?: TelemetryRow[] } | TelemetryRow[];
        const rows = Array.isArray(data) ? data : (data.rows ?? []);
        if (rows.length > 0) processRows(rows, false);
        else setLastPollMs(Date.now());
      } catch { /* silent for transient network failures */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loading, demoMode, projectId, processRows, navigate]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!projectId) return;
    setExporting(true);
    setExportError(null);
    try {
      const token = getToken();
      const res   = await fetch(`${API_URL}/api/export/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (handleAuthError(res, navigate)) return;
      if (!res.ok) throw new Error("Export failed. Please try again.");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `project_${projectId}_export.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally { setExporting(false); }
  }, [projectId, navigate]);

  // ── Derived ──
  const activeDevVars  = useMemo(() => {
    const pts = history[activeTab] ?? [];
    if (pts.length === 0) return allVars;
    const seen = new Set<string>();
    pts.forEach((pt) => Object.keys(pt).forEach((k) => { if (k !== "time") seen.add(k); }));
    return allVars.filter((v) => seen.has(v));
  }, [history, activeTab, allVars]);

  const visibleVars    = useMemo(() => activeDevVars.filter((v) => !hiddenVars.has(v)), [activeDevVars, hiddenVars]);
  const activeLatest   = latestData[activeTab]   ?? {};
  const activeHistory  = history[activeTab]      ?? [];
  const activeSpark    = sparkHistory[activeTab] ?? {};
  const tabAccent      = TAB_ACCENTS[devices.indexOf(activeTab) % TAB_ACCENTS.length] ?? CLR.blue;
  const timeStr        = lastPollMs > 0 ? new Date(lastPollMs).toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--";
  const isLive         = !demoMode;

  const ctrlBtn = (accent?: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "0 12px", height: "34px", borderRadius: "6px", cursor: "pointer",
    background: accent ? `${accent}18` : (isDark ? "rgba(255,255,255,0.05)" : "#f6f8fa"),
    border: `1px solid ${accent ? accent + "44" : CLR.border(isDark)}`,
    color: accent ?? CLR.text2(isDark),
    fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
    fontSize: "0.75rem", letterSpacing: "0.06em",
  });

  if (loading) {
    return (
      <div data-theme={theme} className="scada-page" style={{ height: "100svh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CLR.blue} strokeWidth={2.5} style={{ animation: "spin-login 1s linear infinite" }}>
          <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="scada-page" style={{ height: "100svh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ══ Header ══ */}
      <header style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 20px", height: "58px", flexShrink: 0, background: CLR.bgHeader(isDark), borderBottom: `1px solid ${CLR.border(isDark)}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "relative", zIndex: 10 }}>
        {/* Back */}
        <button onClick={() => navigate(backTo)} style={ctrlBtn()}>
          <ChevronLeft size={14} /> {backTo === "/admin" ? "Fleet" : "Dashboard"}
        </button>

        <div style={{ width: "1px", height: "24px", background: CLR.border(isDark) }} />

        {/* Brand + project */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", color: isDark ? "#e6edf3" : "#0f172a", lineHeight: 1 }}>TechniDAQ</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.14em", color: CLR.text3(isDark), lineHeight: 1.5 }}>{projectName}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Last poll */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.48rem", letterSpacing: "0.14em", color: CLR.text3(isDark), textTransform: "uppercase" }}>Last Poll</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.7rem", color: CLR.text1(isDark) }}>{timeStr}</div>
          </div>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Live / Demo status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isLive ? CLR.green : CLR.amber, boxShadow: isLive ? `0 0 8px ${CLR.green}` : "none", animation: isLive ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.12em", fontWeight: 600, color: isLive ? CLR.green : CLR.amber }}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </div>

          {demoMode && (
            <>
              <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 10px", height: "28px", background: `${CLR.amber}15`, border: `1px solid ${CLR.amber}44`, borderRadius: "5px" }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.14em", color: CLR.amber }}>DEMO MODE</span>
              </div>
            </>
          )}

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Export */}
          <button onClick={handleExport} disabled={exporting} style={{ ...ctrlBtn(CLR.green), opacity: exporting ? 0.6 : 1 }}>
            <Download size={13} /> {exporting ? "Exporting…" : "Export Excel"}
          </button>

          {/* Theme */}
          <button onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")} style={{ ...ctrlBtn(), padding: "0 10px" }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Logout */}
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("role"); navigate("/login"); }} style={{ ...ctrlBtn(CLR.red), padding: "0 10px", fontWeight: 600 }}>
            <LogOut size={13} /> Log Out
          </button>
        </div>
      </header>

      {/* ══ Device Tab Bar ══ */}
      {devices.length > 0 && (
        <DeviceTabBar devices={devices} activeTab={activeTab} onSelect={setActiveTab} isLive={isLive} isDark={isDark} />
      )}

      {/* ══ Content ══ */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Fetch / export errors */}
        {fetchError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: `${CLR.red}15`, border: `1px solid ${CLR.red}40`, color: CLR.red, fontSize: "0.75rem", fontFamily: "'Inter',sans-serif" }}>
            {fetchError}
          </div>
        )}
        {exportError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: `${CLR.red}15`, border: `1px solid ${CLR.red}40`, color: CLR.red, fontSize: "0.75rem", fontFamily: "'Inter',sans-serif" }}>
            {exportError}
          </div>
        )}

        {/* Variable pills */}
        {activeDevVars.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), marginRight: "2px" }}>SHOW</span>
            {activeDevVars.map((v, i) => {
              const on = !hiddenVars.has(v);
              const c  = LINE_COLORS[i % LINE_COLORS.length];
              return (
                <button
                  key={v}
                  onClick={() => setHiddenVars((prev) => { const s = new Set(prev); s.has(v) ? s.delete(v) : s.add(v); return s; })}
                  style={{ padding: "3px 12px", height: "24px", borderRadius: "20px", background: on ? c + "22" : "transparent", border: `1px solid ${on ? c + "88" : CLR.border(isDark)}`, color: on ? c : CLR.text3(isDark), fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.06em", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.12s" }}
                >
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: on ? c : CLR.borderDim(isDark), flexShrink: 0 }} />
                  {v}
                </button>
              );
            })}
          </div>
        )}

        {/* Last updated — visible near the data so users know polling is live */}
        {!demoMode && lastPollMs > 0 && (() => {
          const isStale = Date.now() - lastPollMs > 30_000;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isStale ? CLR.amber : CLR.green, boxShadow: isStale ? "none" : `0 0 6px ${CLR.green}`, animation: isStale ? "none" : "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.14em", color: isStale ? CLR.amber : CLR.text2(isDark), textTransform: "uppercase" }}>
                {isStale ? `Data may be stale — last updated: ${timeStr}` : `Last updated: ${timeStr}`}
              </span>
            </div>
          );
        })()}
        )}

        {/* Metric cards — only visible vars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 175px), 1fr))", gap: "12px" }}>
          {visibleVars.map((varName, idx) => (
            <MetricCard
              key={varName}
              name={varName}
              value={activeLatest[varName]}
              idx={idx}
              isDark={isDark}
              sparkData={activeSpark[varName]}
            />
          ))}
        </div>

        {/* Waveform chart — only visible vars */}
        <div style={{ minHeight: 380 }}>
          <WaveformChart
            history={activeHistory}
            chartKeys={visibleVars}
            isLive={isLive}
            tabAccent={tabAccent}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}
