import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { ChevronLeft, Sun, Moon, LogOut, Download, Settings, X, Plus, Trash2, Check } from "lucide-react";
import { getToken, handleAuthError } from "../lib/auth";
import { API_URL } from "../config";
import { useTheme } from "../context/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY   = 120;
const SPARK_HISTORY = 20;
const POLL_MS       = 2000;

// Keys in a telemetry row that are NOT variables
const NON_VAR = new Set(["timestamp", "device_name", "id", "project_id", "created_at", "updated_at"]);

// ─── Design tokens (matched to Dashboard theme) ───────────────────────────────

const T = {
  light: {
    bg:        "#f8fafc",
    surface:   "#ffffff",
    surfaceAlt:"#f1f5f9",
    border:    "#e2e8f0",
    borderDim: "#f1f5f9",
    accent:    "#1a5fff",
    accentDim: "rgba(26,95,255,0.08)",
    text:      "#0f172a",
    muted:     "#64748b",
    muted2:    "#94a3b8",
    header:    "rgba(255,255,255,0.92)",
    tabBar:    "rgba(248,250,252,0.95)",
    cardShadow:"0 2px 8px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
    green:     "#10b981",
    greenBg:   "rgba(16,185,129,0.08)",
    greenBdr:  "rgba(16,185,129,0.2)",
    amber:     "#f59e0b",
    amberBg:   "rgba(245,158,11,0.08)",
    amberBdr:  "rgba(245,158,11,0.2)",
    red:       "#ef4444",
    redBg:     "rgba(239,68,68,0.08)",
    redBdr:    "rgba(239,68,68,0.2)",
    purple:    "#8b5cf6",
    teal:      "#14b8a6",
    orange:    "#f97316",
    indigo:    "#6366f1",
  },
  dark: {
    bg:        "#050505",
    surface:   "#111111",
    surfaceAlt:"#0a0a0a",
    border:    "#222222",
    borderDim: "rgba(255,255,255,0.04)",
    accent:    "#1a5fff",
    accentDim: "rgba(26,95,255,0.12)",
    text:      "#ffffff",
    muted:     "#a1a1aa",
    muted2:    "#52525b",
    header:    "rgba(5,5,5,0.92)",
    tabBar:    "rgba(10,10,10,0.95)",
    cardShadow:"0 4px 20px rgba(0,0,0,0.4)",
    green:     "#10b981",
    greenBg:   "rgba(16,185,129,0.1)",
    greenBdr:  "rgba(16,185,129,0.2)",
    amber:     "#f59e0b",
    amberBg:   "rgba(245,158,11,0.1)",
    amberBdr:  "rgba(245,158,11,0.2)",
    red:       "#ef4444",
    redBg:     "rgba(239,68,68,0.1)",
    redBdr:    "rgba(239,68,68,0.2)",
    purple:    "#8b5cf6",
    teal:      "#14b8a6",
    orange:    "#f97316",
    indigo:    "#6366f1",
  },
};

// Keep the old CLR for backward compat with palette helpers
const CLR = {
  bgPage:    (d: boolean) => d ? T.dark.bg : T.light.bg,
  bgHeader:  (d: boolean) => d ? T.dark.header : T.light.header,
  bgTabBar:  (d: boolean) => d ? T.dark.tabBar : T.light.tabBar,
  border:    (d: boolean) => d ? T.dark.border : T.light.border,
  borderDim: (d: boolean) => d ? T.dark.borderDim : T.light.borderDim,
  text1:     (d: boolean) => d ? T.dark.text : T.light.text,
  text2:     (d: boolean) => d ? T.dark.muted : T.light.muted,
  text3:     (d: boolean) => d ? T.dark.muted2 : T.light.muted2,
  blue:   "#1a5fff",
  green:  "#10b981",
  amber:  "#f59e0b",
  red:    "#ef4444",
  purple: "#8b5cf6",
  teal:   "#14b8a6",
  orange: "#f97316",
  indigo: "#6366f1",
};

const glass = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? T.dark.surface : T.light.surface,
  border: `1px solid ${isDark ? T.dark.border : T.light.border}`,
  borderRadius: "12px",
  boxShadow: isDark ? T.dark.cardShadow : T.light.cardShadow,
});

const SCADA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  .scada-page {
    background-color: var(--pg);
    min-height: 100svh;
    font-family: 'Inter','Plus Jakarta Sans',sans-serif;
  }
  [data-theme="dark"]  { --pg: #050505; }
  [data-theme="light"] { --pg: #f8fafc; }
  @keyframes spin-pv   { to { transform: rotate(360deg); } }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes pulse-alarm { 0%,100%{box-shadow:0 0 0 2px #ef444433,0 0 12px #ef444422} 50%{box-shadow:0 0 0 2px #ef444466,0 0 20px #ef444444} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .pv-fade { animation: fadeSlideIn 0.35s ease forwards; }
  .pv-card-hover { transition: box-shadow 0.2s, border-color 0.2s; }
  .pv-card-hover:hover { border-color: #1a5fff44 !important; box-shadow: 0 4px 24px rgba(26,95,255,0.08) !important; }
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

type ChartPoint    = Record<string, string | number>;
type ViewMode      = "chart" | "grid";
type ThresholdMap  = Record<string, Record<string, { min: number | null; max: number | null }>>;

interface MeterProfileLight {
  id: string;
  model: string;
  display_name: string;
  registers: { name: string; address?: number; length?: number; data_type?: string; multiplier?: number }[];
}

interface BusRegisterEntry {
  name: string;
  selected: boolean;
  alarm_min: string;
  alarm_max: string;
  address?: number;
  length?: number;
  data_type?: string;
  multiplier?: number;
}

interface BusDeviceConfig {
  device_name: string;
  meter_model: string;
  slave_id: number;
  poll_rate_ms: number;
  protocol: "rtu" | "tcp";
  com_port: string;
  baud_rate: number;
  ip_address: string;
  tcp_port: number;
  registers: BusRegisterEntry[];
}

interface NodeStatus {
  machine_id: string;
  node_name?: string;
  polling_state: "running" | "stopped" | "fault";
  last_seen?: string;
  is_active?: boolean;
  active_devices?: string[];
}

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

function MetricCard({ name, value, idx, isDark, sparkData, minThreshold, maxThreshold }: {
  key?: React.Key; name: string; value: number | undefined; idx: number; isDark: boolean; sparkData?: number[];
  minThreshold?: number | null; maxThreshold?: number | null;
}) {
  const p        = regPalette(name, idx);
  const tk       = isDark ? T.dark : T.light;
  const hasVal   = value !== undefined && !isNaN(value);
  const abs      = hasVal ? Math.abs(value!) : 0;
  const display  = hasVal
    ? (abs >= 10000 ? value!.toFixed(0) : abs >= 100 ? value!.toFixed(1) : abs >= 1 ? value!.toFixed(2) : value!.toFixed(4))
    : "—";
  const isAlarm  = hasVal && (
    (maxThreshold != null && value! > maxThreshold) ||
    (minThreshold != null && value! < minThreshold)
  );
  const accent = isAlarm ? tk.red : p.border;

  return (
    <div className="pv-card-hover" style={{
      background: tk.surface, border: `1px solid ${isAlarm ? tk.red + "66" : tk.border}`,
      borderRadius: 16, boxShadow: tk.cardShadow, overflow: "hidden", position: "relative",
      display: "flex", flexDirection: "column", minWidth: 0,
      animation: isAlarm ? "pulse-alarm 1.5s ease-in-out infinite" : "none",
    }}>
      <div style={{ padding: "20px 20px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: tk.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Inter',sans-serif" }}>
            {name}
          </div>
          {isAlarm && (
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: tk.red, background: tk.redBg, borderRadius: 6, padding: "2px 6px" }}>
              ALARM
            </div>
          )}
        </div>

        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Inter',sans-serif", color: isAlarm ? tk.red : (hasVal ? tk.text : tk.muted2) }}>
          {display}
        </div>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div style={{ padding: "0 20px 16px", height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" stroke={accent} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── DeviceTabBar ─────────────────────────────────────────────────────────────

function DeviceTabBar({ devices, activeTab, onSelect, isLive, isDark, inactiveDevices, showAll, onToggleShowAll }: {
  devices: string[]; activeTab: string; onSelect: (n: string) => void;
  isLive: boolean; isDark: boolean;
  inactiveDevices: Set<string>; showAll: boolean; onToggleShowAll: () => void;
}) {
  const tk = isDark ? T.dark : T.light;
  const inactiveCount = inactiveDevices.size;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px",
      background: tk.surface, borderBottom: `1px solid ${tk.border}`,
      overflowX: "auto", overflowY: "hidden", flexShrink: 0 }}>
      {devices.map((name, i) => {
        const isActive   = activeTab === name;
        const isInactive = inactiveDevices.has(name);
        const accent     = TAB_ACCENTS[i % TAB_ACCENTS.length];
        return (
          <button key={name} onClick={() => onSelect(name)} style={{
            padding: "8px 16px", border: `1px solid ${isActive ? accent + "44" : tk.border}`,
            borderRadius: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
            background: isActive ? (isDark ? accent + "18" : accent + "10") : "transparent",
            opacity: isInactive ? 0.5 : 1,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: isActive && isLive && !isInactive ? accent : tk.muted2,
              boxShadow: isActive && isLive && !isInactive ? `0 0 8px ${accent}` : "none" }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: isActive ? 600 : 500,
              fontSize: 14, color: isActive ? accent : tk.text }}>{name}</span>
          </button>
        );
      })}
      {inactiveCount > 0 && (
        <button onClick={onToggleShowAll} style={{ marginLeft: "auto", flexShrink: 0, padding: "6px 12px",
          borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
          fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
          border: `1px solid ${tk.border}`, background: "transparent", color: tk.muted }}>
          {showAll ? "Hide Inactive" : `+ ${inactiveCount} Inactive`}
        </button>
      )}
    </div>
  );
}

// ─── WaveformChart ────────────────────────────────────────────────────────────

function WaveformChart({ history, chartKeys, isDark }: {
  history: ChartPoint[]; chartKeys: string[]; isDark: boolean;
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
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke={CLR.text3(isDark)} strokeWidth={1.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: CLR.text3(isDark) }}>Waiting for data...</span>
    </div>
  );

  return (
    <div style={{ ...glass(isDark), overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 16, color: CLR.text1(isDark) }}>Waveform</span>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: CLR.text3(isDark) }}>{history.length} points</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${CLR.border(isDark)}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
            {(["chart", "grid"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              return (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "6px 16px", background: active ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: active ? CLR.text1(isDark) : CLR.text3(isDark), transition: "background 0.2s" }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: active ? 600 : 500, fontSize: 13 }}>{mode === "chart" ? "Chart" : "Data Grid"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart var toggles */}
      {viewMode === "chart" && chartKeys.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "12px 24px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
          {chartKeys.map((k, i) => {
            const on = chartVisibleVars.has(k);
            const c  = LINE_COLORS[i % LINE_COLORS.length];
            return (
              <button
                key={k}
                onClick={() => setChartVisibleVars((prev) => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; })}
                style={{ padding: "4px 12px", borderRadius: 20, background: on ? c + "15" : "transparent", border: `1px solid ${on ? c + "40" : CLR.border(isDark)}`, color: on ? c : CLR.text3(isDark), fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: on ? 500 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: on ? c : CLR.borderDim(isDark), flexShrink: 0 }} />
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

  const { dark: darkCtx, toggle: toggleTheme } = useTheme();
  const [activeTab,   setActiveTab]   = useState("");
  const [devices,     setDevices]     = useState<string[]>([]);
  const [allVars,     setAllVars]     = useState<string[]>([]);
  const [hiddenVars,  setHiddenVars]  = useState<Set<string>>(new Set());
  const [latestData,  setLatestData]  = useState<Record<string, Record<string, number>>>({});
  const [history,     setHistory]     = useState<Record<string, ChartPoint[]>>({});
  const [sparkHistory,setSparkHistory]= useState<Record<string, Record<string, number[]>>>({});
  const [projectName, setProjectName] = useState(`Project #${projectId}`);
  const [thresholds,  setThresholds]  = useState<ThresholdMap>({});
  const [lastPollMs,       setLastPollMs]       = useState(0);
  const [lastDataMs,       setLastDataMs]       = useState(0);
  const [showAllDevices,   setShowAllDevices]   = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [demoMode,       setDemoMode]       = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<NodeStatus[]>([]);

  // ── Bus Config modal ──
  const [busCfgOpen,      setBusCfgOpen]      = useState(false);
  const [busCfgNodes,     setBusCfgNodes]     = useState<{ machine_id: string; node_name: string; is_active?: boolean }[]>([]);
  const [busCfgMachineId, setBusCfgMachineId] = useState<string | null>(null);
  const [busCfgProtocols, setBusCfgProtocols] = useState<string>("All");
  const [busCfgProfiles,  setBusCfgProfiles]  = useState<MeterProfileLight[]>([]);
  const [busCfgDevices,   setBusCfgDevices]   = useState<BusDeviceConfig[]>([]);
  const [busCfgLoading,   setBusCfgLoading]   = useState(false);
  const [busCfgSaving,    setBusCfgSaving]    = useState(false);
  const [busCfgError,     setBusCfgError]     = useState<string | null>(null);
  const [busCfgSuccess,   setBusCfgSuccess]   = useState<string | null>(null);

  const lastTimestampRef = useRef<string | null>(null);
  const isDark           = darkCtx;

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
    setLastDataMs(Date.now());

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
        const data = await r.json() as { project_name?: string; rows: TelemetryRow[]; thresholds?: ThresholdMap; nodes?: NodeStatus[] } | TelemetryRow[];
        const rows = Array.isArray(data) ? data : (data.rows ?? []);
        if (!Array.isArray(data) && data.project_name) setProjectName(data.project_name);
        if (!Array.isArray(data) && data.thresholds) setThresholds(data.thresholds);
        if (!Array.isArray(data) && data.nodes) setNodeStatuses(data.nodes);
        processRows(rows, true);
      } catch {
        processRows(DEMO_ROWS, true);
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, processRows, navigate, backTo]);

  // ── SSE stream (replaces polling) ──
  useEffect(() => {
    if (loading || demoMode || !projectId) return;
    const token = getToken();
    if (!token) return;

    // EventSource doesn't support custom headers — pass JWT as query param
    const url = `${API_URL}/api/telemetry/stream/${projectId}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.addEventListener('telemetry', (e) => { console.log('[sse] telemetry received', e);
      try {
        const { rows } = JSON.parse((e as MessageEvent).data) as { rows: Array<{ timestamp: string; device_name: string; data: Record<string, unknown> }> };
        if (Array.isArray(rows) && rows.length > 0) {
          const flatRows: TelemetryRow[] = rows.map((r) => ({
            timestamp:   r.timestamp,
            device_name: r.device_name,
            ...r.data,
          }));
          processRows(flatRows, false);
        }
      } catch { /* ignore malformed events */ }
    });

    es.addEventListener('nodes', (e) => {
      try {
        const node = JSON.parse((e as MessageEvent).data) as NodeStatus & { thresholds?: ThresholdMap };
        setNodeStatuses((prev) => {
          const idx = prev.findIndex((n) => n.machine_id === node.machine_id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx]!, ...node };
            return next;
          }
          return [...prev, node];
        });
        if (node.thresholds) setThresholds((prev) => ({ ...prev, ...node.thresholds }));
      } catch { /* ignore malformed events */ }
    });

    es.onerror = () => {
      console.warn('[sse] connection error — will auto-reconnect');
    };

    return () => es.close();
  }, [loading, demoMode, projectId, processRows]);

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

  // ── Bus Config helpers ──
  const loadNodeConfig = useCallback(async (machineId: string, profiles: MeterProfileLight[]) => {
    if (!projectId) return;
    setBusCfgMachineId(machineId);
    setBusCfgLoading(true);
    setBusCfgError(null);
    try {
      const token = getToken();
      const r = await fetch(`${API_URL}/api/projects/${projectId}/config/${machineId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (handleAuthError(r, navigate)) return;
      if (r.status === 404) { setBusCfgDevices([]); setBusCfgLoading(false); return; }
      type RawReg = { name: string; address?: number; length?: number; data_type?: string; multiplier?: number; alarm_min?: string | number | null; alarm_max?: string | number | null; min_alarm?: string | number | null; max_alarm?: string | number | null };
      type RawDevice = Omit<BusDeviceConfig, "registers"> & { registers?: RawReg[]; selected_registers?: RawReg[] };
      type RawConfig = { devices?: RawDevice[] };
      const data = await r.json() as RawConfig & { current_config?: RawDevice[] | RawConfig; config?: RawConfig; desired_config?: RawConfig };
      const rawDevices: RawDevice[] =
        (Array.isArray(data.current_config) && data.current_config.length > 0) ? data.current_config as RawDevice[] :
        (Array.isArray((data.current_config as RawConfig)?.devices) && ((data.current_config as RawConfig).devices!.length > 0)) ? (data.current_config as RawConfig).devices! :
        (Array.isArray(data.devices) && data.devices.length > 0) ? data.devices :
        (Array.isArray(data.config?.devices) && data.config!.devices!.length > 0) ? data.config!.devices! :
        (Array.isArray(data.desired_config?.devices) && data.desired_config!.devices!.length > 0) ? data.desired_config!.devices! :
        [];
      const mapped: BusDeviceConfig[] = rawDevices.map((d) => {
        const savedRegs = d.selected_registers ?? d.registers ?? [];
        const savedMap = new Map(savedRegs.map((r) => [r.name, r]));
        const profile = profiles.find((p) => p.model.toLowerCase() === d.meter_model.toLowerCase());
        const registers: BusRegisterEntry[] = profile
          ? profile.registers.map((r) => {
              const saved = savedMap.get(r.name);
              const alarmMin = saved?.min_alarm ?? saved?.alarm_min;
              const alarmMax = saved?.max_alarm ?? saved?.alarm_max;
              return {
                name: r.name,
                address: r.address,
                length: r.length,
                data_type: r.data_type,
                multiplier: r.multiplier,
                selected: savedMap.has(r.name),
                alarm_min: alarmMin != null ? String(alarmMin) : "",
                alarm_max: alarmMax != null ? String(alarmMax) : "",
              };
            })
          : savedRegs.map((r) => ({
              name: r.name,
              address: r.address,
              length: r.length,
              data_type: r.data_type,
              multiplier: r.multiplier,
              selected: true,
              alarm_min: (r.min_alarm ?? r.alarm_min) != null ? String(r.min_alarm ?? r.alarm_min) : "",
              alarm_max: (r.max_alarm ?? r.alarm_max) != null ? String(r.max_alarm ?? r.alarm_max) : "",
            }));
        return { ...d, meter_model: (d.meter_model ?? "").toLowerCase(), registers };
      });
      setBusCfgDevices(mapped);
    } catch {
      setBusCfgError("Could not load node configuration.");
    } finally {
      setBusCfgLoading(false);
    }
  }, [projectId, navigate]);

  const openBusCfg = useCallback(async () => {
    if (!projectId) return;
    setBusCfgOpen(true);
    setBusCfgLoading(true);
    setBusCfgError(null);
    setBusCfgSuccess(null);
    setBusCfgMachineId(null);
    setBusCfgNodes([]);
    setBusCfgDevices([]);
    try {
      const token = getToken();
      const [profilesRes, nodesRes] = await Promise.all([
        fetch(`${API_URL}/api/meter-profiles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/projects/${projectId}/nodes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (handleAuthError(profilesRes, navigate)) return;
      if (handleAuthError(nodesRes, navigate)) return;
      let freshProfiles: MeterProfileLight[] = [];
      if (profilesRes.ok) {
        const raw = await profilesRes.json();
        freshProfiles = Array.isArray(raw) ? raw : (raw.profiles ?? raw.meter_profiles ?? raw.data ?? []);
      }
      setBusCfgProfiles(freshProfiles);
      const nodesData = await nodesRes.json() as { nodes?: { machine_id: string; node_name: string; is_active?: boolean }[]; protocols?: string };
      const nodes = nodesData.nodes ?? [];
      const activeNodes = nodes.filter((n) => n.is_active !== false);
      setBusCfgNodes(activeNodes);
      setBusCfgProtocols(nodesData.protocols ?? "All");
      if (activeNodes.length === 1) {
        await loadNodeConfig(activeNodes[0].machine_id, freshProfiles);
      } else {
        setBusCfgLoading(false);
      }
    } catch {
      setBusCfgError("Could not load configuration.");
      setBusCfgLoading(false);
    }
  }, [projectId, navigate, loadNodeConfig]);

  function addBusCfgDevice() {
    setBusCfgDevices((prev) => [...prev, {
      device_name: "", meter_model: "", slave_id: 1, poll_rate_ms: 5000,
      protocol: "rtu", com_port: "", baud_rate: 9600, ip_address: "", tcp_port: 502,
      registers: [],
    }]);
  }

  function removeBusCfgDevice(idx: number) {
    setBusCfgDevices((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateBusCfgDevice(idx: number, patch: Partial<BusDeviceConfig>) {
    setBusCfgDevices((prev) => prev.map((d, i) => {
      if (i !== idx) return d;
      const updated = { ...d, ...patch };
      if (patch.meter_model !== undefined && patch.meter_model !== d.meter_model) {
        const profile = busCfgProfiles.find((p) => p.model.toLowerCase() === (patch.meter_model ?? "").toLowerCase());
        updated.registers = profile
          ? profile.registers.map((r) => ({ name: r.name, address: r.address, length: r.length, data_type: r.data_type, multiplier: r.multiplier, selected: false, alarm_min: "", alarm_max: "" }))
          : [];
      }
      return updated;
    }));
  }

  function toggleBusCfgRegister(devIdx: number, regIdx: number) {
    setBusCfgDevices((prev) => prev.map((d, i) => {
      if (i !== devIdx) return d;
      return { ...d, registers: d.registers.map((r, j) => j === regIdx ? { ...r, selected: !r.selected } : r) };
    }));
  }

  function updateBusCfgRegisterAlarm(devIdx: number, regIdx: number, field: "alarm_min" | "alarm_max", value: string) {
    setBusCfgDevices((prev) => prev.map((d, i) => {
      if (i !== devIdx) return d;
      return { ...d, registers: d.registers.map((r, j) => j === regIdx ? { ...r, [field]: value } : r) };
    }));
  }

  const saveBusCfg = useCallback(async () => {
    if (!projectId || !busCfgMachineId) return;
    setBusCfgSaving(true);
    setBusCfgError(null);
    setBusCfgSuccess(null);
    try {
      const token = getToken();
      const payload = {
        machine_id: busCfgMachineId,
        config: {
          devices: busCfgDevices.map((d) => ({
            device_name: d.device_name,
            meter_model: d.meter_model,
            slave_id: d.slave_id,
            poll_rate_ms: d.poll_rate_ms,
            protocol: d.protocol,
            com_port: d.com_port,
            baud_rate: d.baud_rate,
            ip_address: d.ip_address,
            tcp_port: d.tcp_port,
            registers: d.registers
              .filter((r) => r.selected)
              .map((r) => {
                const profile = busCfgProfiles.find((p) => p.model.toLowerCase() === d.meter_model.toLowerCase());
                const profReg = profile?.registers.find((pr) => pr.name === r.name);
                return {
                  name: r.name,
                  address: profReg?.address ?? r.address,
                  length: profReg?.length ?? r.length,
                  data_type: profReg?.data_type ?? r.data_type,
                  multiplier: profReg?.multiplier ?? r.multiplier,
                  min_alarm: r.alarm_min !== "" ? Number(r.alarm_min) : null,
                  max_alarm: r.alarm_max !== "" ? Number(r.alarm_max) : null,
                };
              }),
          })),
        },
      };
      const res = await fetch(`${API_URL}/api/projects/${projectId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (handleAuthError(res, navigate)) return;
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Deploy failed");
      setBusCfgSuccess("Configuration sent — will be applied on next sync cycle");
    } catch (err) {
      setBusCfgError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setBusCfgSaving(false);
    }
  }, [projectId, busCfgMachineId, busCfgDevices, navigate]);

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
  const timeStr        = lastPollMs > 0 ? new Date(lastPollMs).toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--";
  const dataTimeStr    = lastDataMs  > 0 ? new Date(lastDataMs).toLocaleTimeString("en-GB",  { hour12: false }) : "--:--:--";
  const isLive         = !demoMode;

  const dataAge      = !demoMode && lastDataMs > 0 ? Date.now() - lastDataMs : 0;
  const isStale      = dataAge > 30_000;
  const isVeryStale  = dataAge > 5 * 60_000;
  const staleMinutes = Math.floor(dataAge / 60_000);

  const activeNodeStatuses = nodeStatuses.filter((n) => n.is_active !== false);
  const hasStopped  = isLive && activeNodeStatuses.length > 0 && activeNodeStatuses.every((n) => n.polling_state === "stopped");
  const hasFault    = isLive && !hasStopped && activeNodeStatuses.length > 0 && activeNodeStatuses.every((n) => n.polling_state === "fault");
  const stoppedNode = activeNodeStatuses.find((n) => n.polling_state === "stopped");

  const activeDeviceNames = useMemo(() => {
    const s = new Set<string>();
    nodeStatuses.forEach((n) => n.active_devices?.forEach((d) => s.add(d)));
    return s;
  }, [nodeStatuses]);

  const inactiveDeviceSet = useMemo(() =>
    new Set(devices.filter((d) => activeDeviceNames.size > 0 && !activeDeviceNames.has(d))),
  [devices, activeDeviceNames]);

  const visibleDevices = useMemo(() => {
    if (showAllDevices) return devices;
    const active = devices.filter((d) => !inactiveDeviceSet.has(d));
    return active.length > 0 ? active : devices;
  }, [devices, inactiveDeviceSet, showAllDevices]);

  function handleToggleShowAll() {
    setShowAllDevices((prev) => {
      const next = !prev;
      // If hiding inactive and current tab is stale, switch to first visible active device
      if (!next && inactiveDeviceSet.has(activeTab)) {
        const firstActive = devices.find((d) => !inactiveDeviceSet.has(d));
        if (firstActive) setActiveTab(firstActive);
      }
      return next;
    });
  }

  const tk = isDark ? T.dark : T.light;

  const hdrBtn = (accent?: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "0 12px", height: 34, borderRadius: 7, cursor: "pointer",
    background: accent ? accent + "12" : tk.surfaceAlt,
    border: `1px solid ${accent ? accent + "30" : tk.border}`,
    color: accent ?? tk.muted,
    fontFamily: "'Inter',sans-serif", fontWeight: 600,
    fontSize: 13, letterSpacing: "0.01em", transition: "all 0.15s",
  });

  if (loading) {
    return (
      <div data-theme={isDark ? "dark" : "light"} className="scada-page"
        style={{ height: "100svh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16, background: tk.bg }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke={tk.accent} strokeWidth={2.5}
          style={{ animation: "spin-pv 1s linear infinite" }}>
          <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13,
          color: tk.muted, fontWeight: 500 }}>Loading telemetry…</span>
      </div>
    );
  }

  const statusColor = !isLive ? tk.amber : hasStopped ? tk.red : hasFault ? tk.amber : isVeryStale ? tk.red : isStale ? tk.amber : tk.green;
  const statusLabel = !isLive ? "Demo" : hasStopped ? "Stopped" : hasFault ? "Fault" : isVeryStale ? "Offline" : isStale ? "Stale" : "Live";

  return (
    <div data-theme={isDark ? "dark" : "light"} className="scada-page"
      style={{ height: "100svh", display: "flex", flexDirection: "column",
        overflow: "hidden", background: tk.bg, fontFamily: "'Inter',sans-serif" }}>

      {/* ══ Header ══ */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 24px",
        height: 64, flexShrink: 0, background: tk.header,
        borderBottom: `1px solid ${tk.border}`,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        position: "relative", zIndex: 10 }}>

        {/* Back */}
        <button onClick={() => navigate(backTo)} style={{ ...hdrBtn(), padding: "0 16px", borderRadius: 20 }}>
          <ChevronLeft size={16} /> <span style={{ marginLeft: 4 }}>{backTo === "/admin" ? "Fleet" : "Dashboard"}</span>
        </button>

        <div style={{ width: 1, height: 24, background: tk.border }} />

        {/* Brand + project */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: tk.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${tk.accent}44`, flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth={2.5}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Inter',sans-serif",
              fontWeight: 700, fontSize: 16, color: tk.text, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{projectName}</div>
            <div style={{ fontSize: 12, color: tk.muted, fontWeight: 500, lineHeight: 1.3 }}>TechniDAQ Monitoring</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Status + last poll */}
        <div style={{ display: "flex", alignItems: "center", gap: 10,
          padding: "0 16px", height: 36, borderRadius: 20,
          background: tk.surfaceAlt, border: `1px solid ${tk.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor,
            boxShadow: statusColor === tk.green ? `0 0 8px ${statusColor}` : "none",
            animation: statusColor === tk.green ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
          <div style={{ width: 1, height: 16, background: tk.border }} />
          <span style={{ fontSize: 12, color: tk.muted, fontFamily: "'Inter',monospace" }}>{timeStr}</span>
        </div>

        {demoMode && (
          <div style={{ padding: "0 12px", height: 36, display: "flex", alignItems: "center",
            borderRadius: 20, background: tk.amberBg, border: `1px solid ${tk.amberBdr}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: tk.amber, letterSpacing: "0.04em" }}>DEMO MODE</span>
          </div>
        )}

        <div style={{ width: 1, height: 24, background: tk.border }} />

        {/* Export */}
        <button onClick={handleExport} disabled={exporting}
          style={{ ...hdrBtn(tk.green), opacity: exporting ? 0.6 : 1, borderRadius: 20 }}>
          <Download size={14} /> <span style={{ marginLeft: 4 }}>{exporting ? "Exporting…" : "Export"}</span>
        </button>

        {/* Configure Bus */}
        <button onClick={openBusCfg} style={{ ...hdrBtn(tk.purple), borderRadius: 20 }}>
          <Settings size={14} /> <span style={{ marginLeft: 4 }}>Configure Bus</span>
        </button>

        {/* Theme */}
        <button onClick={toggleTheme} style={{ ...hdrBtn(), padding: "0 12px", borderRadius: 20 }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ width: 1, height: 24, background: tk.border }} />

        {/* Logout */}
        <button
          onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("role"); navigate("/login"); }}
          style={{ ...hdrBtn(tk.red), borderRadius: 20 }}>
          <LogOut size={14} /> <span style={{ marginLeft: 4 }}>Log Out</span>
        </button>
      </header>

      {/* ══ Status Banners ══ */}
      {hasStopped && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
          flexShrink: 0, background: tk.redBg, borderBottom: `1px solid ${tk.redBdr}`,
          color: tk.red, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>
          ⚠ Polling stopped — monitoring device has stopped data collection
          {stoppedNode?.last_seen ? ` · last seen ${new Date(stoppedNode.last_seen).toLocaleTimeString("en-GB", { hour12: false })}` : ""}
        </div>
      )}
      {hasFault && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
          flexShrink: 0, background: tk.amberBg, borderBottom: `1px solid ${tk.amberBdr}`,
          color: tk.amber, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>
          ⚠ Device fault — monitoring device has encountered an error
        </div>
      )}
      {isVeryStale && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
          flexShrink: 0, background: tk.redBg, borderBottom: `1px solid ${tk.redBdr}`,
          color: tk.red, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>
          ⚠ No data for {staleMinutes} minute{staleMinutes !== 1 ? "s" : ""} — device may be offline
        </div>
      )}
      {isStale && !isVeryStale && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
          flexShrink: 0, background: tk.amberBg, borderBottom: `1px solid ${tk.amberBdr}`,
          color: tk.amber, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>
          ⚠ Polling may have stopped — last data at {dataTimeStr}
        </div>
      )}

      {/* ══ Device Tab Bar ══ */}
      {devices.length > 0 && (
        <DeviceTabBar devices={visibleDevices} activeTab={activeTab} onSelect={setActiveTab}
          isLive={isLive} isDark={isDark} inactiveDevices={inactiveDeviceSet}
          showAll={showAllDevices} onToggleShowAll={handleToggleShowAll} />
      )}

      {/* ══ Content ══ */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Errors */}
        {fetchError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: tk.redBg,
            border: `1px solid ${tk.redBdr}`, color: tk.red, fontSize: 13 }}>
            {fetchError}
          </div>
        )}
        {exportError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: tk.redBg,
            border: `1px solid ${tk.redBdr}`, color: tk.red, fontSize: 13 }}>
            {exportError}
          </div>
        )}

        {/* Toolbar row: variable filter pills + last-updated */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16 }}>
          {activeDevVars.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tk.muted,
                letterSpacing: "0.05em", textTransform: "uppercase", marginRight: 8 }}>Metrics</span>
              {activeDevVars.map((v, i) => {
                const on = !hiddenVars.has(v);
                const c  = LINE_COLORS[i % LINE_COLORS.length];
                return (
                  <button key={v}
                    onClick={() => setHiddenVars((prev) => { const s = new Set(prev); s.has(v) ? s.delete(v) : s.add(v); return s; })}
                    style={{ padding: "6px 14px", borderRadius: 20,
                      background: on ? c + "15" : "transparent",
                      border: `1px solid ${on ? c + "40" : tk.border}`,
                      color: on ? c : tk.muted, fontFamily: "'Inter',sans-serif",
                      fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%",
                      background: on ? c : tk.border, flexShrink: 0 }} />
                    {v}
                  </button>
                );
              })}
            </div>
          )}
          {!demoMode && lastDataMs > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: isVeryStale ? tk.red : isStale ? tk.amber : tk.green,
                boxShadow: isStale ? "none" : `0 0 8px ${tk.green}`,
                animation: isStale ? "none" : "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: isVeryStale ? tk.red : isStale ? tk.amber : tk.muted }}>
                {isVeryStale ? `Stopped · last data ${dataTimeStr}` : isStale ? "Data may be stale" : `Updated ${dataTimeStr}`}
              </span>
            </div>
          )}
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))", gap: 14 }}>
          {visibleVars.map((varName, idx) => (
            <MetricCard key={varName} name={varName} value={activeLatest[varName]}
              idx={idx} isDark={isDark} sparkData={activeSpark[varName]}
              minThreshold={thresholds[activeTab]?.[varName]?.min}
              maxThreshold={thresholds[activeTab]?.[varName]?.max} />
          ))}
        </div>

        {/* Waveform chart */}
        <div style={{ minHeight: 400 }}>
          <WaveformChart history={activeHistory} chartKeys={visibleVars} isDark={isDark} />
        </div>
      </div>


      {/* ══ Bus Config Modal ══ */}
      {busCfgOpen && (() => {
        const mInp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: 14, outline: "none", boxSizing: "border-box" as const, transition: "all 0.2s" };
        const mLbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 };
        const allowedProtos: ("rtu" | "tcp")[] = busCfgProtocols === "RTU" ? ["rtu"] : busCfgProtocols === "TCP" ? ["tcp"] : ["rtu", "tcp"];
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ background: "#ffffff", borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxWidth: 720, width: "95%", maxHeight: "90vh", overflowY: "auto", position: "relative", display: "flex", flexDirection: "column" }}>
              
              {/* Header */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#ffffff", zIndex: 10 }}>
                <div>
                  <h2 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 20, color: "#0f172a", margin: 0 }}>Configure Bus</h2>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>{projectName}</p>
                </div>
                <button title="Close" onClick={() => setBusCfgOpen(false)} style={{ background: "#f1f5f9", border: "none", color: "#64748b", cursor: "pointer", display: "flex", padding: 8, borderRadius: "50%", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}><X size={20} /></button>
              </div>

              <div style={{ padding: "32px", flex: 1 }}>
                {/* Loading */}
                {busCfgLoading && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={tk.accent} strokeWidth={2.5} style={{ animation: "spin-pv 1s linear infinite" }}>
                      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Node selector */}
                {!busCfgLoading && !busCfgMachineId && busCfgNodes.length > 1 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16, marginTop: 0 }}>Select Node</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                      {busCfgNodes.map((node) => (
                        <button key={node.machine_id} onClick={() => loadNodeConfig(node.machine_id, busCfgProfiles)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = CLR.blue; e.currentTarget.style.boxShadow = `0 4px 12px ${CLR.blue}15`; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{node.node_name || node.machine_id}</span>
                          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#64748b", marginTop: 4 }}>{node.machine_id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No nodes */}
                {!busCfgLoading && !busCfgMachineId && busCfgNodes.length === 0 && !busCfgError && (
                  <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
                    <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>No active nodes found for this project.</p>
                  </div>
                )}

                {/* Device list */}
                {!busCfgLoading && busCfgMachineId && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Devices</h3>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Node: {busCfgMachineId}</div>
                      </div>
                      <button onClick={addBusCfgDevice}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: CLR.blue, color: "#ffffff", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#1550e6"}
                        onMouseOut={(e) => e.currentTarget.style.background = CLR.blue}>
                        <Plus size={16} /> Add Device
                      </button>
                    </div>

                    {busCfgDevices.length === 0 && (
                      <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1", marginBottom: 24 }}>
                        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>No devices configured. Click "Add Device" to begin.</p>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      {busCfgDevices.map((dev, di) => (
                        <div key={di} style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", background: "#ffffff", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                          
                          {/* Device header */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${CLR.blue}15`, color: CLR.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                              {di + 1}
                            </div>
                            <input value={dev.device_name} onChange={(e) => updateBusCfgDevice(di, { device_name: e.target.value })}
                              placeholder="Device name (e.g. Main Incomer)"
                              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "#0f172a", padding: 0 }} />
                            <button onClick={() => removeBusCfgDevice(di)} title="Remove Device"
                              style={{ display: "flex", alignItems: "center", padding: 8, borderRadius: 8, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", transition: "all 0.2s" }}
                              onMouseOver={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div style={{ padding: 20 }}>
                            {/* Connection Settings */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                              <div>
                                <label style={mLbl}>Meter Model</label>
                                <select value={dev.meter_model} onChange={(e) => updateBusCfgDevice(di, { meter_model: e.target.value })}
                                  style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}>
                                  <option value="">— Select Model —</option>
                                  {busCfgProfiles.map((p) => (
                                    <option key={p.model} value={p.model.toLowerCase()}>{p.display_name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={mLbl}>Slave ID</label>
                                <input type="number" min={1} max={247} value={dev.slave_id} onChange={(e) => updateBusCfgDevice(di, { slave_id: Number(e.target.value) })}
                                  style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                              </div>
                              <div>
                                <label style={mLbl}>Poll Rate (ms)</label>
                                <input type="number" min={500} value={dev.poll_rate_ms} onChange={(e) => updateBusCfgDevice(di, { poll_rate_ms: Number(e.target.value) })}
                                  style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                              </div>
                            </div>

                            <div style={{ height: 1, background: "#f1f5f9", margin: "0 -20px 20px -20px" }} />

                            {/* Protocol Settings */}
                            <div style={{ marginBottom: 20 }}>
                              <label style={mLbl}>Protocol</label>
                              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                {allowedProtos.map((proto) => {
                                  const active = dev.protocol === proto;
                                  return (
                                    <button key={proto} type="button" onClick={() => updateBusCfgDevice(di, { protocol: proto })}
                                      style={{ padding: "8px 24px", borderRadius: 8, border: `1px solid ${active ? CLR.blue : "#cbd5e1"}`, background: active ? `${CLR.blue}10` : "#ffffff", color: active ? CLR.blue : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "uppercase" as const, transition: "all 0.2s" }}>
                                      {proto.toUpperCase()}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* RTU fields */}
                              {dev.protocol === "rtu" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                                  <div>
                                    <label style={mLbl}>COM Port</label>
                                    <input value={dev.com_port} onChange={(e) => updateBusCfgDevice(di, { com_port: e.target.value })}
                                      placeholder="e.g. COM3 or /dev/ttyUSB0" style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                                  </div>
                                  <div>
                                    <label style={mLbl}>Baud Rate</label>
                                    <select value={dev.baud_rate} onChange={(e) => updateBusCfgDevice(di, { baud_rate: Number(e.target.value) })}
                                      style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}>
                                      {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* TCP fields */}
                              {dev.protocol === "tcp" && (
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                                  <div>
                                    <label style={mLbl}>IP Address</label>
                                    <input value={dev.ip_address} onChange={(e) => updateBusCfgDevice(di, { ip_address: e.target.value })}
                                      placeholder="192.168.1.100" style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                                  </div>
                                  <div>
                                    <label style={mLbl}>Port</label>
                                    <input type="number" min={1} max={65535} value={dev.tcp_port} onChange={(e) => updateBusCfgDevice(di, { tcp_port: Number(e.target.value) })}
                                      style={mInp} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Register checklist */}
                            {dev.registers.length > 0 && (
                              <div>
                                <div style={{ height: 1, background: "#f1f5f9", margin: "0 -20px 20px -20px" }} />
                                <label style={mLbl}>Registers & Alarms</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {dev.registers.map((reg, ri) => (
                                    <div key={ri} style={{ padding: 12, borderRadius: 8, border: `1px solid ${reg.selected ? `${CLR.blue}40` : "#e2e8f0"}`, background: reg.selected ? `${CLR.blue}05` : "#ffffff", transition: "all 0.2s" }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                        <div onClick={() => toggleBusCfgRegister(di, ri)}
                                          style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${reg.selected ? CLR.blue : "#cbd5e1"}`, background: reg.selected ? CLR.blue : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                                          {reg.selected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: reg.selected ? 600 : 500, color: reg.selected ? "#0f172a" : "#64748b", fontFamily: "'Inter',sans-serif" }}>{reg.name}</span>
                                      </label>
                                      
                                      {reg.selected && (
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginLeft: 32, marginTop: 12 }}>
                                          <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 4 }}>Min Alarm Threshold</label>
                                            <input type="number" value={reg.alarm_min} onChange={(e) => updateBusCfgRegisterAlarm(di, ri, "alarm_min", e.target.value)}
                                              placeholder="Optional" style={{ ...mInp, padding: "8px 12px", fontSize: 13 }} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                                          </div>
                                          <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 4 }}>Max Alarm Threshold</label>
                                            <input type="number" value={reg.alarm_max} onChange={(e) => updateBusCfgRegisterAlarm(di, ri, "alarm_max", e.target.value)}
                                              placeholder="Optional" style={{ ...mInp, padding: "8px 12px", fontSize: 13 }} onFocus={(e) => e.target.style.borderColor = CLR.blue} onBlur={(e) => e.target.style.borderColor = "#e2e8f0"} />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error / success */}
                {busCfgError   && <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 14, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {busCfgError}</div>}
                {busCfgSuccess && <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 14, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}><Check size={18} /> {busCfgSuccess}</div>}
              </div>

              {/* Footer */}
              {!busCfgLoading && busCfgMachineId && (
                <div style={{ padding: "20px 32px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 12, background: "#ffffff", position: "sticky", bottom: 0, zIndex: 10, borderRadius: "0 0 24px 24px" }}>
                  <button onClick={() => setBusCfgOpen(false)} style={{ padding: "12px 24px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"} onMouseOut={(e) => e.currentTarget.style.background = "#f8fafc"}>
                    Cancel
                  </button>
                  <button onClick={saveBusCfg} disabled={busCfgSaving}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", borderRadius: 8, background: CLR.blue, border: "none", color: "#ffffff", fontWeight: 600, fontSize: 14, cursor: busCfgSaving ? "not-allowed" : "pointer", opacity: busCfgSaving ? 0.7 : 1, transition: "all 0.2s" }}
                    onMouseOver={(e) => { if(!busCfgSaving) e.currentTarget.style.background = "#1550e6" }}
                    onMouseOut={(e) => { if(!busCfgSaving) e.currentTarget.style.background = CLR.blue }}>
                    {busCfgSaving
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.5} style={{ animation: "spin-pv 1s linear infinite" }}><path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" /></svg>
                      : "Save & Deploy Configuration"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
