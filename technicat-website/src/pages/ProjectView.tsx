import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { ChevronLeft, Sun, Moon, LogOut, Download, Settings, X, Plus, Trash2, Check } from "lucide-react";
import { getToken, handleAuthError } from "../lib/auth";
import { API_URL } from "../config";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY   = 120;
const SPARK_HISTORY = 20;
const POLL_MS       = 2000;

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
  @keyframes pulse-dot   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes pulse-alarm { 0%,100%{box-shadow:0 0 0 1.5px #ef4444,0 0 8px #ef444433} 50%{box-shadow:0 0 0 1.5px #ef4444,0 0 18px #ef444466} }
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
type Theme         = "dark" | "light";
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
  name: string; value: number | undefined; idx: number; isDark: boolean; sparkData?: number[];
  minThreshold?: number | null; maxThreshold?: number | null;
}) {
  const p        = regPalette(name, idx);
  const hasVal   = value !== undefined && !isNaN(value);
  const abs      = hasVal ? Math.abs(value!) : 0;
  const display  = hasVal
    ? (abs >= 10000 ? value!.toFixed(0) : abs >= 100 ? value!.toFixed(1) : abs >= 1 ? value!.toFixed(2) : value!.toFixed(4))
    : "——";
  const isAlarm  = hasVal && (
    (maxThreshold != null && value! > maxThreshold) ||
    (minThreshold != null && value! < minThreshold)
  );
  const accentColor = isAlarm ? CLR.red : p.border;

  return (
    <div style={{ ...glass(isDark), padding: 0, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative", animation: isAlarm ? "pulse-alarm 1.5s ease-in-out infinite" : "none" }}>
      <div style={{ height: "2px", width: "100%", flexShrink: 0, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)` }} />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Share Tech Mono',monospace", letterSpacing: "-0.03em", lineHeight: 1, color: hasVal ? CLR.text1(isDark) : CLR.text3(isDark) }}>{display}</div>
        <div style={{ height: "2px", borderRadius: "1px", background: CLR.borderDim(isDark), overflow: "hidden" }}>
          {hasVal && <div style={{ height: "100%", borderRadius: "1px", width: `${Math.min(100, (Math.abs(value!) / 500) * 100)}%`, background: `linear-gradient(90deg,${accentColor},${accentColor}99)`, transition: "width 0.5s ease" }} />}
        </div>
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ padding: "0 16px 10px", marginTop: "-4px" }}>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={sparkData.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line type="monotone" dataKey="v" stroke={accentColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "60px", background: `radial-gradient(circle at 100% 100%, ${accentColor}22, transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
}

// ─── DeviceTabBar ─────────────────────────────────────────────────────────────

function DeviceTabBar({ devices, activeTab, onSelect, isLive, isDark, inactiveDevices, showAll, onToggleShowAll }: {
  devices: string[]; activeTab: string; onSelect: (n: string) => void;
  isLive: boolean; isDark: boolean;
  inactiveDevices: Set<string>; showAll: boolean; onToggleShowAll: () => void;
}) {
  const inactiveCount = inactiveDevices.size;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px 0 20px", height: "48px", background: CLR.bgTabBar(isDark), borderBottom: `1px solid ${CLR.border(isDark)}`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", overflowX: "auto", overflowY: "hidden", flexShrink: 0 }}>
      {devices.map((name, i) => {
        const isActive   = activeTab === name;
        const isInactive = inactiveDevices.has(name);
        const accent     = TAB_ACCENTS[i % TAB_ACCENTS.length];
        return (
          <button key={name} onClick={() => onSelect(name)} style={{ padding: "0 16px", height: "32px", border: isActive ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}` : "1px solid transparent", borderRadius: "8px", background: isActive ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.95)") : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s ease", boxShadow: isActive ? (isDark ? "0 1px 6px rgba(0,0,0,0.4)" : "0 1px 4px rgba(15,23,42,0.12)") : "none", opacity: isInactive ? 0.4 : 1 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: isActive ? (isLive && !isInactive ? accent : CLR.text3(isDark)) : CLR.text3(isDark), boxShadow: isActive && isLive && !isInactive ? `0 0 7px ${accent}` : "none", animation: isActive && isLive && !isInactive ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: isActive ? 700 : 500, fontSize: "0.83rem", letterSpacing: "0.04em", color: isActive ? CLR.text1(isDark) : CLR.text2(isDark) }}>{name}</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.54rem", letterSpacing: "0.08em", color: isActive ? accent : CLR.text3(isDark), padding: "1px 6px", borderRadius: "20px", border: `1px solid ${isActive ? accent + "40" : CLR.border(isDark)}`, background: isActive ? accent + "10" : "transparent" }}>S{i + 1}</span>
          </button>
        );
      })}
      {inactiveCount > 0 && (
        <button onClick={onToggleShowAll} style={{ marginLeft: "auto", flexShrink: 0, padding: "0 12px", height: "26px", borderRadius: "6px", border: `1px solid ${showAll ? CLR.amber + "66" : CLR.border(isDark)}`, background: showAll ? CLR.amber + "18" : "transparent", color: showAll ? CLR.amber : CLR.text3(isDark), fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.1em", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
          {showAll ? "HIDE INACTIVE" : `SHOW ALL (${inactiveCount} INACTIVE)`}
        </button>
      )}
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
  const [thresholds,  setThresholds]  = useState<ThresholdMap>({});
  const [lastPollMs,       setLastPollMs]       = useState(0);
  const [lastDataMs,       setLastDataMs]       = useState(0);
  const [deviceMissedPolls,setDeviceMissedPolls]= useState<Record<string, number>>({});
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
  const devicesRef       = useRef<string[]>([]);
  const isDark           = theme === "dark";

  // Keep devicesRef in sync so processRows (useCallback []) can read it without a stale closure
  useEffect(() => { devicesRef.current = devices; }, [devices]);

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

    // Track consecutive missed polls per device
    if (replace) {
      // Initial load — clean slate, all devices active
      setDeviceMissedPolls({});
    } else {
      // Incremental poll — devices absent from this batch get +1 missed, present ones reset to 0
      const pollDeviceSet = new Set(devList);
      setDeviceMissedPolls((prev) => {
        const next = { ...prev };
        devicesRef.current.forEach((d) => {
          next[d] = pollDeviceSet.has(d) ? 0 : (next[d] ?? 0) + 1;
        });
        return next;
      });
    }
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
        const data = await r.json() as { rows?: TelemetryRow[]; thresholds?: ThresholdMap; nodes?: NodeStatus[] } | TelemetryRow[];
        const rows = Array.isArray(data) ? data : (data.rows ?? []);
        if (!Array.isArray(data) && data.thresholds) setThresholds(data.thresholds);
        if (!Array.isArray(data) && data.nodes) setNodeStatuses(data.nodes);
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
  const tabAccent      = TAB_ACCENTS[devices.indexOf(activeTab) % TAB_ACCENTS.length] ?? CLR.blue;
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

  const inactiveDeviceSet = useMemo(() =>
    new Set(devices.filter((d) => (deviceMissedPolls[d] ?? 0) >= 2)),
  [devices, deviceMissedPolls]);

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

          {/* Live / Stopped / Fault / Stale / Offline / Demo status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%",
              background: !isLive ? CLR.amber : hasStopped ? CLR.red : hasFault ? CLR.amber : isVeryStale ? CLR.red : isStale ? CLR.amber : CLR.green,
              boxShadow: isLive && !hasStopped && !hasFault && !isStale ? `0 0 8px ${CLR.green}` : "none",
              animation: isLive && !hasStopped && !hasFault && !isStale ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.12em", fontWeight: 600,
              color: !isLive ? CLR.amber : hasStopped ? CLR.red : hasFault ? CLR.amber : isVeryStale ? CLR.red : isStale ? CLR.amber : CLR.green }}>
              {!isLive ? "DEMO" : hasStopped ? "STOPPED" : hasFault ? "FAULT" : isVeryStale ? "OFFLINE" : isStale ? "STALE" : "LIVE"}
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

          {/* Configure Bus */}
          <button onClick={openBusCfg} style={ctrlBtn(CLR.purple)}>
            <Settings size={13} /> Configure Bus
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

      {/* ══ Node polling-state banners (immediate, from API) ══ */}
      {hasStopped && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", flexShrink: 0, background: CLR.red + "22", borderBottom: `2px solid ${CLR.red}55`, color: CLR.red, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 700 }}>
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚠</span>
          <span>POLLING STOPPED — The monitoring device has stopped data collection{stoppedNode?.last_seen ? ` · last seen ${new Date(stoppedNode.last_seen).toLocaleTimeString("en-GB", { hour12: false })}` : ""}</span>
        </div>
      )}
      {hasFault && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", flexShrink: 0, background: CLR.amber + "1a", borderBottom: `2px solid ${CLR.amber}44`, color: CLR.amber, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 700 }}>
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚠</span>
          <span>DEVICE FAULT — The monitoring device has encountered an error</span>
        </div>
      )}

      {/* ══ Stale-time banners (fallback when nodes not in response) ══ */}
      {isVeryStale && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", flexShrink: 0, background: CLR.red + "18", borderBottom: `1px solid ${CLR.red}44`, color: CLR.red, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
          <span>⚠</span>
          <span>No data received for {staleMinutes} minute{staleMinutes !== 1 ? "s" : ""} — the monitoring device may be offline</span>
        </div>
      )}
      {isStale && !isVeryStale && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", flexShrink: 0, background: CLR.amber + "15", borderBottom: `1px solid ${CLR.amber}44`, color: CLR.amber, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
          <span>⚠</span>
          <span>Polling appears to have stopped — last data received at {dataTimeStr}</span>
        </div>
      )}

      {/* ══ Device Tab Bar ══ */}
      {devices.length > 0 && (
        <DeviceTabBar devices={visibleDevices} activeTab={activeTab} onSelect={setActiveTab} isLive={isLive} isDark={isDark} inactiveDevices={inactiveDeviceSet} showAll={showAllDevices} onToggleShowAll={handleToggleShowAll} />
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
        {!demoMode && lastDataMs > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isVeryStale ? CLR.red : isStale ? CLR.amber : CLR.green, boxShadow: isStale ? "none" : `0 0 6px ${CLR.green}`, animation: isStale ? "none" : "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.14em", color: isVeryStale ? CLR.red : isStale ? CLR.amber : CLR.text2(isDark), textTransform: "uppercase" }}>
              {isVeryStale
                ? `Polling appears stopped — last data at ${dataTimeStr}`
                : isStale
                ? "Data may be stale"
                : `Last updated: ${dataTimeStr}`}
            </span>
          </div>
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
              minThreshold={thresholds[activeTab]?.[varName]?.min}
              maxThreshold={thresholds[activeTab]?.[varName]?.max}
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

      {/* ══ Bus Config Modal ══ */}
      {busCfgOpen && (() => {
        const mInp: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
        const mLbl: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 };
        const allowedProtos: ("rtu" | "tcp")[] = busCfgProtocols === "RTU" ? ["rtu"] : busCfgProtocols === "TCP" ? ["tcp"] : ["rtu", "tcp"];
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxWidth: 680, width: "95%", maxHeight: "92vh", overflowY: "auto", padding: 28, position: "relative" }}>

              {/* Close */}
              <button onClick={() => setBusCfgOpen(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}><X size={18} /></button>

              {/* Header */}
              <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: "#0f172a", marginBottom: 2 }}>Configure Bus</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#64748b", marginBottom: 20 }}>{projectName}</div>

              {/* Loading */}
              {busCfgLoading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={CLR.blue} strokeWidth={2.5} style={{ animation: "spin-login 1s linear infinite" }}>
                    <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Node selector */}
              {!busCfgLoading && !busCfgMachineId && busCfgNodes.length > 1 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Select Node</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {busCfgNodes.map((node) => (
                      <button key={node.machine_id} onClick={() => loadNodeConfig(node.machine_id, busCfgProfiles)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{node.node_name || node.machine_id}</span>
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#64748b", marginTop: 2 }}>{node.machine_id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No nodes */}
              {!busCfgLoading && !busCfgMachineId && busCfgNodes.length === 0 && !busCfgError && (
                <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0" }}>No active nodes found for this project.</div>
              )}

              {/* Device list */}
              {!busCfgLoading && busCfgMachineId && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Devices</div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{busCfgMachineId}</div>
                    </div>
                    <button onClick={addBusCfgDevice}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: `1px solid ${CLR.blue}44`, background: `${CLR.blue}10`, color: CLR.blue, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      <Plus size={13} /> Add Device
                    </button>
                  </div>

                  {busCfgDevices.length === 0 && (
                    <div style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0 20px" }}>No devices configured. Click "Add Device" to begin.</div>
                  )}

                  {busCfgDevices.map((dev, di) => (
                    <div key={di} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 14, background: "#fafcff" }}>

                      {/* Device header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <input value={dev.device_name} onChange={(e) => updateBusCfgDevice(di, { device_name: e.target.value })}
                          placeholder="Device name (e.g. Main Incomer)"
                          style={{ ...mInp, flex: 1, fontWeight: 600 }}
                          onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                        <button onClick={() => removeBusCfgDevice(di)}
                          style={{ display: "flex", alignItems: "center", padding: "7px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Meter model + Slave ID */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={mLbl}>Meter Model</label>
                          <select value={dev.meter_model} onChange={(e) => updateBusCfgDevice(di, { meter_model: e.target.value })}
                            style={{ ...mInp }}
                            onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}>
                            <option value="">— Select —</option>
                            {busCfgProfiles.map((p) => (
                              <option key={p.model} value={p.model.toLowerCase()}>{p.display_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={mLbl}>Slave ID</label>
                          <input type="number" min={1} max={247} value={dev.slave_id} onChange={(e) => updateBusCfgDevice(di, { slave_id: Number(e.target.value) })}
                            style={mInp}
                            onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                        </div>
                      </div>

                      {/* Poll rate */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={mLbl}>Poll Rate (ms)</label>
                        <input type="number" min={500} value={dev.poll_rate_ms} onChange={(e) => updateBusCfgDevice(di, { poll_rate_ms: Number(e.target.value) })}
                          style={mInp}
                          onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                      </div>

                      {/* Protocol toggle */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={mLbl}>Protocol</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {allowedProtos.map((proto) => {
                            const active = dev.protocol === proto;
                            return (
                              <button key={proto} type="button" onClick={() => updateBusCfgDevice(di, { protocol: proto })}
                                style={{ padding: "6px 18px", borderRadius: 6, border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`, background: active ? "#eff6ff" : "#f8fafc", color: active ? "#2563eb" : "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer", textTransform: "uppercase" as const }}>
                                {proto.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* RTU fields */}
                      {dev.protocol === "rtu" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={mLbl}>COM Port</label>
                            <input value={dev.com_port} onChange={(e) => updateBusCfgDevice(di, { com_port: e.target.value })}
                              placeholder="COM3" style={mInp}
                              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                          </div>
                          <div>
                            <label style={mLbl}>Baud Rate</label>
                            <select value={dev.baud_rate} onChange={(e) => updateBusCfgDevice(di, { baud_rate: Number(e.target.value) })}
                              style={mInp}
                              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}>
                              {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* TCP fields */}
                      {dev.protocol === "tcp" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={mLbl}>IP Address</label>
                            <input value={dev.ip_address} onChange={(e) => updateBusCfgDevice(di, { ip_address: e.target.value })}
                              placeholder="192.168.1.100" style={mInp}
                              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                          </div>
                          <div>
                            <label style={mLbl}>Port</label>
                            <input type="number" min={1} max={65535} value={dev.tcp_port} onChange={(e) => updateBusCfgDevice(di, { tcp_port: Number(e.target.value) })}
                              style={mInp}
                              onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                          </div>
                        </div>
                      )}

                      {/* Register checklist */}
                      {dev.registers.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Registers</div>
                          {dev.registers.map((reg, ri) => (
                            <div key={ri} style={{ marginBottom: 8 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                                <div onClick={() => toggleBusCfgRegister(di, ri)}
                                  style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${reg.selected ? "#2563eb" : "#e2e8f0"}`, background: reg.selected ? "#eff6ff" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                                  {reg.selected && <Check size={10} color="#2563eb" />}
                                </div>
                                <span style={{ fontSize: 13, color: reg.selected ? "#0f172a" : "#64748b", fontFamily: "'Share Tech Mono',monospace" }}>{reg.name}</span>
                              </label>
                              {reg.selected && (
                                <div style={{ display: "flex", gap: 8, marginLeft: 27, marginTop: 4 }}>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 2 }}>Alarm Min</label>
                                    <input type="number" value={reg.alarm_min} onChange={(e) => updateBusCfgRegisterAlarm(di, ri, "alarm_min", e.target.value)}
                                      placeholder="—" style={{ ...mInp, padding: "5px 8px", fontSize: 12 }}
                                      onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 2 }}>Alarm Max</label>
                                    <input type="number" value={reg.alarm_max} onChange={(e) => updateBusCfgRegisterAlarm(di, ri, "alarm_max", e.target.value)}
                                      placeholder="—" style={{ ...mInp, padding: "5px 8px", fontSize: 12 }}
                                      onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; }}
                                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error / success */}
              {busCfgError   && <div style={{ padding: "9px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 14 }}>{busCfgError}</div>}
              {busCfgSuccess && <div style={{ padding: "9px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 13, marginBottom: 14 }}>{busCfgSuccess}</div>}

              {/* Footer */}
              {!busCfgLoading && busCfgMachineId && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={saveBusCfg} disabled={busCfgSaving}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 11, borderRadius: 8, background: "#2563eb", border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: busCfgSaving ? "not-allowed" : "pointer", opacity: busCfgSaving ? 0.65 : 1 }}>
                    {busCfgSaving
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} style={{ animation: "spin-login 1s linear infinite" }}><path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" /></svg>
                      : "Save & Deploy"}
                  </button>
                  <button onClick={() => setBusCfgOpen(false)} style={{ padding: "11px 18px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
