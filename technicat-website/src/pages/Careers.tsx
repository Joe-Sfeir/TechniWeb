import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap, ArrowRight, CircuitBoard, Monitor, Gauge, Award,
  ChevronUp, Menu, X, Check, Linkedin,
  Mail, MapPin, Users,
} from "lucide-react";

const ROLES = ["Electrical Engineer", "SCADA Developer", "Technician", "Internship"] as const;
type Role = typeof ROLES[number];

const OPEN_ROLES: { title: Role; dept: string; type: string; Icon: React.ElementType; accent: string; desc: string }[] = [
  { title: "Electrical Engineer", dept: "Engineering", type: "Full-time", Icon: CircuitBoard, accent: "#2563eb",
    desc: "Design and commission LV distribution systems, MDBs, MCCs, and ATS units for mission-critical clients." },
  { title: "SCADA Developer",    dept: "Software",     type: "Full-time", Icon: Monitor,      accent: "#7c3aed",
    desc: "Build and extend TechniDAQ — our edge-to-cloud SCADA platform — using modern web and embedded tech." },
  { title: "Technician",         dept: "Field Ops",    type: "Full-time", Icon: Gauge,        accent: "#0891b2",
    desc: "Install, test, and commission electrical panels and monitoring hardware at client sites across Lebanon." },
  { title: "Internship",         dept: "Various",      type: "Part-time / Seasonal", Icon: Award, accent: "#16a34a",
    desc: "Gain hands-on experience in LV panel manufacturing and SCADA systems alongside our engineering team." },
];

export default function Careers() {
  const dark = false;
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [form,      setForm]      = useState({ name: "", email: "", role: ROLES[0] as string, letter: "" });
  const [fileName,  setFileName]  = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Job Application: ${form.role} — ${form.name}`);
    const body = encodeURIComponent([
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Role: ${form.role}`,
      ``,
      `Cover Letter:`,
      form.letter,
      ``,
      `──────────────────────────────────────────`,
      `IMPORTANT: Please attach your CV/Resume file to this email before sending.`,
    ].join("\r\n"));
    window.location.href = `mailto:joesfeir007@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: "1.5px solid var(--t-border)", color: "var(--t-fg)", background: "var(--t-input)",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-muted)",
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
  };

  const navH        = scrolled ? 64 : 72;
  const navScrolled = scrolled ? "var(--t-nav)" : "transparent";
  const navBorder   = scrolled ? "1px solid var(--t-nav-border)" : "1px solid transparent";
  const navShadow   = scrolled ? (dark ? "0 1px 2px rgba(0,0,0,0.3),0 4px 16px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)") : "none";

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
        .careers-input::placeholder{color:var(--t-muted2)}
      `}</style>

      {/* ══════ NAVBAR ══════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled, backdropFilter: scrolled ? "blur(14px)" : "none",
        border: navBorder, boxShadow: navShadow, transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: navH, transition: "height 0.3s ease" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.025em", color: "var(--t-fg)" }}>
                Technicat<span style={{ color: "#2563eb" }}>Group</span>
              </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hidden-mobile">
              <Link to="/" style={{ fontSize: 14, fontWeight: 500, color: "var(--t-fg3)", textDecoration: "none", padding: "8px 14px", borderRadius: 10, transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "var(--t-blue-tint)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t-fg3)"; e.currentTarget.style.background = "none"; }}>
                ← Back to Home
              </Link>
              <a href="mailto:joesfeir007@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Technicat%20Group" style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 10,
                fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none",
                cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.2)", transition: "all 0.2s",
                textDecoration: "none",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
                Get a Quote <ArrowRight size={14} />
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="show-mobile">
              <button onClick={() => setMenuOpen((o) => !o)} style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--t-fg2)" }}>
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>
        {menuOpen && (
          <div style={{ background: "var(--t-card)", borderTop: "1px solid var(--t-border2)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 24px 16px" }}>
              <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "var(--t-fg2)", textDecoration: "none" }}>
                ← Back to Home
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ══════ HERO ══════ */}
        <section style={{
          paddingTop: 140, paddingBottom: 80,
          backgroundImage: dark
            ? `radial-gradient(ellipse 70% 50% at 50% -5%, rgba(37,99,235,0.14) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`
            : `radial-gradient(ellipse 70% 50% at 50% -5%, rgba(37,99,235,0.07) 0%, transparent 60%), linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)`,
          backgroundSize: "auto, 56px 56px, 56px 56px",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.25), transparent)" }} />
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", marginBottom: 24 }}>
              ● We're Hiring
            </span>
            <h1 className="font-display" style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 800, color: "var(--t-fg)", lineHeight: 1.12, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
              Build What Matters.<br />
              <span style={{ color: "#2563eb" }}>Join Technicat Group.</span>
            </h1>
            <p style={{ fontSize: "1.05rem", color: "var(--t-muted)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
              We are engineers, developers, and technicians who design the electrical backbone of Lebanon's critical infrastructure — and build the software intelligence that runs on top of it.
            </p>
            <a href="#apply" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12,
              fontSize: 15, fontWeight: 700, background: "#2563eb", color: "#fff", border: "none",
              cursor: "pointer", boxShadow: "0 0 0 1px rgba(37,99,235,0.15),0 8px 30px rgba(37,99,235,0.25)",
              transition: "all 0.2s", textDecoration: "none",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Apply Now <ArrowRight size={16} />
            </a>
          </div>
        </section>

        {/* ══════ OPEN ROLES ══════ */}
        <section style={{ padding: "80px 0", background: "var(--t-bg2)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2rem)", color: "var(--t-fg)", letterSpacing: "-0.03em", margin: "0 0 12px" }}>Open Positions</h2>
              <p style={{ fontSize: 14, color: "var(--t-muted)", margin: 0 }}>Click a role to pre-fill your application below.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))", gap: 16 }}>
              {OPEN_ROLES.map((r) => {
                const isHighlighted = highlight === r.title;
                return (
                  <button key={r.title} onClick={() => { setHighlight(r.title); setForm((f) => ({ ...f, role: r.title })); document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" }); }} style={{
                    borderRadius: 16, padding: "22px 22px", textAlign: "left", cursor: "pointer",
                    background: isHighlighted ? `${r.accent}12` : "var(--t-card)",
                    border: `1.5px solid ${isHighlighted ? r.accent + "45" : "var(--t-border)"}`,
                    boxShadow: isHighlighted ? `0 0 0 3px ${r.accent}15` : "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={(e) => { if (!isHighlighted) { e.currentTarget.style.borderColor = r.accent + "45"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                    onMouseLeave={(e) => { if (!isHighlighted) { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; } }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${r.accent}18`, border: `1.5px solid ${r.accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <r.Icon size={20} style={{ color: r.accent }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: `${r.accent}15`, color: r.accent, border: `1px solid ${r.accent}30`, letterSpacing: "0.07em", textTransform: "uppercase" as const }}>{r.type}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t-muted2)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>{r.dept}</div>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--t-fg)", marginBottom: 8 }}>{r.title}</div>
                    <p style={{ fontSize: 12, color: "var(--t-muted)", lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════ APPLICATION FORM ══════ */}
        <section id="apply" style={{ padding: "80px 0", background: "var(--t-bg)" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2rem)", color: "var(--t-fg)", letterSpacing: "-0.03em", margin: "0 0 12px" }}>Apply Now</h2>
              <p style={{ fontSize: 14, color: "var(--t-muted)", margin: 0 }}>Fill in your details. Your email client will open with a pre-written application — remember to attach your CV before sending.</p>
            </div>

            {submitted && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 24 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>📎</span>
                <div>
                  <p style={{ fontWeight: 600, color: "#b45309", margin: "0 0 4px", fontSize: 14 }}>Email client opened!</p>
                  <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>Please <strong>attach your CV / Resume</strong> to the email before clicking Send.</p>
                </div>
              </div>
            )}

            <div style={{ background: "var(--t-card)", borderRadius: 20, padding: "36px 36px", border: "1px solid var(--t-border2)", boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      className="careers-input"
                      type="text" required placeholder="John Smith"
                      value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      className="careers-input"
                      type="email" required placeholder="john@company.com"
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Position Applying For</label>
                  <select
                    value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Cover Letter</label>
                  <textarea
                    className="careers-input"
                    required rows={6}
                    placeholder="Tell us about yourself, your experience, and why you want to join Technicat Group..."
                    value={form.letter} onChange={(e) => setForm((f) => ({ ...f, letter: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                    onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; }}
                    onBlur={(e) => { e.target.style.borderColor = dark ? "#334155" : "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                </div>

                <div>
                  <label style={labelStyle}>CV / Resume</label>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                    border: "1.5px dashed var(--t-border)", background: "var(--t-bg2)", cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "#334155" : "#e2e8f0"; }}>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }}
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--t-blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={16} style={{ color: "#2563eb" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-fg2)", margin: 0 }}>
                        {fileName ?? "Click to upload CV / Resume"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--t-muted2)", margin: 0 }}>PDF, DOC, DOCX</p>
                    </div>
                  </label>
                  <p style={{ fontSize: 11, color: "var(--t-muted2)", marginTop: 6, marginBottom: 0 }}>
                    Your email client will open — attach this file before sending.
                  </p>
                </div>

                <button type="submit" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 0 0 1px rgba(37,99,235,0.2),0 8px 30px rgba(37,99,235,0.3)",
                  transition: "all 0.2s", marginTop: 4,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.25),0 12px 40px rgba(37,99,235,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.2),0 8px 30px rgba(37,99,235,0.3)"; }}>
                  {submitted ? <><Check size={16} /> Application Sent — Attach Your CV!</> : <>Submit Application <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: "#0f172a", color: "#fff", padding: "40px 0 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={14} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                Technicat<span style={{ color: "#60a5fa" }}>Group</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[
                { Icon: MapPin,   text: "New Rawda, Beirut, Lebanon" },
                { Icon: Mail,     text: "joesfeir007@gmail.com", href: "mailto:joesfeir007@gmail.com" },
              ].map((c) => (
                <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                  <c.Icon size={13} />
                  {c.href ? <a href={c.href} style={{ color: "rgba(255,255,255,0.38)", textDecoration: "none" }}>{c.text}</a> : c.text}
                </div>
              ))}
              <a href="https://www.linkedin.com/company/technicat-group/about/?viewAsMember=true" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>
                <Linkedin size={13} /> LinkedIn
              </a>
            </div>
          </div>
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>&copy; {new Date().getFullYear()} Technicat Group. All rights reserved.</p>
            <Link to="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>← Back to Home</Link>
          </div>
        </div>
      </footer>

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
