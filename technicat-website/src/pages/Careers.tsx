import React, { useRef, useEffect, type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircuitBoard,
  Monitor,
  Gauge,
  Award,
  Users,
  Check
} from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { BackgroundGrid } from '../components/BackgroundGrid';

gsap.registerPlugin(ScrollTrigger);

const Magnetic = ({ children, className }: { children: ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * 0.4);
      yTo(y * 0.4);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
};

const RevealText = ({ children, className }: { children: ReactNode, className?: string }) => {
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!textRef.current) return;

    gsap.fromTo(textRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 85%",
        }
      }
    );
  }, []);

  return <div ref={textRef} className={className}>{children}</div>;
};

const ROLES = ["Electrical Engineer", "SCADA Developer", "Technician", "Internship"] as const;
type Role = typeof ROLES[number];

const OPEN_ROLES: { title: Role; dept: string; type: string; Icon: React.ElementType; desc: string }[] = [
  { title: "Electrical Engineer", dept: "Engineering", type: "Full-time", Icon: CircuitBoard,
    desc: "Design and commission LV distribution systems, MDBs, MCCs, and ATS units for mission-critical clients." },
  { title: "SCADA Developer",    dept: "Software",     type: "Full-time", Icon: Monitor,
    desc: "Build and extend TechniDAQ — our edge-to-cloud SCADA platform — using modern web and embedded tech." },
  { title: "Technician",         dept: "Field Ops",    type: "Full-time", Icon: Gauge,
    desc: "Install, test, and commission electrical panels and monitoring hardware at client sites across Lebanon." },
  { title: "Internship",         dept: "Various",      type: "Part-time / Seasonal", Icon: Award,
    desc: "Gain hands-on experience in LV panel manufacturing and SCADA systems alongside our engineering team." },
];

export default function Careers() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [form,      setForm]      = useState({ name: "", email: "", role: ROLES[0] as string, letter: "" });
  const [fileName,  setFileName]  = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  useGSAP(() => {
    gsap.fromTo(".role-card",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".roles-grid", start: "top 80%" }
      }
    );
  }, { scope: mainRef });

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

  return (
    <div ref={mainRef} className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-blue/30 overflow-hidden relative">

      <BackgroundGrid />

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-brand-black/80 backdrop-blur-xl border-b border-white/5">
        <Magnetic>
          <Link to="/" className="flex items-center space-x-4 cursor-pointer">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center font-black text-lg tracking-tighter shadow-[0_0_20px_rgba(26,95,255,0.4)] rounded-xl">TG</div>
            <span className="font-bold tracking-[0.15em] text-sm uppercase">Technicat</span>
          </Link>
        </Magnetic>
        <div className="hidden lg:flex items-center space-x-8 xl:space-x-12 text-xs font-bold tracking-[0.15em] text-zinc-400 uppercase">
          <Magnetic><a href="/#identity" className="hover:text-white transition-colors block py-2">Identity</a></Magnetic>
          <Magnetic><a href="/#manufacturing" className="hover:text-white transition-colors block py-2">Manufacturing</a></Magnetic>
          <Magnetic><Link to="/projects" className="hover:text-white transition-colors block py-2">Projects</Link></Magnetic>
          <Magnetic><a href="/#technidaq" className="hover:text-brand-blue transition-colors block py-2">Software</a></Magnetic>
          <Magnetic><Link to="/careers" className="text-white transition-colors block py-2">Careers</Link></Magnetic>
        </div>
        <div className="flex items-center space-x-4">
          <Magnetic>
            <Link to="/login" className="px-4 py-4 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:text-white transition-colors block">
              Portal
            </Link>
          </Magnetic>
          <Magnetic>
            <button className="px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase bg-white text-black hover:bg-brand-blue hover:text-white transition-colors rounded-xl">
              Contact
            </button>
          </Magnetic>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-24 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <RevealText>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-[1px] bg-brand-blue"></div>
              <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">Careers</h2>
            </div>
          </RevealText>
          <RevealText>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase drop-shadow-2xl mb-8 leading-[0.9]">
              Build What <br/>
              <span className="text-brand-blue drop-shadow-[0_0_40px_rgba(26,95,255,0.4)]">Matters.</span>
            </h1>
          </RevealText>
          <RevealText>
            <p className="text-xl md:text-3xl text-zinc-300 font-medium leading-[1.6] max-w-4xl">
              We are engineers, developers, and technicians who design the electrical backbone of Lebanon's critical infrastructure — and build the software intelligence that runs on top of it.
            </p>
          </RevealText>
          <RevealText>
            <div className="mt-12">
              <Magnetic>
                <a href="#apply" className="inline-flex items-center px-10 py-5 bg-brand-blue text-white text-sm font-bold tracking-[0.15em] uppercase rounded-xl hover:bg-blue-600 transition-colors shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-3" />
                </a>
              </Magnetic>
            </div>
          </RevealText>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-brand-black/50 backdrop-blur-md roles-grid">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Open Positions</h2>
            <p className="text-zinc-400 text-lg">Click a role to pre-fill your application below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OPEN_ROLES.map((r) => {
              const isHighlighted = highlight === r.title;
              return (
                <div key={r.title} className="role-card opacity-0 translate-y-10">
                  <button
                    onClick={() => {
                      setHighlight(r.title);
                      setForm((f) => ({ ...f, role: r.title }));
                      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full text-left p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                      isHighlighted
                        ? 'bg-brand-blue/10 border-brand-blue shadow-[0_0_30px_rgba(37,99,235,0.15)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-[40px] rounded-full group-hover:bg-brand-blue/20 transition-colors duration-700"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                          isHighlighted ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue' : 'bg-white/5 border-white/10 text-zinc-400 group-hover:text-brand-blue group-hover:border-brand-blue/30'
                        }`}>
                          <r.Icon size={24} />
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-[0.15em] uppercase border ${
                          isHighlighted ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}>
                          {r.type}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">{r.dept}</div>
                      <h3 className={`text-2xl font-black tracking-tighter uppercase mb-4 transition-colors ${
                        isHighlighted ? 'text-brand-blue' : 'text-white'
                      }`}>{r.title}</h3>
                      <p className="text-zinc-400 leading-relaxed">{r.desc}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="apply" className="relative z-10 py-32 border-t border-white/5 bg-brand-black">
        <div className="max-w-3xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Apply Now</h2>
            <p className="text-zinc-400 text-lg">Fill in your details. Your email client will open with a pre-written application — remember to attach your CV before sending.</p>
          </div>

          {submitted && (
            <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
              <span className="text-2xl">📎</span>
              <div>
                <p className="text-amber-500 font-bold mb-1">Email client opened!</p>
                <p className="text-amber-500/80 text-sm">Please <strong>attach your CV / Resume</strong> to the email before clicking Send.</p>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[80px] rounded-full"></div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">Full Name</label>
                  <input
                    type="text" required placeholder="John Smith"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">Email Address</label>
                  <input
                    type="email" required placeholder="john@company.com"
                    value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">Position Applying For</label>
                <select
                  value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all appearance-none cursor-pointer"
                >
                  {ROLES.map((r) => <option key={r} value={r} className="bg-brand-black text-white">{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">Cover Letter</label>
                <textarea
                  required rows={6}
                  placeholder="Tell us about yourself, your experience, and why you want to join Technicat Group..."
                  value={form.letter} onChange={(e) => setForm((f) => ({ ...f, letter: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all resize-y min-h-[150px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">CV / Resume</label>
                <label className="flex items-center gap-4 p-5 rounded-xl border border-dashed border-white/20 bg-black/30 hover:bg-white/5 hover:border-brand-blue/50 cursor-pointer transition-all group">
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-brand-blue/10 group-hover:text-brand-blue group-hover:border-brand-blue/30 transition-colors">
                    <Users size={20} className="text-zinc-400 group-hover:text-brand-blue transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      {fileName ?? "Click to upload CV / Resume"}
                    </p>
                    <p className="text-xs text-zinc-500">PDF, DOC, DOCX</p>
                  </div>
                </label>
                <p className="text-xs text-zinc-500 mt-3">
                  Your email client will open — attach this file before sending.
                </p>
              </div>

              <Magnetic>
                <button type="submit" className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-brand-blue text-white text-sm font-bold tracking-[0.15em] uppercase rounded-xl hover:bg-blue-600 transition-colors shadow-[0_0_30px_rgba(37,99,235,0.3)] mt-4">
                  {submitted ? <><Check size={18} /> Application Sent — Attach Your CV!</> : <>Submit Application <ArrowRight size={18} /></>}
                </button>
              </Magnetic>
            </form>
          </div>
        </div>
      </section>

<footer className="bg-brand-black relative z-10 border-t border-white/5 pt-32 pb-12">
  <div className="max-w-7xl mx-auto px-8">
    <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row items-center justify-between text-xs font-bold tracking-[0.15em] text-zinc-600 uppercase">
      <div className="flex items-center space-x-4 mb-6 md:mb-0">
        <div className="w-8 h-8 bg-brand-blue flex items-center justify-center text-white text-sm rounded-xl">TG</div>
        <span>&copy; 2026 Technicat Group</span>
      </div>
      <div className="flex space-x-8">
        <Magnetic><a href="#" className="hover:text-white transition-colors p-2">LinkedIn</a></Magnetic>
        <Magnetic><a href="#" className="hover:text-white transition-colors p-2">Privacy</a></Magnetic>
        <Magnetic><a href="#" className="hover:text-white transition-colors p-2">Terms</a></Magnetic>
      </div>
    </div>
  </div>
</footer>
</div>
);
}
