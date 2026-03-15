import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { ChevronLeft, Sun, Moon, Play, Square, Trash2, LogOut } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY   = 60;
const SPARK_HISTORY = 20;

// ─── Design tokens (ported verbatim from desktop) ─────────────────────────────

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
  @keyframes alarm-red  { 0%,100%{box-shadow:0 0 0 1.5px #ef4444,0 0 0 3px #ef444422} 50%{box-shadow:0 0 0 2px #ef4444,0 0 16px 4px #ef444444} }
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

// ─── Virtual devices + telemetry engine ───────────────────────────────────────

interface VirtualDevice {
  device_name: string;
  slave_id: number;
  registers: string[];
  profile: { voltBase: number; currentBase: number; powerBase: number; pf: number; freq: number };
}

const VIRTUAL_DEVICES: VirtualDevice[] = [
  {
    device_name: "Main Incomer", slave_id: 1,
    registers: ["Voltage L1","Voltage L2","Voltage L3","Current L1","Current L2","Current L3","Active Power Total","Power Factor","Frequency"],
    profile: { voltBase: 230, currentBase: 12.4, powerBase: 8200, pf: 0.92, freq: 50.01 },
  },
  {
    device_name: "HVAC Panel", slave_id: 2,
    registers: ["Voltage L1","Current L1","Active Power Total","Power Factor","Frequency"],
    profile: { voltBase: 229, currentBase: 7.5, powerBase: 3100, pf: 0.88, freq: 50.00 },
  },
  {
    device_name: "UPS Bypass", slave_id: 3,
    registers: ["Voltage L1","Current L1","Active Power Total","Power Factor","Frequency"],
    profile: { voltBase: 231, currentBase: 4.2, powerBase: 1800, pf: 0.96, freq: 49.99 },
  },
];

const DEMO_NAMES: Record<string, string> = {
  "1": "Beirut Medical Center",
  "2": "Tier-IV Data Center",
  "3": "RHI Airport Expansion",
  "4": "Byblos Petrochemical",
  "5": "Zahle Smart Grid",
  "6": "AUB Campus Upgrade",
};

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function generateReading(dev: VirtualDevice, prev?: Record<string, number>): Record<string, number> {
  const p = dev.profile;
  const walk = (cur: number, tgt: number, noise: number) =>
    clamp(cur + (tgt - cur) * 0.08 + (Math.random() - 0.5) * noise, tgt * 0.88, tgt * 1.12);

  const v1 = walk(prev?.["Voltage L1"] ?? p.voltBase,           p.voltBase,           0.8);
  const v2 = walk(prev?.["Voltage L2"] ?? p.voltBase + 0.3,     p.voltBase + 0.3,     0.8);
  const v3 = walk(prev?.["Voltage L3"] ?? p.voltBase - 0.2,     p.voltBase - 0.2,     0.8);
  const c1 = walk(prev?.["Current L1"] ?? p.currentBase,        p.currentBase,        0.6);
  const c2 = walk(prev?.["Current L2"] ?? p.currentBase * 0.98, p.currentBase * 0.98, 0.6);
  const c3 = walk(prev?.["Current L3"] ?? p.currentBase * 1.01, p.currentBase * 1.01, 0.6);
  const pw = walk(prev?.["Active Power Total"] ?? p.powerBase,  p.powerBase,         80.0);
  const pf = clamp(walk(prev?.["Power Factor"] ?? p.pf,         p.pf,                 0.005), 0.5, 1.0);
  const fr = clamp(walk(prev?.["Frequency"]    ?? p.freq,       p.freq,               0.015), 49.5, 50.5);

  const full: Record<string, number> = {
    "Voltage L1": v1, "Voltage L2": v2, "Voltage L3": v3,
    "Current L1": c1, "Current L2": c2, "Current L3": c3,
    "Active Power Total": pw, "Power Factor": pf, "Frequency": fr,
  };
  // Return only registers this device exposes
  return Object.fromEntries(dev.registers.map((k) => [k, full[k] ?? 0]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartPoint = Record<string, string | number>;
type PollState  = "running" | "stopped";
type Theme      = "dark" | "light";
type ViewMode   = "chart" | "grid";

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  name, value, idx, isDark, sparkData,
}: {
  name: string; value: number | undefined; idx: number; isDark: boolean; sparkData?: number[];
}) {
  const p      = regPalette(name, idx);
  const hasVal = value !== undefined && !isNaN(value);
  const abs    = hasVal ? Math.abs(value!) : 0;
  const display = hasVal
    ? (abs >= 10000 ? value!.toFixed(0) : abs >= 100 ? value!.toFixed(1) : abs >= 1 ? value!.toFixed(2) : value!.toFixed(4))
    : "——";

  return (
    <div style={{ ...glass(isDark), padding: 0, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative", transition: "box-shadow 0.2s ease" }}>
      {/* Accent top line */}
      <div style={{ height: "2px", width: "100%", flexShrink: 0, background: `linear-gradient(90deg, ${p.border}, ${p.border}88, transparent)` }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Share Tech Mono',monospace", letterSpacing: "-0.03em", lineHeight: 1, color: hasVal ? CLR.text1(isDark) : CLR.text3(isDark) }}>
          {display}
        </div>
        {/* Accent bar */}
        <div style={{ height: "2px", borderRadius: "1px", background: CLR.borderDim(isDark), overflow: "hidden" }}>
          {hasVal && (
            <div style={{ height: "100%", borderRadius: "1px", width: `${Math.min(100, (Math.abs(value!) / 500) * 100)}%`, background: `linear-gradient(90deg,${p.border},${p.border}99)`, transition: "width 0.5s ease" }} />
          )}
        </div>
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div style={{ padding: "0 16px 10px", marginTop: "-4px" }}>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={sparkData.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line type="monotone" dataKey="v" stroke={p.border} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Corner glow */}
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "60px", background: `radial-gradient(circle at 100% 100%, ${p.border}22, transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
}

// ─── DeviceTabBar ─────────────────────────────────────────────────────────────

function DeviceTabBar({ devices, activeTab, onSelect, pollState, isDark }: {
  devices: VirtualDevice[]; activeTab: string; onSelect: (n: string) => void;
  pollState: PollState; isDark: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "4px",
      padding: "0 20px", height: "48px",
      background: CLR.bgTabBar(isDark),
      borderBottom: `1px solid ${CLR.border(isDark)}`,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      overflowX: "auto", overflowY: "hidden", flexShrink: 0,
    }}>
      {devices.map((dev, i) => {
        const isActive = activeTab === dev.device_name;
        const accent   = TAB_ACCENTS[i % TAB_ACCENTS.length];
        const isLive   = pollState === "running";
        return (
          <button key={dev.device_name} onClick={() => onSelect(dev.device_name)} style={{
            padding: "0 16px", height: "32px",
            border: isActive ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}` : "1px solid transparent",
            borderRadius: "8px",
            background: isActive ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.95)") : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s ease",
            boxShadow: isActive ? (isDark ? "0 1px 6px rgba(0,0,0,0.4)" : "0 1px 4px rgba(15,23,42,0.12)") : "none",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
              background: isActive ? (isLive ? accent : CLR.text3(isDark)) : CLR.text3(isDark),
              boxShadow: isActive && isLive ? `0 0 7px ${accent}` : "none",
              animation: isActive && isLive ? "pulse-dot 2s ease-in-out infinite" : "none",
            }} />
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: isActive ? 700 : 500, fontSize: "0.83rem", letterSpacing: "0.04em", color: isActive ? CLR.text1(isDark) : CLR.text2(isDark) }}>
              {dev.device_name}
            </span>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: "0.54rem", letterSpacing: "0.08em",
              color: isActive ? accent : CLR.text3(isDark),
              padding: "1px 6px", borderRadius: "20px",
              border: `1px solid ${isActive ? accent + "40" : CLR.border(isDark)}`,
              background: isActive ? accent + "10" : "transparent",
            }}>S{dev.slave_id}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── WaveformChart ────────────────────────────────────────────────────────────

function WaveformChart({ history, chartKeys, pollState, tabAccent, isDark }: {
  history: ChartPoint[]; chartKeys: string[]; pollState: PollState; tabAccent: string; isDark: boolean;
}) {
  const [viewMode,    setViewMode]    = useState<ViewMode>("chart");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => new Set(chartKeys));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setVisibleKeys(new Set(chartKeys)), [chartKeys.join(",")]);

  const stopped   = pollState === "stopped";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const axisTick  = CLR.text3(isDark);

  const gridKeys = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    history.forEach((pt) =>
      Object.keys(pt).forEach((k) => { if (k !== "time" && !seen.has(k)) { seen.add(k); order.push(k); } })
    );
    return order;
  }, [history]);

  const emptyState = (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={CLR.text3(isDark)} strokeWidth={1.5}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: CLR.text3(isDark), textTransform: "uppercase" }}>
        {stopped ? "Polling stopped" : "Awaiting data…"}
      </span>
    </div>
  );

  return (
    <div style={{ ...glass(isDark), overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={tabAccent} strokeWidth={2.5}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: CLR.text1(isDark) }}>
            Real-Time Waveform
          </span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", color: CLR.text3(isDark) }}>
            {history.length}/{MAX_HISTORY}pts
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${CLR.border(isDark)}` }}>
            {(["chart", "grid"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              return (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: "3px 10px", height: "26px",
                  background: active ? (isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)") : "transparent",
                  border: "none",
                  borderRight: mode === "chart" ? `1px solid ${CLR.border(isDark)}` : "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                  color: active ? CLR.text1(isDark) : CLR.text3(isDark),
                  transition: "background 0.15s",
                }}>
                  {mode === "chart"
                    ? <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    : <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
                  }
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: active ? 700 : 500, fontSize: "0.68rem", letterSpacing: "0.06em" }}>
                    {mode === "chart" ? "Chart" : "Grid"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend pills (chart mode) */}
          {viewMode === "chart" && chartKeys.map((k, i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "10px", height: "3px", borderRadius: "2px", background: LINE_COLORS[i % LINE_COLORS.length] }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.58rem", color: CLR.text2(isDark), maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            </div>
          ))}

          {/* Live badge */}
          <span style={{
            padding: "2px 8px", borderRadius: "4px",
            fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.12em",
            background: stopped ? CLR.borderDim(isDark) : tabAccent + "20",
            color:      stopped ? CLR.text3(isDark)     : tabAccent,
            border:     `1px solid ${stopped ? CLR.borderDim(isDark) : tabAccent + "44"}`,
          }}>{stopped ? "PAUSED" : "LIVE"}</span>
        </div>
      </div>

      {/* Series toggle buttons */}
      {viewMode === "chart" && chartKeys.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", padding: "6px 16px", borderBottom: `1px solid ${CLR.border(isDark)}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.text3(isDark), marginRight: "2px" }}>SHOW</span>
          {chartKeys.map((k, i) => {
            const on = visibleKeys.has(k);
            const c  = LINE_COLORS[i % LINE_COLORS.length];
            return (
              <button key={k} onClick={() => setVisibleKeys((prev) => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; })} style={{
                padding: "2px 10px", height: "22px", borderRadius: "20px",
                background: on ? c + "22" : "transparent",
                border: `1px solid ${on ? c + "88" : CLR.border(isDark)}`,
                color: on ? c : CLR.text3(isDark),
                fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.06em",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.12s",
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: on ? c : CLR.borderDim(isDark), flexShrink: 0 }} />
                {k}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Chart ── */}
      {viewMode === "chart" && (
        <div style={{ flex: "1 1 0", minHeight: "280px", padding: "8px 4px 8px 0", position: "relative" }}>
          {history.length === 0 ? emptyState : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time"
                  tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: axisTick }}
                  axisLine={{ stroke: CLR.border(isDark) }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={60} />
                {chartKeys.slice(0, 1).map(() => (
                  <YAxis key="l" yAxisId="l" orientation="left"
                    tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: LINE_COLORS[0] }}
                    axisLine={false} tickLine={false} width={56}
                    tickFormatter={(v: number) => v.toFixed(1)} />
                ))}
                {chartKeys.slice(1, 2).map(() => (
                  <YAxis key="r" yAxisId="r" orientation="right"
                    tick={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, fill: LINE_COLORS[1] }}
                    axisLine={false} tickLine={false} width={56}
                    tickFormatter={(v: number) => v.toFixed(2)} />
                ))}
                <Tooltip contentStyle={{
                  background: isDark ? "#1c2128" : "#ffffff",
                  border: `1px solid ${CLR.border(isDark)}`,
                  borderRadius: "6px", padding: "8px 12px",
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "0.66rem", color: CLR.text1(isDark),
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }} cursor={{ stroke: CLR.borderDim(isDark), strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ display: "none" }} />
                {chartKeys.filter((k) => visibleKeys.has(k)).map((k, i) => (
                  <Line key={k} yAxisId={i === 0 ? "l" : "r"} type="monotone" dataKey={k}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2}
                    dot={false} activeDot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                    isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {viewMode === "grid" && (
        <div style={{ flex: "1 1 0", minHeight: "280px", position: "relative", overflowX: "auto", overflowY: "auto" }}>
          {history.length === 0 ? emptyState : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.64rem", letterSpacing: "0.03em" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, zIndex: 2, background: isDark ? "#0f1117" : "#f1f5f9", borderBottom: `2px solid ${CLR.border(isDark)}` }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.54rem", color: CLR.text3(isDark), borderRight: `1px solid ${CLR.border(isDark)}`, minWidth: "92px" }}>Timestamp</th>
                  {gridKeys.map((k) => {
                    const pal = regPalette(k, 0);
                    return <th key={k} style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.52rem", color: pal.border, borderRight: `1px solid ${CLR.border(isDark)}`, minWidth: "110px" }}>{k}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((pt, i) => {
                  const alt = i % 2 === 1;
                  const rowBg = alt ? (isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.03)") : "transparent";
                  return (
                    <tr key={i} style={{ background: rowBg }}>
                      <td style={{ padding: "5px 14px", whiteSpace: "nowrap", color: CLR.text2(isDark), borderRight: `1px solid ${CLR.borderDim(isDark)}`, borderBottom: `1px solid ${CLR.borderDim(isDark)}` }}>{String(pt.time)}</td>
                      {gridKeys.map((k) => {
                        const raw = pt[k]; const num = typeof raw === "number" ? raw : NaN;
                        const a = Math.abs(num);
                        const disp = isNaN(num) ? "—" : a >= 10000 ? num.toFixed(0) : a >= 100 ? num.toFixed(1) : a >= 1 ? num.toFixed(3) : num.toFixed(5);
                        const pal2 = regPalette(k, 0);
                        return <td key={k} style={{ padding: "5px 10px", textAlign: "right", whiteSpace: "nowrap", color: isNaN(num) ? CLR.text3(isDark) : pal2.value, borderRight: `1px solid ${CLR.borderDim(isDark)}`, borderBottom: `1px solid ${CLR.borderDim(isDark)}`, fontVariantNumeric: "tabular-nums" }}>{disp}</td>;
                      })}
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
  const navigate               = useNavigate();
  const { projectId }          = useParams<{ projectId: string }>();
  const [theme,       setTheme]       = useState<Theme>("dark");
  const [pollState,   setPollState]   = useState<PollState>("running");
  const [activeTab,   setActiveTab]   = useState(VIRTUAL_DEVICES[0].device_name);
  const [latestData,  setLatestData]  = useState<Record<string, Record<string, number>>>({});
  const [history,     setHistory]     = useState<Record<string, ChartPoint[]>>({});
  const [sparkHistory,setSparkHistory]= useState<Record<string, Record<string, number[]>>>({});
  const [lastPollMs,  setLastPollMs]  = useState(0);

  const latestRef    = useRef<Record<string, Record<string, number>>>({});
  const isDark       = theme === "dark";
  const activeDevice = VIRTUAL_DEVICES.find((d) => d.device_name === activeTab) ?? VIRTUAL_DEVICES[0];
  const tabAccent    = TAB_ACCENTS[VIRTUAL_DEVICES.indexOf(activeDevice) % TAB_ACCENTS.length];
  const projectName  = projectId ? (DEMO_NAMES[projectId] ?? `Project #${projectId}`) : "Unknown Project";

  // Chart shows Voltage L1 + Current L1 on dual Y-axes
  const chartKeys = useMemo(() => {
    const keys: string[] = [];
    const volt = activeDevice.registers.find((r) => r.includes("Voltage L1"));
    const curr = activeDevice.registers.find((r) => r.includes("Current L1"));
    if (volt) keys.push(volt);
    if (curr) keys.push(curr);
    return keys;
  }, [activeDevice]);

  // Inject SCADA CSS once
  useEffect(() => {
    if (document.getElementById("scada-css")) return;
    const el = document.createElement("style");
    el.id = "scada-css"; el.textContent = SCADA_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("scada-css")?.remove(); };
  }, []);

  // Telemetry engine — 1s interval
  useEffect(() => {
    if (pollState !== "running") return;

    const tick = () => {
      const now     = Date.now();
      const timeStr = new Date(now).toLocaleTimeString("en-GB", { hour12: false });

      const newLatest: Record<string, Record<string, number>> = {};
      VIRTUAL_DEVICES.forEach((dev) => {
        newLatest[dev.device_name] = generateReading(dev, latestRef.current[dev.device_name]);
      });
      latestRef.current = newLatest;

      setLatestData({ ...newLatest });
      setLastPollMs(now);

      setHistory((prev) => {
        const next = { ...prev };
        VIRTUAL_DEVICES.forEach((dev) => {
          const reading = newLatest[dev.device_name] ?? {};
          const point: ChartPoint = { time: timeStr, ...reading };
          const arr = [...(prev[dev.device_name] ?? []), point];
          next[dev.device_name] = arr.slice(-MAX_HISTORY);
        });
        return next;
      });

      setSparkHistory((prev) => {
        const next = { ...prev };
        VIRTUAL_DEVICES.forEach((dev) => {
          const reading  = newLatest[dev.device_name] ?? {};
          const devSpark: Record<string, number[]> = { ...(prev[dev.device_name] ?? {}) };
          Object.entries(reading).forEach(([k, v]) => {
            devSpark[k] = [...(devSpark[k] ?? []), v].slice(-SPARK_HISTORY);
          });
          next[dev.device_name] = devSpark;
        });
        return next;
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pollState]);

  const handleClear = useCallback(() => {
    setHistory({}); setSparkHistory({}); setLatestData({});
    latestRef.current = {};
  }, []);

  const timeStr      = lastPollMs > 0 ? new Date(lastPollMs).toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--";
  const activeLatest = latestData[activeTab]    ?? {};
  const activeHistory= history[activeTab]       ?? [];
  const activeSpark  = sparkHistory[activeTab]  ?? {};

  /* ── btn styles ── */
  const ctrlBtn = (accent?: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "0 12px", height: "34px", borderRadius: "6px", cursor: "pointer",
    background: accent ? `${accent}18` : (isDark ? "rgba(255,255,255,0.05)" : "#f6f8fa"),
    border: `1px solid ${accent ? accent + "44" : CLR.border(isDark)}`,
    color: accent ?? CLR.text2(isDark),
    fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
    fontSize: "0.75rem", letterSpacing: "0.06em",
  });

  return (
    <div data-theme={theme} className="scada-page" style={{ height: "100svh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ══ SCADA Header ══ */}
      <header style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "0 20px", height: "58px", flexShrink: 0,
        background: CLR.bgHeader(isDark),
        borderBottom: `1px solid ${CLR.border(isDark)}`,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        position: "relative", zIndex: 10,
      }}>
        {/* Back */}
        <button onClick={() => navigate("/dashboard")} style={ctrlBtn()}>
          <ChevronLeft size={14} /> Dashboard
        </button>

        {/* Divider + Brand */}
        <div style={{ width: "1px", height: "24px", background: CLR.border(isDark) }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", color: isDark ? "#e6edf3" : "#0f172a", lineHeight: 1 }}>TechniDAQ</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.14em", color: CLR.text3(isDark), lineHeight: 1.5 }}>{projectName}</div>
          </div>
        </div>

        {/* Device summary */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.06em", color: CLR.text2(isDark), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {VIRTUAL_DEVICES.map((d) => `${d.device_name} [S${d.slave_id}·1s]`).join("  ·  ")}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Last poll */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.48rem", letterSpacing: "0.14em", color: CLR.text3(isDark), textTransform: "uppercase" }}>Last Poll</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.7rem", color: CLR.text1(isDark) }}>{timeStr}</div>
          </div>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: pollState === "running" ? CLR.green : CLR.text3(isDark),
              boxShadow: pollState === "running" ? `0 0 8px ${CLR.green}` : "none",
            }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.12em", fontWeight: 600, color: pollState === "running" ? CLR.green : CLR.text3(isDark) }}>
              {pollState === "running" ? "LIVE" : "STOPPED"}
            </span>
          </div>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Simulation badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 10px", height: "28px", background: `${CLR.amber}15`, border: `1px solid ${CLR.amber}44`, borderRadius: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: CLR.amber, boxShadow: `0 0 5px ${CLR.amber}`, animation: "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "0.56rem", letterSpacing: "0.14em", color: CLR.amber, textTransform: "uppercase" }}>No Hardware</span>
          </div>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Poll toggle */}
          <button
            onClick={() => setPollState((s) => s === "running" ? "stopped" : "running")}
            style={{
              ...ctrlBtn(pollState === "running" ? CLR.red : undefined),
              background: pollState === "running" ? `${CLR.red}18` : CLR.blue,
              border: `1px solid ${pollState === "running" ? CLR.red + "44" : CLR.blue}`,
              color: pollState === "running" ? CLR.red : "#fff",
              padding: "0 14px",
              boxShadow: pollState === "running" ? "none" : `0 2px 8px ${CLR.blue}44`,
            }}
          >
            {pollState === "running"
              ? <><Square size={12} fill="currentColor" /> Stop</>
              : <><Play  size={12} fill="currentColor" /> Start</>
            }
          </button>

          {/* Clear */}
          <button onClick={handleClear} style={ctrlBtn()}>
            <Trash2 size={12} /> Clear
          </button>

          {/* Theme */}
          <button onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")} style={{ ...ctrlBtn(), padding: "0 10px" }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div style={{ width: "1px", height: "28px", background: CLR.border(isDark) }} />

          {/* Logout */}
          <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} style={{ ...ctrlBtn(CLR.red), padding: "0 10px", fontWeight: 600 }}>
            <LogOut size={13} /> Log Out
          </button>
        </div>
      </header>

      {/* ══ Device Tab Bar ══ */}
      <DeviceTabBar
        devices={VIRTUAL_DEVICES}
        activeTab={activeTab}
        onSelect={setActiveTab}
        pollState={pollState}
        isDark={isDark}
      />

      {/* ══ Content ══ */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 175px), 1fr))", gap: "12px" }}>
          {activeDevice.registers.map((regName, idx) => (
            <MetricCard
              key={regName}
              name={regName}
              value={activeLatest[regName]}
              idx={idx}
              isDark={isDark}
              sparkData={activeSpark[regName]}
            />
          ))}
        </div>

        {/* Waveform chart */}
        <div style={{ minHeight: 380 }}>
          <WaveformChart
            history={activeHistory}
            chartKeys={chartKeys}
            pollState={pollState}
            tabAccent={tabAccent}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}
