import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, ChevronRight, ArrowRight,
  Zap, Shield, BarChart3, Factory, Monitor, Cloud,
  Database, Bell, Download, Gauge, CircuitBoard,
  Building2, Hospital, Server, Check, Mail,
  MapPin, Phone, Globe, ChevronUp, Cpu, Activity,
  Lock, Eye, TrendingUp, Award, Users, LogIn,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Scroll-reveal hook
──────────────────────────────────────────────*/
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ─────────────────────────────────────────────
   Reveal wrapper
──────────────────────────────────────────────*/
function Reveal({
  children, delay = 0, className = "", style: extraStyle,
}: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties; }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section heading
──────────────────────────────────────────────*/
function SectionHeading({ badge, title, subtitle, dark = false }: {
  badge: string; title: React.ReactNode; subtitle: string; dark?: boolean;
}) {
  return (
    <div className="text-center mb-14">
      <Reveal>
        <span className={dark
          ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4"
          : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 mb-4"
        }>{badge}</span>
        <h2 className={`font-display font-bold leading-tight mt-1 ${dark ? "text-white" : "text-slate-900"}`}
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.03em" }}>
          {title}
        </h2>
        <p className={`mt-4 mx-auto text-base leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}
          style={{ maxWidth: 560 }}>
          {subtitle}
        </p>
      </Reveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════*/
export default function Landing() {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [email,      setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    setTimeout(() => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }, 50);
  }, []);

  const navLinks = [
    { label: "About Us",  id: "about"     },
    { label: "Projects",  id: "projects"  },
    { label: "TechniDAQ", id: "technidaq" },
    { label: "Contact",   id: "contact"   },
  ];

  const projects = [
    { name: "Beirut Medical Center",          category: "Healthcare",     Icon: Hospital,  span: "md:row-span-2" },
    { name: "Tier-IV Data Center",            category: "Technology",     Icon: Server,    span: "" },
    { name: "RHI Airport Expansion",          category: "Infrastructure", Icon: Building2, span: "" },
    { name: "Byblos Petrochemical Plant",     category: "Industrial",     Icon: Factory,   span: "" },
    { name: "Smart Grid — Zahle District",    category: "Energy",         Icon: Zap,       span: "" },
    { name: "Luxury Resort — Faraya",         category: "Hospitality",    Icon: Building2, span: "md:row-span-2" },
    { name: "Sidon Industrial Zone",          category: "Manufacturing",  Icon: Factory,   span: "" },
    { name: "AUB Campus Upgrade",             category: "Education",      Icon: Building2, span: "" },
  ];

  const tiers = [
    {
      name: "Cloud Basic", price: "Free", note: "Included with every hardware unit",
      Icon: Cloud, featured: false, cta: "Get Started",
      features: ["Live monitoring dashboard","1-day data retention","Basic CSV export","Email notifications","Single-site access","Standard support"],
    },
    {
      name: "Cloud Pro", price: "$49", note: "per device / month",
      Icon: BarChart3, featured: true, cta: "Start Free Trial",
      features: ["Unlimited cloud data history","Full Excel & PDF reporting","Real-time push & SMS alerts","Remote variable control","Multi-site management","REST API & webhooks"],
    },
    {
      name: "Enterprise Air-Gapped", price: "Custom", note: "On-premise deployment",
      Icon: Shield, featured: false, cta: "Contact Sales",
      features: ["100% offline operation","On-premise server included","AES-256 encrypted database","MID metering compliance","Custom retention policies","Dedicated support engineer"],
    },
  ];

  const capabilities = [
    { Icon: CircuitBoard, title: "LV Switchgear",         desc: "Custom-engineered main distribution boards, MCCs, and ATSs rated up to 6,300 A." },
    { Icon: Cpu,          title: "Industrial Automation", desc: "PLC programming, VFD integration, and intelligent motor management for automated lines." },
    { Icon: Gauge,        title: "Power Quality",         desc: "Capacitor banks, harmonic filters, and power factor correction meeting IEC/BS standards." },
    { Icon: Shield,       title: "Certifications",        desc: "ISO 9001:2015 certified. Every panel leaves our factory pre-tested and fully documented." },
    { Icon: Factory,      title: "Custom Fabrication",    desc: "In-house busbar fabrication, CNC punching, and powder coating to your exact spec." },
    { Icon: Monitor,      title: "Full Turnkey",          desc: "Engineering, manufacturing, installation, and commissioning — one accountable partner." },
  ];

  const techFeatures = [
    { Icon: Activity,   label: "Real-Time Telemetry" },
    { Icon: Bell,       label: "Smart Alerting"       },
    { Icon: Database,   label: "Data Historian"       },
    { Icon: Eye,        label: "Remote Access"        },
    { Icon: Download,   label: "Reporting Engine"     },
    { Icon: Lock,       label: "Enterprise Security"  },
    { Icon: TrendingUp, label: "Trend Analysis"       },
    { Icon: Monitor,    label: "Web & Mobile UI"      },
  ];

  const S = {
    navH:      scrolled ? 64  : 76,
    navBg:     scrolled ? "rgba(255,255,255,0.96)" : "transparent",
    navBd:     scrolled ? "blur(14px)" : "none",
    navBorder: scrolled ? "1px solid rgba(226,232,240,0.8)" : "1px solid transparent",
  };

  /* ── Shared link button style for nav ── */
  const loginBtnStyle: React.CSSProperties = {
    marginLeft: 6, padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
    border: "1.5px solid #e2e8f0", color: "#334155", background: "#fff",
    cursor: "pointer", textDecoration: "none",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "all 0.2s",
  };

  return (
    <>
      {/* ══════ GLOBAL STYLES ══════ */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;overflow-x:hidden;font-family:'Inter',system-ui,sans-serif;color:#1e293b;background:#fff;-webkit-font-smoothing:antialiased}
        #root{width:100%;min-height:100svh}
        .font-display{font-family:'Plus Jakarta Sans','Inter',sans-serif}
        ::selection{background:rgba(37,99,235,0.15);color:#1e3a8a}
      `}</style>

      {/* ══════ NAVIGATION ══════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: S.navBg, backdropFilter: S.navBd,
        borderBottom: S.navBorder,
        boxShadow: scrolled ? "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: S.navH, transition: "height 0.3s ease" }}>

            {/* Logo */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.025em", color: "#0f172a" }}>
                Technicat<span style={{ color: "#2563eb" }}>Group</span>
              </span>
            </button>

            {/* Desktop nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden-mobile">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                  color: "#475569", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "none"; }}
                >{l.label}</button>
              ))}

              {/* Client Log In */}
              <Link to="/login" style={loginBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#334155"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <LogIn size={14} /> Client Log In
              </Link>

              {/* Get a Quote */}
              <button onClick={() => scrollTo("contact")} style={{
                marginLeft: 4, padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "#2563eb", color: "#fff", border: "none", cursor: "pointer",
                boxShadow: "0 0 0 1px rgba(37,99,235,0.1),0 4px 20px rgba(37,99,235,0.2)",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.15),0 8px 30px rgba(37,99,235,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.1),0 4px 20px rgba(37,99,235,0.2)"; }}
              >
                Get a Quote <ArrowRight size={14} />
              </button>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen((o) => !o)} className="show-mobile"
              style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#334155", display: "none" }}
              aria-label="Toggle menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #f1f5f9", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 24px 16px" }}>
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                  color: "#334155", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#334155"; }}
                >{l.label}</button>
              ))}
              {/* Mobile: Client Log In */}
              <Link to="/login" style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                marginTop: 6, padding: "11px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "1.5px solid #e2e8f0", color: "#2563eb", background: "#eff6ff",
                textDecoration: "none", transition: "all 0.15s", boxSizing: "border-box",
              }}>
                <LogIn size={14} /> Client Log In
              </Link>
              <button onClick={() => scrollTo("contact")} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                width: "100%", marginTop: 8, padding: "12px 20px", borderRadius: 10,
                fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff",
                border: "none", cursor: "pointer",
              }}>
                Get a Quote <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media(min-width:768px){.show-mobile{display:none!important}}
        @media(max-width:767px){.hidden-mobile{display:none!important}}
      `}</style>

      <main>
        {/* ══════ HERO ══════ */}
        <section style={{
          paddingTop: 140, paddingBottom: 96,
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 65% -10%, rgba(37,99,235,0.07) 0%, transparent 65%),
            linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "auto, 56px 56px, 56px 56px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.25), transparent)" }} />

          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,500px),1fr))", gap: 64, alignItems: "center" }}>
              {/* Copy */}
              <div>
                <Reveal>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", marginBottom: 20 }}>
                    <Award size={12} /> ISO 9001 Certified Manufacturer
                  </span>
                </Reveal>
                <Reveal delay={0.08}>
                  <h1 className="font-display" style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.12, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
                    Next-Generation LV<br />Panel Boards &amp;{" "}
                    <span style={{ color: "#2563eb" }}>Industrial Intelligence</span>
                  </h1>
                </Reveal>
                <Reveal delay={0.16}>
                  <p style={{ fontSize: "1.05rem", color: "#64748b", lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
                    From precision-engineered low-voltage switchgear to edge-to-cloud SCADA monitoring —
                    Technicat Group delivers manufacturing excellence and real-time data intelligence for
                    critical infrastructure across the Middle East and beyond.
                  </p>
                </Reveal>
                <Reveal delay={0.24}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                    <button onClick={() => scrollTo("about")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "1.5px solid #e2e8f0", color: "#334155", background: "#fff", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#334155"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      Explore Manufacturing <ChevronRight size={14} />
                    </button>
                    <button onClick={() => scrollTo("technidaq")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 0 0 1px rgba(37,99,235,0.15),0 4px 20px rgba(37,99,235,0.25)", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.2),0 8px 30px rgba(37,99,235,0.35)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.15),0 4px 20px rgba(37,99,235,0.25)"; }}>
                      Discover TechniDAQ <ArrowRight size={14} />
                    </button>
                  </div>
                </Reveal>
                <Reveal delay={0.32}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(226,232,240,0.7)" }}>
                    {[{ n: "500+", l: "Panels Delivered" }, { n: "12+", l: "Years Experience" }, { n: "99.9%", l: "Uptime SLA" }, { n: "40+", l: "Active Sites" }].map((s) => (
                      <div key={s.l}>
                        <p className="font-display" style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>{s.n}</p>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Hero visual */}
              <Reveal delay={0.1}>
                <div style={{ position: "relative" }}>
                  <div style={{ aspectRatio: "4/3", borderRadius: 20, overflow: "hidden", background: "linear-gradient(135deg,#e8eef6 0%,#dce6f0 40%,#c9d9ea 100%)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 6px rgba(0,0,0,0.03),0 20px 50px rgba(0,0,0,0.09)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8", position: "relative" }}>
                    <Factory size={52} strokeWidth={1} style={{ color: "rgba(37,99,235,0.35)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>LV Panel Board Assembly</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Replace with high-quality photo</span>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#2563eb,#60a5fa)" }} />
                  </div>
                  {/* Floating — live status */}
                  <div style={{ position: "absolute", bottom: -16, left: -20, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 16, background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.04),0 10px 40px rgba(0,0,0,0.1)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Activity size={17} style={{ color: "#2563eb" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>Live Monitoring</p>
                      <p style={{ fontSize: 11, color: "#22c55e", margin: 0, fontWeight: 500 }}>● All Systems Normal</p>
                    </div>
                  </div>
                  {/* Floating — power factor */}
                  <div style={{ position: "absolute", top: -16, right: -16, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 16, background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.04),0 10px 40px rgba(0,0,0,0.1)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TrendingUp size={17} style={{ color: "#16a34a" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>Power Factor</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0 }}>0.98 <span style={{ color: "#16a34a", fontWeight: 500, fontSize: 11 }}>↑ Optimised</span></p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════ ABOUT / CAPABILITIES ══════ */}
        <section id="about" style={{ padding: "96px 0", background: "#f8fafc" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading badge="About Us" title={<>Engineering Excellence <br />Since Day One</>}
              subtitle="Technicat Group specialises in the design, fabrication, and commissioning of low-voltage electrical distribution systems for mission-critical environments." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 20 }}>
              {capabilities.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.07}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)", height: "100%", transition: "all 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.03),0 12px 40px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#f1f5f9"; }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <c.Icon size={21} style={{ color: "#2563eb" }} />
                    </div>
                    <h3 className="font-display" style={{ fontWeight: 600, fontSize: "1rem", color: "#0f172a", margin: "0 0 8px" }}>{c.title}</h3>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,220px),1fr))", gap: 16, marginTop: 40 }}>
                {[
                  { label: "Panel Assembly Line", Icon: Factory      },
                  { label: "Quality Testing Lab", Icon: Gauge        },
                  { label: "Busbar Fabrication",  Icon: CircuitBoard },
                  { label: "Dispatch & Logistics",Icon: Building2    },
                ].map((item, i) => (
                  <div key={item.label} className="factory-img-wrap" style={{ aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: `linear-gradient(135deg,hsl(${215+i*8},28%,${90-i*2}%) 0%,hsl(${220+i*5},22%,${84-i*2}%) 100%)`, border: "1px solid rgba(226,232,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "default" }}
                    onMouseEnter={(e) => { const o = e.currentTarget.querySelector<HTMLElement>(".factory-overlay"); if (o) o.style.opacity = "1"; }}
                    onMouseLeave={(e) => { const o = e.currentTarget.querySelector<HTMLElement>(".factory-overlay"); if (o) o.style.opacity = "0"; }}>
                    <item.Icon size={30} strokeWidth={1.2} style={{ color: "rgba(37,99,235,0.28)" }} />
                    <div className="factory-overlay" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "12px", background: "linear-gradient(transparent,rgba(15,23,42,0.65))", opacity: 0, transition: "opacity 0.3s" }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════ PROJECTS ══════ */}
        <section id="projects" style={{ padding: "96px 0", background: "#fff" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading badge="Portfolio" title="Trusted by Critical Industries"
              subtitle="From hospitals to data centres, our panels power the infrastructure that cannot afford to fail." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,200px),1fr))", gap: 16, gridAutoRows: 160 }}>
              {projects.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.05} className={p.span} style={p.span ? { gridRow: "span 2" } : undefined}>
                  <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: "100%", cursor: "pointer", background: `linear-gradient(135deg,hsl(${215+i*7},22%,${90-i*2}%),hsl(${220+i*5},18%,${85-i*2}%))`, border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)", transition: "transform 0.3s,box-shadow 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.04),0 12px 40px rgba(0,0,0,0.1)"; const o = e.currentTarget.querySelector<HTMLElement>(".proj-overlay"); if (o) o.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"; const o = e.currentTarget.querySelector<HTMLElement>(".proj-overlay"); if (o) o.style.opacity = "0"; }}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p.Icon size={42} strokeWidth={0.9} style={{ color: "rgba(100,116,139,0.25)" }} />
                    </div>
                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.85)", color: "#475569", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.7)" }}>{p.category}</span>
                    </div>
                    <div className="proj-overlay" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, background: "rgba(15,23,42,0.84)", backdropFilter: "blur(2px)", opacity: 0, transition: "opacity 0.3s" }}>
                      <p.Icon size={22} style={{ color: "#60a5fa", marginBottom: 10 }} />
                      <h4 className="font-display" style={{ fontWeight: 600, fontSize: 13, color: "#fff", margin: "0 0 6px", lineHeight: 1.4 }}>{p.name}</h4>
                      <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 500 }}>{p.category}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <div style={{ marginTop: 36, textAlign: "center" }}>
                <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "1.5px solid #e2e8f0", color: "#334155", background: "#fff", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#334155"; e.currentTarget.style.background = "#fff"; }}>
                  View All Projects <ChevronRight size={14} />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════ TECHNIDAQ ══════ */}
        <section id="technidaq" style={{ padding: "112px 0", background: "#0f172a", backgroundImage: `radial-gradient(ellipse 60% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: "auto, 56px 56px, 56px 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>
            <SectionHeading badge="Software Platform" title={<>TechniDAQ: Edge-to-Cloud <span style={{ color: "#60a5fa" }}>SCADA</span></>}
              subtitle="Monitor, control, and analyse your entire electrical infrastructure in real time — from a single panel to enterprise-wide multi-site deployments." dark />
            <Reveal delay={0.05}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,170px),1fr))", gap: 12, marginBottom: 56 }}>
                {techFeatures.map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                    <f.Icon size={16} style={{ color: "#60a5fa", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 20 }}>
              {tiers.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.1}>
                  <div style={{ position: "relative", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20, height: "100%", background: t.featured ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.03)", border: t.featured ? "1.5px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.08)", boxShadow: t.featured ? "0 0 0 1px rgba(37,99,235,0.15),0 8px 40px rgba(37,99,235,0.12)" : "none", transition: "all 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                    {t.featured && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)" }}>
                        <span style={{ padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#2563eb", color: "#fff", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>Most Popular</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: t.featured ? 8 : 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: t.featured ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.07)" }}>
                        <t.Icon size={19} style={{ color: t.featured ? "#93c5fd" : "rgba(255,255,255,0.5)" }} />
                      </div>
                      <h3 className="font-display" style={{ fontWeight: 600, fontSize: "0.95rem", color: "#fff", margin: 0 }}>{t.name}</h3>
                    </div>
                    <div>
                      <span className="font-display" style={{ fontWeight: 800, fontSize: "1.9rem", color: "#fff", letterSpacing: "-0.03em" }}>{t.price}</span>
                      {t.note && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, marginBottom: 0 }}>{t.note}</p>}
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                      {t.features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                          <Check size={14} style={{ color: t.featured ? "#60a5fa" : "rgba(255,255,255,0.28)", flexShrink: 0, marginTop: 1 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => scrollTo("contact")} style={{ width: "100%", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "all 0.2s", ...(t.featured ? { background: "#2563eb", color: "#fff", border: "none", boxShadow: "0 0 0 1px rgba(37,99,235,0.2),0 4px 20px rgba(37,99,235,0.2)" } : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }) }}
                      onMouseEnter={(e) => { if (t.featured) { e.currentTarget.style.background = "#1d4ed8"; } else { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; } }}
                      onMouseLeave={(e) => { if (t.featured) { e.currentTarget.style.background = "#2563eb"; } else { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}>
                      {t.cta} <ArrowRight size={13} />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.15}>
              <div style={{ marginTop: 56, borderRadius: 18, padding: "24px 32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Monitor size={26} style={{ color: "#60a5fa" }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p className="font-display" style={{ fontWeight: 600, fontSize: "1rem", color: "#fff", margin: "0 0 4px" }}>Try the Live Demo</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>Experience the TechniDAQ interface with a simulated data stream — no account required.</p>
                </div>
                {/* Route to /dashboard directly for the live demo */}
                <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, padding: "11px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.25)", transition: "all 0.2s", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  Open Demo Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════ NEWSLETTER & CONTACT ══════ */}
        <section id="contact" style={{ padding: "96px 0", background: "#f8fafc" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: 40, alignItems: "start" }}>
              <Reveal>
                <div style={{ background: "#fff", borderRadius: 20, padding: "40px", border: "1px solid #f1f5f9", boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Mail size={21} style={{ color: "#2563eb" }} />
                  </div>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1.2rem", color: "#0f172a", margin: "0 0 8px" }}>Stay in the Loop</h3>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: "0 0 24px" }}>Subscribe for industry insights, product updates, and exclusive TechniDAQ feature releases.</p>
                  {subscribed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <Check size={17} style={{ color: "#16a34a", flexShrink: 0 }} />
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#15803d", margin: 0 }}>You're subscribed! We'll be in touch soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{ flex: 1, minWidth: 180, padding: "11px 16px", borderRadius: 10, fontSize: 14, border: "1.5px solid #e2e8f0", color: "#0f172a", background: "#f8fafc", outline: "none", transition: "border-color 0.2s,box-shadow 0.2s" }}
                        onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; }}
                        onBlur={(e) =>  { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                      <button type="submit" style={{ padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.2)", transition: "all 0.2s", whiteSpace: "nowrap" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}>Subscribe</button>
                    </form>
                  )}
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, marginBottom: 0 }}>No spam, ever. Unsubscribe at any time.</p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div style={{ paddingTop: 4 }}>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1.5rem", color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.025em" }}>Get in Touch</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: "0 0 28px" }}>Ready to discuss your next project? Our engineering team is here to help design the right power distribution and SCADA solution for your facility.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                    {[
                      { Icon: MapPin, text: "Baabda, Mount Lebanon, Lebanon" },
                      { Icon: Phone,  text: "+961 XX XXX XXX" },
                      { Icon: Mail,   text: "info@technicatgroup.com" },
                      { Icon: Globe,  text: "www.technicatgroup.com" },
                    ].map((c) => (
                      <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                          <c.Icon size={15} style={{ color: "#2563eb" }} />
                        </div>
                        <span style={{ fontSize: 14, color: "#475569" }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.location.href = "mailto:info@technicatgroup.com"} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.2)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <Users size={15} /> Request a Quotation
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: "#0f172a", color: "#fff", padding: "56px 0 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,180px),1fr))", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Zap size={14} color="#fff" strokeWidth={2.5} />
                </div>
                <span className="font-display" style={{ fontWeight: 700, fontSize: "0.95rem" }}>Technicat<span style={{ color: "#60a5fa" }}>Group</span></span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, margin: "0 0 12px" }}>Precision-engineered LV power distribution and industrial intelligence software.</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", display: "block" }}>ISO 9001:2015 Certified</span>
            </div>
            {[
              { title: "Products",  links: ["LV Switchgear", "Motor Control Centers", "ATS Systems", "TechniDAQ"] },
              { title: "Company",   links: ["About Us", "Projects", "Careers", "Contact"] },
              { title: "Resources", links: ["Documentation", "Support Portal", "API Reference", "Status Page"] },
            ].map((col) => (
              <div key={col.title}>
                <h5 className="font-display" style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>{col.title}</h5>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>&copy; {new Date().getFullYear()} Technicat Group. All rights reserved. Baabda, Lebanon.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══════ SCROLL-TO-TOP ══════ */}
      {scrolled && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 40, width: 40, height: 40, borderRadius: "50%", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(37,99,235,0.15),0 8px 30px rgba(37,99,235,0.3)", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
          <ChevronUp size={18} />
        </button>
      )}
    </>
  );
}
