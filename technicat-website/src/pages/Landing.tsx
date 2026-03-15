import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, ChevronRight, ArrowRight,
  Zap, Shield, BarChart3, Factory, Monitor, Cloud,
  Database, Bell, Download, Gauge, CircuitBoard,
  Building2, Hospital, Server, Check, Mail,
  MapPin, Phone, ChevronUp, Cpu, Activity,
  Lock, Eye, TrendingUp, Award, Users, LogIn,
  Sun, Moon, Linkedin,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "", style: extraStyle }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
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

function SectionHeading({ badge, title, subtitle, dark = false }: {
  badge: string; title: React.ReactNode; subtitle: string; dark?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <Reveal>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
          borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 16,
          background: dark ? "rgba(37,99,235,0.12)" : "var(--t-blue-tint)",
          color: dark ? "#60a5fa" : "#2563eb",
          border: dark ? "1px solid rgba(37,99,235,0.25)" : "1px solid #bfdbfe",
        }}>{badge}</span>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontWeight: 700, lineHeight: 1.2,
          display: "block", marginTop: 4,
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.03em",
          color: dark ? "#ffffff" : "var(--t-fg)",
        }}>{title}</h2>
        <p style={{
          marginTop: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto",
          fontSize: "1rem", lineHeight: 1.65,
          color: dark ? "rgba(148,163,184,1)" : "var(--t-muted)",
        }}>{subtitle}</p>
      </Reveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════*/
export default function Landing() {
  const { dark, toggle } = useTheme();
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
    {
      id: "p1", name: "LV Main Distribution Board", location: "Beirut Medical Center",
      category: "Healthcare", type: "LV Panel",
      desc: "3200 A main incomer with 42-way distribution, automatic transfer switch, and real-time TechniDAQ cloud monitoring integration.",
      Icon: Hospital, accent: "#2563eb",
    },
    {
      id: "p2", name: "TechniDAQ Cloud Integration", location: "Tier-IV Data Center, Beirut",
      category: "Technology", type: "SCADA",
      desc: "Real-time monitoring of 48 Schneider PM meters across 4 UPS zones with automated Excel reporting and threshold alerting.",
      Icon: Server, accent: "#0891b2",
    },
    {
      id: "p3", name: "Motor Control Centre (MCC)", location: "Sidon Industrial Zone",
      category: "Manufacturing", type: "LV Panel",
      desc: "Custom 16-feeder MCC with VFD integration, in-house busbar fabrication, and full IEC 61439 factory acceptance testing.",
      Icon: Factory, accent: "#7c3aed",
    },
    {
      id: "p4", name: "Edge-to-Cloud SCADA", location: "Smart Grid — Zahle District",
      category: "Energy", type: "SCADA",
      desc: "Multi-site air-gapped deployment monitoring 6 substations with offline data historian and automated fault reporting.",
      Icon: Zap, accent: "#16a34a",
    },
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
    { Icon: CircuitBoard, title: "LV Switchgear",         desc: "Custom-engineered main distribution boards, MCCs, and ATSs rated up to 6,300 A — designed to BS 61439 and pre-tested in our Beirut factory." },
    { Icon: Cpu,          title: "Industrial Automation", desc: "PLC programming, VFD integration, and intelligent motor management for fully automated production and utility lines." },
    { Icon: Gauge,        title: "Power Quality",         desc: "Capacitor banks, harmonic filters, and power factor correction to IEC/BS standards — protecting your equipment and reducing energy costs." },
    { Icon: Shield,       title: "ISO 9001 Certified",    desc: "ISO 9001:2015 certified quality management. Every panel leaves our factory pre-tested, documented, and ready for immediate commissioning." },
    { Icon: Factory,      title: "Custom Fabrication",    desc: "In-house busbar fabrication, CNC punching, and powder coating. We manufacture to your exact mechanical and electrical specification." },
    { Icon: Monitor,      title: "Full Turnkey",          desc: "Engineering, manufacturing, installation, and commissioning — one accountable partner from design brief to handover certificate." },
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

  const navScrolled = scrolled ? "var(--t-nav)" : "transparent";
  const navBorder   = scrolled ? "1px solid var(--t-nav-border)" : "1px solid transparent";
  const navH        = scrolled ? 64 : 76;
  const navShadow   = scrolled ? (dark ? "0 1px 2px rgba(0,0,0,0.3),0 4px 16px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)") : "none";

  const navBtnStyle: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
    color: "var(--t-fg3)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s",
  };

  const loginBtnStyle: React.CSSProperties = {
    marginLeft: 6, padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
    border: "1.5px solid var(--t-border)", color: "var(--t-fg2)", background: "var(--t-card)",
    cursor: "pointer", textDecoration: "none",
    display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s",
  };

  const toggleBtnStyle: React.CSSProperties = {
    padding: "8px", borderRadius: 10, fontSize: 14,
    border: "1.5px solid var(--t-border)", color: "var(--t-fg3)", background: "var(--t-card)",
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s", marginLeft: 6,
  };

  const DEMO_MAILTO = "mailto:joesfeir007@gmail.com?subject=TechniDAQ%20Demo%20Request&body=Hi%20Technicat%20Team%2C%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20demo%20of%20TechniDAQ.%0D%0A%0D%0AMy%20Name%3A%20%5BPlease%20fill%20in%20your%20name%5D%0D%0ACompany%3A%20%5BPlease%20fill%20in%20your%20company%5D%0D%0APhone%3A%20%5BOptional%5D%0D%0APreferred%20Demo%20Format%3A%20%5BOnline%20%2F%20On-site%5D%0D%0A%0D%0AThank%20you.";
  const QUOTE_MAILTO = "mailto:joesfeir007@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Technicat%20Group&body=Hi%20Technicat%20Team%2C%0D%0A%0D%0AI%20would%20like%20to%20discuss%20a%20project.%0D%0A%0D%0AName%3A%20%0D%0ACompany%3A%20%0D%0AProject%20Description%3A%20%0D%0A%0D%0AThank%20you.";

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;overflow-x:hidden;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        #root{width:100%;min-height:100svh}
        .font-display{font-family:'Plus Jakarta Sans','Inter',sans-serif}
        @media(min-width:768px){.show-mobile{display:none!important}}
        @media(max-width:767px){.hidden-mobile{display:none!important}}
      `}</style>

      {/* ══════ NAVIGATION ══════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled, backdropFilter: scrolled ? "blur(14px)" : "none",
        border: navBorder, boxShadow: navShadow, transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: navH, transition: "height 0.3s ease" }}>

            {/* Logo */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.025em", color: "var(--t-fg)" }}>
                Technicat<span style={{ color: "#2563eb" }}>Group</span>
              </span>
            </button>

            {/* Desktop nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden-mobile">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={navBtnStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t-fg3)"; e.currentTarget.style.background = "none"; }}
                >{l.label}</button>
              ))}
              <Link to="/careers" style={{ ...navBtnStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t-fg3)"; e.currentTarget.style.background = "none"; }}
              >Careers</Link>

              {/* Dark mode toggle */}
              <button onClick={toggle} style={toggleBtnStyle} aria-label="Toggle dark mode"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#94a3b8" : "#475569"; }}>
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Client Log In */}
              <Link to="/login" style={loginBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; e.currentTarget.style.background = dark ? "#1e293b" : "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Get a Quote <ArrowRight size={14} />
              </button>
            </div>

            {/* Mobile toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="show-mobile">
              <button onClick={toggle} style={{ ...toggleBtnStyle, marginLeft: 0 }} aria-label="Toggle dark mode">
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button onClick={() => setMenuOpen((o) => !o)}
                style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--t-fg2)" }}
                aria-label="Toggle menu">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "var(--t-card)", borderTop: "1px solid var(--t-border2)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 24px 16px" }}>
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                  color: "var(--t-fg2)", background: "none", border: "none", cursor: "pointer",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-blue-tint)"; e.currentTarget.style.color = "#2563eb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; }}
                >{l.label}</button>
              ))}
              <Link to="/careers" onClick={() => setMenuOpen(false)} style={{
                display: "block", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: "var(--t-fg2)", textDecoration: "none",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-blue-tint)"; e.currentTarget.style.color = "#2563eb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; }}
              >Careers</Link>
              <Link to="/login" style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                marginTop: 6, padding: "11px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "1.5px solid var(--t-border)", color: "#2563eb", background: "var(--t-blue-tint)",
                textDecoration: "none", boxSizing: "border-box",
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

      <main>
        {/* ══════ HERO ══════ */}
        <section style={{
          paddingTop: 140, paddingBottom: 96,
          backgroundImage: dark ? `
            radial-gradient(ellipse 80% 60% at 65% -10%, rgba(37,99,235,0.12) 0%, transparent 65%),
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)` : `
            radial-gradient(ellipse 80% 60% at 65% -10%, rgba(37,99,235,0.07) 0%, transparent 65%),
            linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)`,
          backgroundSize: "auto, 56px 56px, 56px 56px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.25), transparent)" }} />

          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,500px),1fr))", gap: 64, alignItems: "center" }}>
              {/* Copy */}
              <div>
                <Reveal>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--t-blue-tint)", color: "#2563eb", border: "1px solid #bfdbfe", marginBottom: 20 }}>
                    <Award size={12} /> ISO 9001 Certified Manufacturer
                  </span>
                </Reveal>
                <Reveal delay={0.08}>
                  <h1 className="font-display" style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 800, color: "var(--t-fg)", lineHeight: 1.12, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
                    Next-Generation LV<br />Panel Boards &amp;{" "}
                    <span style={{ color: "#2563eb" }}>Industrial Intelligence</span>
                  </h1>
                </Reveal>
                <Reveal delay={0.16}>
                  <p style={{ fontSize: "1.05rem", color: "var(--t-muted)", lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
                    From precision-engineered low-voltage switchgear to edge-to-cloud SCADA monitoring —
                    Technicat Group delivers manufacturing excellence and real-time data intelligence for
                    critical infrastructure across the Middle East and beyond.
                  </p>
                </Reveal>
                <Reveal delay={0.24}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                    <button onClick={() => scrollTo("about")} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, border: "1.5px solid var(--t-border)", color: "var(--t-fg2)",
                      background: "var(--t-card)", cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; e.currentTarget.style.background = dark ? "#1e293b" : "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      Explore Manufacturing <ChevronRight size={14} />
                    </button>
                    <button onClick={() => scrollTo("technidaq")} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none",
                      cursor: "pointer", boxShadow: "0 0 0 1px rgba(37,99,235,0.15),0 4px 20px rgba(37,99,235,0.25)", transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      Discover TechniDAQ <ArrowRight size={14} />
                    </button>
                  </div>
                </Reveal>
                <Reveal delay={0.32}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--t-border)" }}>
                    {[{ n: "500+", l: "Panels Delivered" }, { n: "12+", l: "Years Experience" }, { n: "99.9%", l: "Uptime SLA" }, { n: "40+", l: "Active Sites" }].map((s) => (
                      <div key={s.l}>
                        <p className="font-display" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--t-fg)", margin: 0, letterSpacing: "-0.03em" }}>{s.n}</p>
                        <p style={{ fontSize: 12, color: "var(--t-muted2)", marginTop: 2 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Hero visual */}
              <Reveal delay={0.1}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    aspectRatio: "4/3", borderRadius: 20, overflow: "hidden",
                    background: dark ? "linear-gradient(135deg,#1e293b 0%,#253447 40%,#1a2535 100%)" : "linear-gradient(135deg,#e8eef6 0%,#dce6f0 40%,#c9d9ea 100%)",
                    border: "1px solid var(--t-border)",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.04),0 20px 50px rgba(0,0,0,0.1)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative",
                  }}>
                    <Factory size={52} strokeWidth={1} style={{ color: "rgba(37,99,235,0.35)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t-muted)" }}>LV Panel Board Assembly</span>
                    <span style={{ fontSize: 11, color: "var(--t-muted2)" }}>Replace with high-quality photo</span>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#2563eb,#60a5fa)" }} />
                  </div>
                  {/* Floating — live status */}
                  <div style={{ position: "absolute", bottom: -16, left: -20, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border2)", boxShadow: "0 4px 6px rgba(0,0,0,0.06),0 10px 40px rgba(0,0,0,0.1)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--t-blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Activity size={17} style={{ color: "#2563eb" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-fg)", margin: 0 }}>Live Monitoring</p>
                      <p style={{ fontSize: 11, color: "#22c55e", margin: 0, fontWeight: 500 }}>● All Systems Normal</p>
                    </div>
                  </div>
                  {/* Floating — power factor */}
                  <div style={{ position: "absolute", top: -16, right: -16, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border2)", boxShadow: "0 4px 6px rgba(0,0,0,0.06),0 10px 40px rgba(0,0,0,0.1)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TrendingUp size={17} style={{ color: "#16a34a" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-fg)", margin: 0 }}>Power Factor</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t-fg)", margin: 0 }}>0.98 <span style={{ color: "#16a34a", fontWeight: 500, fontSize: 11 }}>↑ Optimised</span></p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════ ABOUT / CAPABILITIES ══════ */}
        <section id="about" style={{ padding: "96px 0", background: "var(--t-bg2)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading
              badge="About Us"
              title={<>Premier LV Manufacturer &amp;<br />Edge-to-Cloud Pioneers</>}
              subtitle="Technicat Group designs, fabricates, and commissions low-voltage electrical distribution systems — and builds the software intelligence layer that runs on top of them."
            />

            {/* Story paragraph */}
            <Reveal delay={0.05}>
              <p style={{ fontSize: 15, color: "var(--t-muted)", lineHeight: 1.8, maxWidth: 800, margin: "0 auto 48px", textAlign: "center" }}>
                Founded in Beirut, Technicat Group has grown from a specialist LV panel fabricator into a full-service industrial intelligence company.
                Every panel we manufacture — from main distribution boards and motor control centres to automatic transfer switches — can be connected to{" "}
                <strong style={{ color: "var(--t-fg2)" }}>TechniDAQ</strong>, our proprietary edge-to-cloud SCADA platform, making us the only company in the region offering both the physical hardware and the intelligence layer as a single integrated solution.
              </p>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 20 }}>
              {capabilities.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.07}>
                  <div style={{
                    background: "var(--t-card)", borderRadius: 16, padding: 24,
                    border: "1px solid var(--t-border2)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)",
                    height: "100%", transition: "all 0.3s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05),0 12px 40px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = dark ? "#1e293b" : "#f1f5f9"; }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--t-blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <c.Icon size={21} style={{ color: "#2563eb" }} />
                    </div>
                    <h3 className="font-display" style={{ fontWeight: 600, fontSize: "1rem", color: "var(--t-fg)", margin: "0 0 8px" }}>{c.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--t-muted)", lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
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
                  <div key={item.label} className="factory-img-wrap" style={{
                    aspectRatio: "4/3", borderRadius: 14, overflow: "hidden",
                    background: dark
                      ? `linear-gradient(135deg,hsl(${215+i*8},25%,${18-i}%) 0%,hsl(${220+i*5},20%,${15-i}%) 100%)`
                      : `linear-gradient(135deg,hsl(${215+i*8},28%,${90-i*2}%) 0%,hsl(${220+i*5},22%,${84-i*2}%) 100%)`,
                    border: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "default",
                  }}
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
        <section id="projects" style={{ padding: "96px 0", background: "var(--t-bg)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <SectionHeading
              badge="Portfolio"
              title="Trusted by Critical Industries"
              subtitle="From hospitals to data centres, our panels and SCADA systems power infrastructure that cannot afford to fail."
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,340px),1fr))", gap: 20 }}>
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <div style={{
                    borderRadius: 20, overflow: "hidden",
                    border: "1px solid var(--t-border)",
                    background: "var(--t-card)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)",
                    transition: "all 0.3s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.06),0 16px 48px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"; }}>
                    {/* Card header */}
                    <div style={{
                      padding: "24px 24px 18px",
                      background: `linear-gradient(135deg, ${p.accent}18 0%, ${p.accent}08 100%)`,
                      borderBottom: "1px solid var(--t-border)",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: `${p.accent}20`, border: `1.5px solid ${p.accent}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <p.Icon size={22} style={{ color: p.accent }} />
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                        background: `${p.accent}18`, color: p.accent,
                        border: `1px solid ${p.accent}35`,
                        letterSpacing: "0.08em", textTransform: "uppercase" as const,
                      }}>{p.type}</span>
                    </div>
                    {/* Card body */}
                    <div style={{ padding: "18px 24px 22px" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-muted2)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{p.category}</span>
                      <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--t-fg)", margin: "6px 0 3px", letterSpacing: "-0.02em" }}>{p.name}</h3>
                      <p style={{ fontSize: 12, color: p.accent, fontWeight: 500, margin: "0 0 10px" }}>{p.location}</p>
                      <p style={{ fontSize: 13, color: "var(--t-muted)", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <div style={{ marginTop: 36, textAlign: "center" }}>
                <button onClick={() => scrollTo("contact")} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10,
                  fontSize: 14, fontWeight: 600, border: "1.5px solid var(--t-border)",
                  color: "var(--t-fg2)", background: "var(--t-card)", cursor: "pointer", transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; e.currentTarget.style.background = dark ? "#1e293b" : "#fff"; }}>
                  Discuss a Project <ChevronRight size={14} />
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
                  <p className="font-display" style={{ fontWeight: 600, fontSize: "1rem", color: "#fff", margin: "0 0 4px" }}>Request a Live TechniDAQ Demo</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>See TechniDAQ in action with your own panel data — our engineers will walk you through it live.</p>
                </div>
                <a href={DEMO_MAILTO} style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, padding: "11px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.25)", transition: "all 0.2s", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  Request Demo <ArrowRight size={14} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════ NEWSLETTER & CONTACT ══════ */}
        <section id="contact" style={{ padding: "96px 0", background: "var(--t-bg2)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: 40, alignItems: "start" }}>

              {/* Newsletter */}
              <Reveal>
                <div style={{ background: "var(--t-card)", borderRadius: 20, padding: "40px", border: "1px solid var(--t-border2)", boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--t-blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Mail size={21} style={{ color: "#2563eb" }} />
                  </div>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--t-fg)", margin: "0 0 8px" }}>Stay in the Loop</h3>
                  <p style={{ fontSize: 13, color: "var(--t-muted)", lineHeight: 1.65, margin: "0 0 24px" }}>Subscribe for industry insights, product updates, and exclusive TechniDAQ feature releases.</p>
                  {subscribed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <Check size={17} style={{ color: "#16a34a", flexShrink: 0 }} />
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#15803d", margin: 0 }}>You're subscribed! We'll be in touch soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{ flex: 1, minWidth: 180, padding: "11px 16px", borderRadius: 10, fontSize: 14, border: "1.5px solid var(--t-border)", color: "var(--t-fg)", background: "var(--t-input)", outline: "none", transition: "border-color 0.2s,box-shadow 0.2s" }}
                        onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; }}
                        onBlur={(e) => { e.target.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                      <button type="submit" style={{ padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.2)", transition: "all 0.2s", whiteSpace: "nowrap" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}>Subscribe</button>
                    </form>
                  )}
                  <p style={{ fontSize: 11, color: "var(--t-muted2)", marginTop: 10, marginBottom: 0 }}>No spam, ever. Unsubscribe at any time.</p>
                </div>
              </Reveal>

              {/* Contact info */}
              <Reveal delay={0.1}>
                <div style={{ paddingTop: 4 }}>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--t-fg)", margin: "0 0 12px", letterSpacing: "-0.025em" }}>Get in Touch</h3>
                  <p style={{ fontSize: 14, color: "var(--t-muted)", lineHeight: 1.7, margin: "0 0 28px" }}>Ready to discuss your next project? Our engineering team is here to design the right power distribution and SCADA solution for your facility.</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                    {[
                      { Icon: MapPin,   text: "New Rawda, Beirut, Lebanon",    href: null },
                      { Icon: Phone,    text: "+961 XX XXX XXX",               href: null },
                      { Icon: Mail,     text: "joesfeir007@gmail.com",         href: "mailto:joesfeir007@gmail.com" },
                      { Icon: Linkedin, text: "technicat-group",               href: "https://www.linkedin.com/company/technicat-group/about/?viewAsMember=true" },
                    ].map((c) => (
                      <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--t-card)", border: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                          <c.Icon size={15} style={{ color: "#2563eb" }} />
                        </div>
                        {c.href ? (
                          <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                            style={{ fontSize: 14, color: "#2563eb", textDecoration: "none", transition: "opacity 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                          >{c.text}</a>
                        ) : (
                          <span style={{ fontSize: 14, color: "var(--t-fg3)" }}>{c.text}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <a href={QUOTE_MAILTO} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none",
                      cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.2)", transition: "all 0.2s",
                      textDecoration: "none",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <Users size={15} /> Request a Quote
                    </a>
                    <a href={DEMO_MAILTO} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, background: "var(--t-card)", color: "var(--t-fg2)",
                      border: "1.5px solid var(--t-border)", cursor: "pointer", transition: "all 0.2s",
                      textDecoration: "none",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.color = dark ? "#cbd5e1" : "#334155"; e.currentTarget.style.background = dark ? "#1e293b" : "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <Monitor size={15} /> Request a Demo
                    </a>
                  </div>
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
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, margin: "0 0 12px" }}>Precision-engineered LV power distribution and industrial intelligence software. New Rawda, Beirut, Lebanon.</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", display: "block", marginBottom: 12 }}>ISO 9001:2015 Certified</span>
              <a href="https://www.linkedin.com/company/technicat-group/about/?viewAsMember=true" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>
                <Linkedin size={13} /> LinkedIn
              </a>
            </div>
            {[
              { title: "Products",  links: [
                  { label: "LV Switchgear", href: "#" }, { label: "Motor Control Centers", href: "#" },
                  { label: "ATS Systems", href: "#" },   { label: "TechniDAQ", href: "#" },
              ]},
              { title: "Company",   links: [
                  { label: "About Us", href: "#about" }, { label: "Projects", href: "#projects" },
                  { label: "Careers", href: "/careers", isRoute: true }, { label: "Contact", href: "#contact" },
              ]},
              { title: "Resources", links: [
                  { label: "Documentation", href: "#" }, { label: "Support Portal", href: "#" },
                  { label: "API Reference", href: "#" }, { label: "Status Page", href: "#" },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <h5 className="font-display" style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>{col.title}</h5>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.isRoute ? (
                        <Link to={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>{l.label}</Link>
                      ) : (
                        <a href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>{l.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>&copy; {new Date().getFullYear()} Technicat Group. All rights reserved. New Rawda, Beirut, Lebanon.</p>
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
