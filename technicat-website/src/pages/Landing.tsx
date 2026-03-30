import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, X, ChevronUp, Plus, Minus } from "lucide-react";

/* ─────────────────────────────────────────────
   TOKENS
──────────────────────────────────────────────*/
const BG   = "#080808";
const BG2  = "#0d0d0d";
const BLUE = "#1a5fff";
const BLUEDIM = "rgba(26,95,255,0.12)";
const W    = "#ffffff";
const DIM  = "rgba(255,255,255,0.45)";
const DIMMER = "rgba(255,255,255,0.18)";
const DIMMEST = "rgba(255,255,255,0.07)";
const BORDER = "rgba(255,255,255,0.09)";
const BLUEBORDER = "rgba(26,95,255,0.35)";

/* ─────────────────────────────────────────────
   INTERSECTION HOOK
──────────────────────────────────────────────*/
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } }, { threshold });
    o.observe(el); return () => o.disconnect();
  }, [threshold]);
  return { ref, v };
}

/* ─────────────────────────────────────────────
   CUT-IN TEXT — hard machine-switch entrance
──────────────────────────────────────────────*/
function Cut({ children, delay = 0, style: s }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, v } = useInView();
  return (
    <div ref={ref} style={{
      clipPath: v ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateX(-12px)",
      transition: `clip-path 0.55s cubic-bezier(0.77,0,0.18,1) ${delay}s, opacity 0.3s ease ${delay}s, transform 0.55s cubic-bezier(0.77,0,0.18,1) ${delay}s`,
      ...s,
    }}>{children}</div>
  );
}

/* ─────────────────────────────────────────────
   COUNTER
──────────────────────────────────────────────*/
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, v } = useInView(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!v) return;
    let n = 0; const step = target / 50;
    const id = setInterval(() => { n += step; if (n >= target) { setVal(target); clearInterval(id); } else setVal(Math.floor(n)); }, 20);
    return () => clearInterval(id);
  }, [v, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─────────────────────────────────────────────
   TECHNIDAQ SPLIT — left/right crash
──────────────────────────────────────────────*/
function TDAQSplit() {
  const { ref, v } = useInView(0.2);
  const L = ["T","E","C","H","N","I"];
  const R = ["D","A","Q"];
  const base: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    fontWeight: 900,
    fontSize: "clamp(5rem,13vw,12rem)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
    display: "inline-block",
  };
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex" }}>
        {L.map((ch, i) => (
          <span key={i} style={{
            ...base, color: W,
            opacity: v ? 1 : 0,
            transform: v ? "none" : "translateX(-120px) skewX(8deg)",
            transition: `opacity 0.5s ease ${i * 0.04}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s`,
            textShadow: v ? "none" : undefined,
          }}>{ch}</span>
        ))}
      </div>
      <span style={{
        ...base, color: BLUE, margin: "0 6px",
        opacity: v ? 1 : 0,
        transform: v ? "scaleX(1)" : "scaleX(0)",
        transition: `opacity 0.2s ease 0.28s, transform 0.25s ease 0.28s`,
        textShadow: v ? `0 0 80px rgba(26,95,255,0.6)` : "none",
      }}>—</span>
      <div style={{ display: "flex" }}>
        {R.map((ch, i) => (
          <span key={i} style={{
            ...base, color: BLUE,
            opacity: v ? 1 : 0,
            transform: v ? "none" : "translateX(120px) skewX(-8deg)",
            transition: `opacity 0.5s ease ${0.3 + i * 0.06}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.06}s`,
            textShadow: v ? `0 0 40px rgba(26,95,255,0.4)` : "none",
          }}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HORIZONTAL RULE / DIVIDER
──────────────────────────────────────────────*/
function HR({ style: s }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: BORDER, ...s }} />;
}

/* ─────────────────────────────────────────────
   SECTION NUMBER
──────────────────────────────────────────────*/

/* ═══════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════*/
export default function Landing() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openProject, setOpenProject] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  const [hoverProject, setHoverProject] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenu(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const projects = [
    { n: "01", name: "LV Main Distribution Board", client: "Beirut Medical Center", type: "MDB — 3200 A", year: "2024", desc: "Main incomer with 42-way distribution, automatic transfer switch, and full TechniDAQ cloud monitoring integration. Designed to IEC 61439, commissioned under live hospital conditions." },
    { n: "02", name: "Motor Control Centre", client: "Sidon Industrial Zone", type: "MCC — 16 Feeders", year: "2023", desc: "16-feeder MCC with VFD integration, in-house busbar fabrication, intelligent motor protection and full IEC 61439 factory acceptance testing. Installed in active production facility." },
    { n: "03", name: "Edge-to-Cloud SCADA", client: "Tier-IV Data Centre, Beirut", type: "SCADA — 48 Meters", year: "2024", desc: "48 Schneider PM meters across 4 UPS zones, automated Excel reporting, threshold alerting, and remote access via TechniDAQ cloud platform. Zero-downtime integration." },
    { n: "04", name: "Multi-Site Air-Gapped Deployment", client: "Smart Grid — Zahle District", type: "SCADA — 6 Sites", year: "2023", desc: "Six substation sites monitored via TechniDAQ air-gapped desktop. Offline historian, automated fault reporting, alarm email via Resend. No internet dependency." },
    { n: "05", name: "ATS Critical Power System", client: "Government Complex, Beirut", type: "ATS — Dual Source", year: "2022", desc: "Open/closed transition ATS with sub-100ms switchover, interlocked manual bypass, and generator monitoring integrated into site BMS. Designed for zero interruption." },
  ];

  const capabilities = [
    { code: "MDB", full: "Main Distribution Boards",     spec: "Up to 6,300 A · IEC 61439" },
    { code: "ATS", full: "Automatic Transfer Switches",  spec: "Sub-100ms · Dual/Triple Source" },
    { code: "MCC", full: "Motor Control Centres",        spec: "VFD Integration · Multi-Feeder" },
    { code: "PFC", full: "Power Factor Correction",      spec: "Capacitor Banks · Harmonic Filters" },
    { code: "FAB", full: "Custom Fabrication",           spec: "CNC Punching · Powder Coating" },
    { code: "COM", full: "Full Turnkey Commissioning",   spec: "Engineering to Handover" },
  ];

  const tiers = [
    { name: "Air-Gapped Enterprise", price: "Custom", note: "One-time license · 100% offline", features: ["Unlimited local retention","AES-256 encrypted DB","RTU + TCP protocols","MID metering compliance","Dedicated engineer"] },
    { name: "Cloud Pro", price: "$49 /device /mo", note: "Unlimited cloud history", features: ["Full Excel & PDF reports","Real-time alerts + SMS","Remote variable control","Multi-site management","REST API + webhooks"], featured: true },
    { name: "Cloud Basic", price: "Free", note: "Included with every hardware unit", features: ["Live monitoring dashboard","1-day data retention","Basic CSV export","Email notifications","Single-site access"] },
  ];

  const QUOTE = "mailto:joesfeir007@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Technicat%20Group&body=Name%3A%20%0ACompany%3A%20%0AProject%3A%20%0A";
  const DEMO  = "mailto:joesfeir007@gmail.com?subject=TechniDAQ%20Demo%20Request&body=Name%3A%20%0ACompany%3A%20%0APhone%3A%20%0A";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${BLUE}; color: #fff; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes drift { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
        @keyframes glitch {
          0%,100%{clip-path:none;transform:none}
          20%{clip-path:inset(20% 0 60% 0);transform:translateX(-4px)}
          40%{clip-path:inset(60% 0 10% 0);transform:translateX(4px)}
          60%{clip-path:none;transform:none}
        }
        .nav-link { font-family:'Barlow',sans-serif; font-size:13px; font-weight:500; letter-spacing:0.08em; color:${DIM}; background:none; border:none; cursor:pointer; padding:8px 12px; transition:color 0.2s; text-decoration:none; text-transform:uppercase; }
        .nav-link:hover { color:${W}; }
        @media(min-width:768px){.mob{display:none!important}}
        @media(max-width:767px){.desk{display:none!important}}
      `}</style>

      {/* ══════ NAV ══════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? "rgba(8,8,8,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${BORDER}` : "none",
        transition: "all 0.4s",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: scrolled ? 56 : 68, transition: "height 0.3s" }}>

          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
            <img src="/src/assets/logo_t.png" alt="TG" style={{ height: 30 }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.05rem", color: W, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Technicat<span style={{ color: BLUE }}>Group</span>
            </span>
          </button>

          <nav className="desk" style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[["About","about"],["Manufacturing","manufacturing"],["Projects","projects"],["TechniDAQ","technidaq"],["Contact","contact"]].map(([l,id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link">{l}</button>
            ))}
            <Link to="/careers" className="nav-link">Careers</Link>
            <div style={{ width: 1, height: 16, background: BORDER, margin: "0 8px" }} />
            <Link to="/login" style={{ fontFamily: "'Barlow',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, border: `1px solid ${BLUEBORDER}`, background: BLUEDIM, padding: "7px 16px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,95,255,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUEDIM; }}
            >Portal</Link>
            <button onClick={() => scrollTo("contact")} style={{ marginLeft: 8, fontFamily: "'Barlow',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", background: BLUE, color: W, border: "none", padding: "8px 20px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#0f46e8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE; }}
            >Get a Quote</button>
          </nav>

          <button onClick={() => setMenu(o => !o)} className="mob" style={{ background: "none", border: "none", cursor: "pointer", color: W, padding: 8 }}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menu && (
          <div style={{ background: "rgba(8,8,8,0.98)", borderTop: `1px solid ${BORDER}`, padding: "24px 32px 28px" }}>
            {[["About","about"],["Manufacturing","manufacturing"],["Projects","projects"],["TechniDAQ","technidaq"],["Contact","contact"],["Careers","careers-page"]].map(([l,id]) => (
              <button key={id} onClick={() => id === "careers-page" ? (setMenu(false), navigate("/careers")) : scrollTo(id)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 0", fontFamily: "'Barlow',sans-serif", fontSize: 18, fontWeight: 300, color: DIM, background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", letterSpacing: "0.05em" }}
              >{l}</button>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <Link to="/login" style={{ flex: 1, textAlign: "center", padding: "12px", fontFamily: "'Barlow',sans-serif", fontSize: 13, fontWeight: 500, color: BLUE, border: `1px solid ${BLUEBORDER}`, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>Portal</Link>
              <button onClick={() => scrollTo("contact")} style={{ flex: 1, padding: "12px", fontFamily: "'Barlow',sans-serif", fontSize: 13, fontWeight: 500, background: BLUE, color: W, border: "none", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>Quote</button>
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ══════ 00 · HERO ══════ */}
        <section style={{ height: "100vh", minHeight: 640, background: BG, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden", padding: "0 32px 64px" }}>

          {/* Horizontal rule lines background */}
          {[20,40,60,80].map(pct => (
            <div key={pct} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: 1, background: DIMMEST }} />
          ))}
          {/* Vertical rule lines */}
          {[25,50,75].map(pct => (
            <div key={pct} style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: 1, background: DIMMEST }} />
          ))}

          {/* BIG background type */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-52%)",
            fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif",
            fontWeight: 900,
            fontSize: "clamp(12rem,32vw,34rem)",
            lineHeight: 0.85,
            color: "rgba(255,255,255,0.025)",
            letterSpacing: "-0.04em",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            animation: "glitch 12s ease-in-out 4s infinite",
          }}>TG</div>

          {/* Panel placeholder — top right */}
          <div style={{
            position: "absolute",
            top: "50%", right: "6%",
            transform: "translateY(-50%)",
            width: "min(340px, 35vw)", height: "min(480px, 55vh)",
            border: `1px solid rgba(26,95,255,0.2)`,
            background: "rgba(26,95,255,0.03)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12,
          }} className="desk">
            {/* Corner brackets */}
            {[[0,0],[0,"auto"],["auto",0],["auto","auto"]].map(([t,b],i) => (
              <div key={i} style={{
                position: "absolute",
                top: t === 0 ? -1 : "auto",
                bottom: b === "auto" ? -1 : "auto",
                left: i < 2 ? -1 : "auto",
                right: i >= 2 ? -1 : "auto",
                width: 20, height: 20,
                borderTop:    (i===0||i===2) ? `2px solid ${BLUE}` : undefined,
                borderBottom: (i===1||i===3) ? `2px solid ${BLUE}` : undefined,
                borderLeft:   (i===0||i===1) ? `2px solid ${BLUE}` : undefined,
                borderRight:  (i===2||i===3) ? `2px solid ${BLUE}` : undefined,
              }} />
            ))}
            <div style={{ width: 80, height: 80, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, background: BLUEDIM, border: `1px solid ${BLUEBORDER}` }} />
            </div>
            <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 10, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>Panel Assembly · Coming Soon</span>
            <div style={{ position: "absolute", bottom: 12, right: 16, display: "flex", gap: 5 }}>
              {[BLUE,"#0891b2","#059669"].map((c,i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c, animation: `blink 2s ease-in-out ${i*0.5}s infinite` }} />
              ))}
            </div>
          </div>

          {/* Hero copy — bottom left */}
          <div style={{ position: "relative", zIndex: 2, maxWidth: "min(680px, 55vw)" }} className="desk">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ width: 32, height: 1, background: BLUE }} />
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: BLUE, letterSpacing: "0.25em", textTransform: "uppercase" }}>Est. Beirut, Lebanon</span>
            </div>
            <h1 style={{
              fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3.5rem,8vw,8rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              color: W,
              marginBottom: 32,
              animation: "fadeIn 0.8s ease 0.1s both",
            }}>
              LV PANEL<br />
              <span style={{ color: BLUE }}>MANUFACTURE</span><br />
              &amp; INTELLIGENCE
            </h1>
            <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "1rem", color: DIM, lineHeight: 1.75, maxWidth: 460, marginBottom: 40 }}>
              We design, fabricate, and commission high-specification low-voltage electrical distribution systems —
              and build the software layer that monitors them in real time.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button onClick={() => scrollTo("projects")} style={{
                fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
                background: W, color: BG, border: "none", padding: "14px 28px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e8e8e8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = W; }}
              >View Projects <ArrowRight size={14} /></button>
              <button onClick={() => scrollTo("technidaq")} style={{
                fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
                background: "none", color: DIM, border: `1px solid ${BORDER}`, padding: "13px 28px", cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = W; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = BORDER; }}
              >TechniDAQ</button>
            </div>
          </div>

          {/* Mobile hero copy */}
          <div style={{ position: "relative", zIndex: 2 }} className="mob">
            <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(3rem,14vw,5rem)", lineHeight: 0.92, letterSpacing: "-0.03em", color: W, marginBottom: 20 }}>
              LV PANEL<br /><span style={{ color: BLUE }}>MANUFACTURE</span><br />&amp; INTELLIGENCE
            </h1>
            <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 14, color: DIM, lineHeight: 1.7, marginBottom: 28 }}>
              High-specification LV switchgear + real-time SCADA monitoring. Beirut, Lebanon.
            </p>
            <button onClick={() => scrollTo("projects")} style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", background: W, color: BG, border: "none", padding: "13px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              View Projects <ArrowRight size={13} />
            </button>
          </div>

          {/* Scroll cue */}
          <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "drift 2.5s ease-in-out infinite" }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(${BLUE}, transparent)` }} />
            <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 9, color: DIMMER, letterSpacing: "0.3em", textTransform: "uppercase" }}>Scroll</span>
          </div>
        </section>

        {/* ══════ 01 · ABOUT ══════ */}
        <section id="about" style={{ padding: "140px 32px", background: BG2, position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <HR />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 80 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>01 — About</span>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em" }}>Beirut, Lebanon</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", position: "relative" }} className="desk">
              <div>
                <Cut>
                  <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(3rem,5.5vw,5.5rem)", lineHeight: 0.95, letterSpacing: "-0.02em", color: W, marginBottom: 40 }}>
                    PRECISION<br />
                    ENGINEERED<br />
                    <span style={{ color: BLUE }}>SINCE DAY ONE.</span>
                  </h2>
                </Cut>
                <Cut delay={0.1}>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "0.975rem", color: DIM, lineHeight: 1.85, marginBottom: 24 }}>
                    Technicat Group designs, fabricates, and commissions low-voltage electrical distribution systems
                    for hospitals, data centres, industrial plants, and critical infrastructure across the Middle East.
                  </p>
                </Cut>
                <Cut delay={0.18}>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "0.975rem", color: DIM, lineHeight: 1.85, marginBottom: 40 }}>
                    Every panel we manufacture can connect to <span style={{ color: W, fontWeight: 500 }}>TechniDAQ</span> —
                    our edge-to-cloud SCADA platform — making us the only company in the region offering
                    both the hardware and the intelligence layer as a single solution.
                  </p>
                </Cut>
                {/* CEO placeholder */}
                <Cut delay={0.24}>
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: BLUE }}>JS</div>
                    <div>
                      <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 14, color: W, marginBottom: 2 }}>Joe Sfeir — Founder & CEO</p>
                      <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 12, color: DIMMER }}>Board of Engineers of Lebanon · 12+ years LV power systems</p>
                    </div>
                  </div>
                </Cut>
              </div>

              {/* Stats */}
              <div>
                {[
                  { n: 500, s: "+", l: "Panels Delivered" },
                  { n: 12,  s: "+", l: "Years Experience" },
                  { n: 40,  s: "+", l: "Active Sites" },
                  { n: 99,  s:"%",  l: "Uptime SLA" },
                ].map((st, i) => (
                  <div key={st.l} style={{ borderBottom: `1px solid ${BORDER}`, padding: "28px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 14, color: DIM, letterSpacing: "0.05em" }}>{st.l}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,4vw,3.8rem)", color: i % 2 === 0 ? W : BLUE, lineHeight: 1, letterSpacing: "-0.02em" }}>
                      <Counter target={st.n} suffix={st.s} />
                    </span>
                  </div>
                ))}
                <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, background: BLUE }} />
                  <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.15em", textTransform: "uppercase" }}>ISO 9001:2015 Certified</span>
                </div>
              </div>
            </div>

            {/* Mobile about */}
            <div className="mob">
              <Cut>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,10vw,4rem)", lineHeight: 0.95, letterSpacing: "-0.02em", color: W, marginBottom: 28 }}>
                  PRECISION ENGINEERED<br /><span style={{ color: BLUE }}>SINCE DAY ONE.</span>
                </h2>
              </Cut>
              <Cut delay={0.1}>
                <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 32 }}>
                  Technicat Group designs, fabricates, and commissions LV electrical distribution systems across the Middle East. Every panel connects to TechniDAQ — our edge-to-cloud SCADA platform.
                </p>
              </Cut>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: BORDER }}>
                {[{n:500,s:"+",l:"Panels"},{n:12,s:"+",l:"Years"},{n:40,s:"+",l:"Sites"},{n:99,s:"%",l:"Uptime"}].map(st => (
                  <div key={st.l} style={{ background: BG2, padding: "20px 16px" }}>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "2.5rem", color: BLUE, lineHeight: 1, margin: "0 0 4px" }}><Counter target={st.n} suffix={st.s} /></p>
                    <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMER, letterSpacing: "0.1em" }}>{st.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════ 02 · MANUFACTURING ══════ */}
        <section id="manufacturing" style={{ padding: "140px 32px", background: BG, position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <HR />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 80 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>02 — Manufacturing</span>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em" }}>IEC 61439</span>
            </div>

            <Cut>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,5vw,5rem)", lineHeight: 0.95, letterSpacing: "-0.02em", color: W, marginBottom: 72, maxWidth: 700 }}>
                WE BUILD WHAT<br />
                CRITICAL INFRASTRUCTURE<br />
                <span style={{ color: BLUE }}>RUNS ON.</span>
              </h2>
            </Cut>

            {/* Capability rows */}
            <div>
              {capabilities.map((c, i) => (
                <div key={c.code} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 1fr auto",
                  alignItems: "center", gap: 32,
                  padding: "22px 0", borderBottom: `1px solid ${BORDER}`,
                  transition: "background 0.2s",
                  cursor: "default",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,95,255,0.04)"; e.currentTarget.style.paddingLeft = "12px"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.paddingLeft = "0"; }}
                >
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.1rem", color: BLUE, letterSpacing: "0.08em" }}>{c.code}</span>
                  <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 400, fontSize: "clamp(0.9rem,1.8vw,1.1rem)", color: W }}>{c.full}</span>
                  <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 13, color: DIMMER, letterSpacing: "0.05em" }} className="desk">{c.spec}</span>
                  <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMEST, letterSpacing: "0.1em", textAlign: "right" }}>0{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ 03 · PROJECTS ══════ */}
        <section id="projects" style={{ padding: "140px 32px", background: BG2, position: "relative" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <HR />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 80 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>03 — Projects</span>
              <button onClick={() => navigate("/projects")} style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: BLUE, letterSpacing: "0.15em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >All Projects <ArrowUpRight size={12} /></button>
            </div>

            <Cut>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,5vw,5rem)", lineHeight: 0.95, letterSpacing: "-0.02em", color: W, marginBottom: 64, maxWidth: 600 }}>
                SELECTED<br />
                <span style={{ color: BLUE }}>WORK.</span>
              </h2>
            </Cut>

            {/* Expandable project rows */}
            {projects.map((p, i) => (
              <div key={p.n}>
                <div
                  onClick={() => setOpenProject(openProject === i ? null : i)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto auto",
                    alignItems: "center",
                    gap: "16px 32px",
                    padding: "24px 0",
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: openProject === i ? "rgba(26,95,255,0.04)" : hoverProject === i ? "rgba(255,255,255,0.02)" : "none",
                    paddingLeft: openProject === i || hoverProject === i ? 16 : 0,
                  }}
                  onMouseEnter={() => setHoverProject(i)}
                  onMouseLeave={() => setHoverProject(null)}
                >
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1rem", color: openProject === i ? BLUE : DIMMER, letterSpacing: "0.08em", transition: "color 0.2s" }}>{p.n}</span>
                  <div>
                    <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 400, fontSize: "clamp(0.95rem,2vw,1.15rem)", color: openProject === i ? W : W, display: "block" }}>{p.name}</span>
                    <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 12, color: DIMMER, letterSpacing: "0.05em" }}>{p.client}</span>
                  </div>
                  <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 12, color: DIMMER, textAlign: "right", whiteSpace: "nowrap" }} className="desk">{p.type}</span>
                  <div style={{ width: 28, height: 28, border: `1px solid ${openProject === i ? BLUEBORDER : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", background: openProject === i ? BLUEDIM : "none" }}>
                    {openProject === i ? <Minus size={12} style={{ color: BLUE }} /> : <Plus size={12} style={{ color: DIM }} />}
                  </div>
                </div>
                {/* Expanded */}
                <div style={{
                  overflow: "hidden",
                  maxHeight: openProject === i ? "200px" : "0px",
                  transition: "max-height 0.4s cubic-bezier(0.77,0,0.18,1)",
                }}>
                  <div style={{ padding: "24px 0 24px 80px", borderBottom: `1px solid ${BORDER}`, display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "start" }}>
                    <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "0.9rem", color: DIM, lineHeight: 1.8, maxWidth: 580 }}>{p.desc}</p>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "1rem", color: DIMMER, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{p.year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ TRANSITION ══════ */}
        <section style={{ padding: "80px 32px", background: BG, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(26,95,255,0.08) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
          <Cut style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, maxWidth: 120, height: 1, background: `linear-gradient(90deg, transparent, ${BLUE})` }} />
              <div style={{ width: 6, height: 6, background: BLUE, transform: "rotate(45deg)" }} />
              <div style={{ flex: 1, maxWidth: 120, height: 1, background: `linear-gradient(90deg, ${BLUE}, transparent)` }} />
            </div>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "clamp(1.2rem,3vw,2rem)", color: DIMMER, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>The Panel Connects.</p>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2rem,5vw,4rem)", color: W, letterSpacing: "-0.02em", lineHeight: 1 }}>The Software <span style={{ color: BLUE }}>Thinks.</span></p>
          </Cut>
        </section>

        {/* ══════ 04 · TECHNIDAQ ══════ */}
        <section id="technidaq" style={{ padding: "140px 32px", background: BG2, position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <HR />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 80 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>04 — TechniDAQ</span>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em" }}>Edge-to-Cloud SCADA</span>
            </div>

            {/* THE CRASH ANIMATION */}
            <div style={{ marginBottom: 64, overflow: "hidden" }}>
              <TDAQSplit />
            </div>

            <Cut delay={0.1}>
              <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "1rem", color: DIM, lineHeight: 1.85, maxWidth: 640, margin: "0 auto 80px", textAlign: "center" }}>
                Monitor, control, and analyse your entire electrical infrastructure in real time —
                from a single panel to enterprise-wide multi-site deployments. Air-gapped or cloud. Your choice.
              </p>
            </Cut>

            {/* Pricing — brutalist table */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,280px),1fr))", gap: 1, background: BORDER }}>
              {tiers.map((t) => (
                <div key={t.name} style={{
                  background: t.featured ? "rgba(26,95,255,0.06)" : BG2,
                  padding: "40px 32px",
                  position: "relative",
                  transition: "background 0.3s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.featured ? "rgba(26,95,255,0.1)" : "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.featured ? "rgba(26,95,255,0.06)" : BG2; }}
                >
                  {t.featured && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BLUE }} />
                  )}
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>{t.name}</p>
                  <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: t.featured ? BLUE : W, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 6 }}>{t.price}</p>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMER, marginBottom: 32 }}>{t.note}</p>
                  <div style={{ height: 1, background: BORDER, marginBottom: 28 }} />
                  {t.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 4, height: 4, background: t.featured ? BLUE : DIMMER, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 13, color: DIM }}>{f}</span>
                    </div>
                  ))}
                  <button onClick={() => scrollTo("contact")} style={{
                    width: "100%", marginTop: 32, padding: "13px",
                    fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                    background: t.featured ? BLUE : "transparent",
                    color: t.featured ? W : DIM,
                    border: `1px solid ${t.featured ? BLUE : BORDER}`,
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                    onMouseEnter={e => { if (t.featured) { e.currentTarget.style.background = "#0f46e8"; } else { e.currentTarget.style.color = W; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; } }}
                    onMouseLeave={e => { if (t.featured) { e.currentTarget.style.background = BLUE; } else { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = BORDER; } }}
                  >Get Started <ArrowRight size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ 05 · NEWSLETTER ══════ */}
        <section style={{ padding: "120px 32px", background: BG, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: 80, alignItems: "center" }}>
            <Cut>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: BLUE, letterSpacing: "0.25em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Newsletter</span>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 0.95, letterSpacing: "-0.02em", color: W, marginBottom: 20 }}>
                THE ELECTRICAL<br />
                <span style={{ color: BLUE }}>INTELLIGENCE</span><br />
                MONTHLY.
              </h2>
              <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "0.925rem", color: DIM, lineHeight: 1.8 }}>
                Industry breakthroughs, ongoing projects, new TechniDAQ features, and deep dives into LV power systems. No filler. Published monthly.
              </p>
            </Cut>
            <Cut delay={0.12}>
              {subbed ? (
                <div style={{ borderTop: `2px solid ${BLUE}`, paddingTop: 24 }}>
                  <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.8rem", color: W, letterSpacing: "-0.02em" }}>You're on the list.</p>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 14, color: DIM, marginTop: 8 }}>Welcome aboard.</p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (email) setSubbed(true); }}>
                  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0, flexWrap: "wrap" }}>
                    <input type="email" required placeholder="your@email.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ flex: 1, minWidth: 200, padding: "16px 0", fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 16, color: W, background: "none", border: "none", outline: "none", borderBottom: `1px solid ${BORDER}` }}
                    />
                    <button type="submit" style={{
                      padding: "16px 28px", fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                      background: BLUE, color: W, border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#0f46e8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = BLUE; }}
                    >Subscribe</button>
                  </div>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMEST, marginTop: 12, letterSpacing: "0.05em" }}>No spam. Unsubscribe anytime.</p>
                </form>
              )}
            </Cut>
          </div>
        </section>

        {/* ══════ 06 · CONTACT ══════ */}
        <section id="contact" style={{ padding: "140px 32px", background: BG2 }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <HR />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 80 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, letterSpacing: "0.2em", textTransform: "uppercase" }}>06 — Contact</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }} className="desk">
              <div>
                <Cut>
                  <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(3rem,6vw,6rem)", lineHeight: 0.92, letterSpacing: "-0.03em", color: W, marginBottom: 48 }}>
                    LET'S BUILD<br />
                    SOMETHING<br />
                    <span style={{ color: BLUE }}>RELIABLE.</span>
                  </h2>
                </Cut>
                <Cut delay={0.1}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      { label: "Location", val: "New Rawda, Beirut, Lebanon", href: null },
                      { label: "Email", val: "joesfeir007@gmail.com", href: "mailto:joesfeir007@gmail.com" },
                      { label: "Phone", val: "+961 XX XXX XXX", href: null },
                      { label: "LinkedIn", val: "technicat-group", href: "https://www.linkedin.com/company/technicat-group/about/" },
                    ].map(c => (
                      <div key={c.label} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 24, padding: "20px 0", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMER, letterSpacing: "0.15em", textTransform: "uppercase", paddingTop: 2 }}>{c.label}</span>
                        {c.href
                          ? <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 400, fontSize: "0.95rem", color: BLUE, textDecoration: "none", transition: "opacity 0.2s" }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                            >{c.val}</a>
                          : <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 400, fontSize: "0.95rem", color: W }}>{c.val}</span>
                        }
                      </div>
                    ))}
                  </div>
                </Cut>
              </div>

              <Cut delay={0.12}>
                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: "0.95rem", color: DIM, lineHeight: 1.85, marginBottom: 48 }}>
                    Our engineering team is ready to spec your next panel board, SCADA integration, or full-turnkey project.
                    We respond within one business day.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <a href={QUOTE} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "20px 24px", fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 13,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      background: W, color: BG, textDecoration: "none", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#e8e8e8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = W; }}
                    >Request a Project Quote <ArrowRight size={14} /></a>
                    <a href={DEMO} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "20px 24px", fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 13,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      background: "transparent", color: DIM, border: `1px solid ${BORDER}`, textDecoration: "none", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = W; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = DIMMEST; }}
                      onMouseLeave={e => { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "transparent"; }}
                    >Request a TechniDAQ Demo <ArrowRight size={14} /></a>
                  </div>
                </div>
              </Cut>
            </div>

            {/* Mobile contact */}
            <div className="mob">
              <Cut>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,10vw,4rem)", lineHeight: 0.92, letterSpacing: "-0.03em", color: W, marginBottom: 40 }}>
                  LET'S BUILD<br />SOMETHING<br /><span style={{ color: BLUE }}>RELIABLE.</span>
                </h2>
              </Cut>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href={QUOTE} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", background: W, color: BG, textDecoration: "none" }}>
                  Request Quote <ArrowRight size={13} />
                </a>
                <a href={DEMO} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", fontFamily: "'Barlow',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: DIM, border: `1px solid ${BORDER}`, textDecoration: "none" }}>
                  Request Demo <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: "48px 32px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32, marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/src/assets/logo_t.png" alt="TG" style={{ height: 26 }} />
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "0.95rem", color: W, letterSpacing: "0.12em" }}>TECHNICAT<span style={{ color: BLUE }}>GROUP</span></span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
              {[["Projects", "/projects", true],["Careers", "/careers", true],["Portal", "/login", true]].map(([l,h,_r]) => (
                <Link key={String(l)} to={String(h)} style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", transition: "color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = W; }}
                  onMouseLeave={e => { e.currentTarget.style.color = DIMMER; }}
                >{String(l)}</Link>
              ))}
              <a href="https://www.linkedin.com/company/technicat-group/about/" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 500, color: DIMMER, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 16px", transition: "color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = BLUE; }}
                onMouseLeave={e => { e.currentTarget.style.color = DIMMER; }}
              >LinkedIn</a>
            </div>
          </div>
          <HR />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 24 }}>
            <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMEST, letterSpacing: "0.08em" }}>&copy; {new Date().getFullYear()} Technicat Group. New Rawda, Beirut, Lebanon.</span>
            <span style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 11, color: DIMMEST, letterSpacing: "0.08em" }}>ISO 9001:2015</span>
          </div>
        </div>
      </footer>

      {scrolled && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 50,
          width: 40, height: 40, background: BLUE, color: W, border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(26,95,255,0.4)", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#0f46e8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = "none"; }}
        ><ChevronUp size={18} /></button>
      )}
    </>
  );
}