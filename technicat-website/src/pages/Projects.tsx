import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap, ArrowLeft, Hospital, Server, Factory,
  Building2, Gauge, CircuitBoard, Monitor, MapPin,
} from "lucide-react";

/* ─── Scroll reveal ─────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────────── */
const PROJECTS = [
  {
    id: "p1", name: "LV Main Distribution Board",
    location: "Beirut Medical Center", category: "Healthcare", type: "LV Panel",
    year: "2023",
    desc: "3200 A main incomer with 42-way distribution, automatic transfer switch, and real-time TechniDAQ cloud monitoring integration. Designed to IEC 61439-2 and factory-acceptance tested in our Beirut facility before delivery.",
    highlights: ["3200 A main incomer", "42-way distribution", "Automatic transfer switch", "TechniDAQ integration"],
    Icon: Hospital, accent: "#2563eb",
  },
  {
    id: "p2", name: "TechniDAQ Cloud Integration",
    location: "Tier-IV Data Center, Beirut", category: "Technology", type: "SCADA",
    year: "2023",
    desc: "Real-time monitoring of 48 Schneider PM meters across 4 UPS zones with automated Excel reporting and threshold alerting. Deployed fully on-premise with encrypted data historian and remote web access.",
    highlights: ["48 Schneider PM meters", "4 UPS zones", "Automated Excel reporting", "Threshold alerting"],
    Icon: Server, accent: "#0891b2",
  },
  {
    id: "p3", name: "Motor Control Centre (MCC)",
    location: "Sidon Industrial Zone", category: "Manufacturing", type: "LV Panel",
    year: "2022",
    desc: "Custom 16-feeder MCC with VFD integration, in-house busbar fabrication, and full IEC 61439 factory acceptance testing. Includes soft-starter modules and emergency isolation for each feeder.",
    highlights: ["16 feeders", "VFD integration", "IEC 61439 certified", "Emergency isolation"],
    Icon: Factory, accent: "#7c3aed",
  },
  {
    id: "p4", name: "Edge-to-Cloud SCADA",
    location: "Smart Grid — Zahle District", category: "Energy", type: "SCADA",
    year: "2022",
    desc: "Multi-site air-gapped deployment monitoring 6 substations with offline data historian and automated fault reporting. Edge nodes sync to the cloud when connectivity is available, ensuring zero data loss.",
    highlights: ["6 substations", "Air-gapped deployment", "Offline historian", "Zero data loss sync"],
    Icon: Zap, accent: "#16a34a",
  },
  {
    id: "p5", name: "Hospital Power Distribution Upgrade",
    location: "Clemenceau Medical Center", category: "Healthcare", type: "LV Panel",
    year: "2021",
    desc: "Complete LV infrastructure upgrade for a 280-bed hospital. Four new main distribution boards, two ATSs, and full TechniDAQ integration for critical-load monitoring across surgical and ICU floors.",
    highlights: ["4 main distribution boards", "2 ATS units", "Critical-load monitoring", "ICU & surgical coverage"],
    Icon: Hospital, accent: "#e11d48",
  },
  {
    id: "p6", name: "Busbar Trunking System",
    location: "ABC Mall — Verdun, Beirut", category: "Commercial", type: "LV Panel",
    year: "2021",
    desc: "Design, supply, and installation of a 2000 A busbar trunking system for a large-scale retail complex. Includes tap-off boxes at every floor level and integrated power quality measurement.",
    highlights: ["2000 A busbar trunking", "Floor-level tap-offs", "Power quality measurement", "Retail-grade design"],
    Icon: CircuitBoard, accent: "#d97706",
  },
  {
    id: "p7", name: "Industrial Automation System",
    location: "Holcim Cement Plant, Chekka", category: "Industrial", type: "Automation",
    year: "2020",
    desc: "PLC-based automation system for a 6-kiln cement production line. Full VFD control, motor protection relay integration, and SCADA HMI screens for operators.",
    highlights: ["6-kiln PLC automation", "VFD control", "Motor protection relays", "SCADA HMI screens"],
    Icon: Gauge, accent: "#64748b",
  },
  {
    id: "p8", name: "Campus Smart Metering",
    location: "Lebanese American University", category: "Education", type: "SCADA",
    year: "2020",
    desc: "Deployment of TechniDAQ across 12 campus buildings for energy sub-metering, cost allocation, and sustainability reporting. Data feeds directly into the university's energy management dashboard.",
    highlights: ["12 campus buildings", "Energy sub-metering", "Cost allocation", "Sustainability reporting"],
    Icon: Building2, accent: "#0f766e",
  },
  {
    id: "p9", name: "Oil & Gas Facility Panel",
    location: "Offshore Platform — Mediterranean", category: "Energy", type: "LV Panel",
    year: "2019",
    desc: "ATEX-rated LV panels for an offshore oil and gas platform. Designed to withstand marine environments, with stainless-steel enclosures, epoxy-coated busbars, and hazardous-area certifications.",
    highlights: ["ATEX-rated enclosures", "Marine grade design", "Stainless-steel panels", "Hazardous-area certified"],
    Icon: Monitor, accent: "#475569",
  },
];

/* ─── Component ─────────────────────────────────────────────── */
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "LV Panel":   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "SCADA":      { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  "Automation": { bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe" },
};

export default function Projects() {
  const [filter, setFilter] = useState<string>("All");
  const categories = ["All", ...Array.from(new Set(PROJECTS.map((p) => p.type)))];
  const visible = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.type === filter);

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f8fafc}
        .font-display{font-family:'Plus Jakarta Sans','Inter',sans-serif}
      `}</style>

      {/* ── Navbar ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(14px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#475569", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                Technicat<span style={{ color: "#2563eb" }}>Group</span>
              </span>
            </div>
          </div>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none", padding: "7px 16px", borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; }}>
            Client Login
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px 96px" }}>
        {/* Hero */}
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", marginBottom: 16 }}>
              <MapPin size={12} /> Portfolio
            </span>
            <h1 className="font-display" style={{ fontSize: "clamp(1.8rem,3.5vw,2.75rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.035em", margin: "0 0 16px" }}>
              Our Projects
            </h1>
            <p style={{ fontSize: "1rem", color: "#64748b", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
              From hospitals to offshore platforms, Technicat Group has delivered precision-engineered electrical systems across the most demanding industries.
            </p>
          </div>
        </Reveal>

        {/* Filter tabs */}
        <Reveal delay={0.05}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 48 }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: "7px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
                background: filter === cat ? "#2563eb" : "#ffffff",
                color: filter === cat ? "#ffffff" : "#475569",
                border: filter === cat ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                boxShadow: filter === cat ? "0 4px 12px rgba(37,99,235,0.2)" : "none",
              }}>
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,360px),1fr))", gap: 24 }}>
          {visible.map((p, i) => {
            const badge = TYPE_COLORS[p.type] ?? TYPE_COLORS["LV Panel"];
            return (
              <Reveal key={p.id} delay={(i % 3) * 0.06}>
                <div style={{
                  background: "#ffffff", borderRadius: 18, overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)",
                  transition: "all 0.3s", display: "flex", flexDirection: "column",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.06),0 16px 48px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = `${p.accent}40`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                  {/* Card header strip */}
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${p.accent}, ${p.accent}90)` }} />
                  <div style={{ padding: "22px 24px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <p.Icon size={21} style={{ color: p.accent }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{p.type}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.year}</span>
                      </div>
                    </div>
                    {/* Title */}
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{p.category}</span>
                      <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", margin: "4px 0 4px", letterSpacing: "-0.02em" }}>{p.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={11} style={{ color: p.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: p.accent, fontWeight: 500 }}>{p.location}</span>
                      </div>
                    </div>
                    {/* Description */}
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
                    {/* Highlights */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.highlights.map((h) => (
                        <span key={h} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 500 }}>{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal delay={0.1}>
          <div style={{ marginTop: 72, borderRadius: 20, padding: "40px 48px", background: "#0f172a", backgroundImage: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(37,99,235,0.2) 0%, transparent 60%)", textAlign: "center" }}>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(1.4rem,2.5vw,2rem)", color: "#ffffff", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              Have a Project in Mind?
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.65 }}>
              Our engineering team is ready to design the right solution for your facility.
            </p>
            <a href="mailto:joesfeir007@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Technicat%20Group&body=Hi%20Technicat%20Team%2C%0D%0A%0D%0AName%3A%20%0D%0ACompany%3A%20%0D%0AProject%20Description%3A%20%0D%0A%0D%0AThank%20you."
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", textDecoration: "none", boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Contact Our Team →
            </a>
          </div>
        </Reveal>
      </main>
    </>
  );
}
