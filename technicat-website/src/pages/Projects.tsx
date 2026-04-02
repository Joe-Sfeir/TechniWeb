import React, { useRef, useEffect, type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Zap,
  CircuitBoard,
  Monitor,
  Building2,
  Factory
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

const PROJECTS = [
  {
    id: "mega-factory-alpha",
    title: "Mega Factory Alpha",
    category: "Industrial",
    location: "Riyadh, KSA",
    date: "2023",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000",
    description: "Complete SCADA integration and LV distribution for a 500,000 sq ft manufacturing facility.",
    tags: ["SCADA", "LV Distribution", "Automation"],
    icon: Factory
  },
  {
    id: "data-center-omega",
    title: "Data Center Omega",
    category: "Mission Critical",
    location: "Dubai, UAE",
    date: "2024",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2000",
    description: "Redundant power systems and monitoring for a Tier IV data center.",
    tags: ["ATS", "Power Monitoring", "Redundancy"],
    icon: Monitor
  },
  {
    id: "smart-grid-city",
    title: "Smart Grid City",
    category: "Infrastructure",
    location: "Doha, Qatar",
    date: "2023",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=2000",
    description: "City-wide smart grid implementation with real-time analytics and control.",
    tags: ["Smart Grid", "Analytics", "IoT"],
    icon: Zap
  },
  {
    id: "commercial-tower-x",
    title: "Commercial Tower X",
    category: "Commercial",
    location: "Abu Dhabi, UAE",
    date: "2022",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000",
    description: "Building management system (BMS) and energy optimization for a 50-story tower.",
    tags: ["BMS", "Energy Optimization", "HVAC Control"],
    icon: Building2
  },
  {
    id: "water-treatment-plant",
    title: "Water Treatment Plant",
    category: "Infrastructure",
    location: "Muscat, Oman",
    date: "2024",
    image: "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=2000",
    description: "Automated control systems for a large-scale municipal water treatment facility.",
    tags: ["Process Control", "PLC", "HMI"],
    icon: CircuitBoard
  },
  {
    id: "logistics-hub",
    title: "Automated Logistics Hub",
    category: "Industrial",
    location: "Jeddah, KSA",
    date: "2023",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000",
    description: "Conveyor control and sorting automation for a major e-commerce fulfillment center.",
    tags: ["Automation", "Conveyors", "Sorting"],
    icon: Factory
  }
];

const CATEGORIES = ["All", "Industrial", "Mission Critical", "Infrastructure", "Commercial"];

export default function Projects() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useGSAP(() => {
    gsap.fromTo(".project-card",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".projects-grid", start: "top 80%" }
      }
    );
  }, { scope: mainRef, dependencies: [activeCategory] });

  const filteredProjects = activeCategory === "All"
    ? PROJECTS
    : PROJECTS.filter(p => p.category === activeCategory);

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
          <Magnetic><Link to="/projects" className="text-white transition-colors block py-2">Projects</Link></Magnetic>
          <Magnetic><a href="/#technidaq" className="hover:text-brand-blue transition-colors block py-2">Software</a></Magnetic>
          <Magnetic><Link to="/careers" className="hover:text-white transition-colors block py-2">Careers</Link></Magnetic>
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
              <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">03 / Portfolio</h2>
            </div>
          </RevealText>
          <RevealText>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase drop-shadow-2xl mb-8 leading-[0.9]">
              Systems in <br/>
              <span className="text-brand-blue drop-shadow-[0_0_40px_rgba(26,95,255,0.4)]">Action.</span>
            </h1>
          </RevealText>
          <RevealText>
            <p className="text-xl md:text-3xl text-zinc-300 font-medium leading-[1.6] max-w-4xl">
              Explore our portfolio of mission-critical deployments, industrial automation, and smart infrastructure projects across the region.
            </p>
          </RevealText>
        </div>
      </section>

      {/* FILTER SECTION */}
      <section className="relative z-10 py-12 border-t border-white/5 bg-brand-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-wrap gap-4">
            {CATEGORIES.map(category => (
              <React.Fragment key={category}>
                <Magnetic>
                  <button
                    onClick={() => setActiveCategory(category)}
                    className={`px-8 py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 border ${
                      activeCategory === category
                        ? 'bg-brand-blue text-white border-brand-blue shadow-[0_0_20px_rgba(26,95,255,0.3)]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {category}
                  </button>
                </Magnetic>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS GRID */}
      <section className="relative z-10 py-24 projects-grid">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="project-card opacity-0 translate-y-10">
                <div className="group block bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-colors duration-500 relative h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[80px] rounded-full group-hover:bg-brand-blue/20 transition-colors duration-700"></div>

                  <div className="relative h-80 overflow-hidden border-b border-white/10 shrink-0">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-6 left-6 z-20 flex space-x-2">
                      <span className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl text-[10px] font-bold tracking-[0.15em] uppercase text-white border border-white/10">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-10 relative z-20 flex-1 flex flex-col">
                    <div className="absolute top-0 right-10 -translate-y-1/2 w-16 h-16 bg-brand-black border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-brand-blue group-hover:text-brand-blue transition-colors shadow-2xl">
                      <project.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 group-hover:text-brand-blue transition-colors uppercase">{project.title}</h3>
                    <p className="text-zinc-400 text-lg leading-relaxed mb-8 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-bold tracking-[0.15em] uppercase text-zinc-500 mb-8">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-brand-blue" />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-brand-blue" />
                        <span>{project.date}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
              <p className="text-zinc-500 text-xl font-medium">No projects found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative z-10 py-32 border-t border-white/5 bg-brand-black overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue/5"></div>
        <div className="max-w-7xl mx-auto px-8 relative text-center">
          <RevealText>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8 text-white">
              Ready to <span className="text-brand-blue">Build?</span>
            </h2>
          </RevealText>
          <RevealText>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Partner with Technicat for state-of-the-art industrial automation, SCADA systems, and power distribution solutions.
            </p>
          </RevealText>
          <RevealText>
            <div className="flex justify-center">
              <Magnetic>
                <a href="mailto:contact@technicat.com" className="inline-flex items-center px-10 py-5 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase rounded-xl hover:bg-brand-blue hover:text-white transition-colors">
                  Contact Us
                  <ArrowRight className="w-5 h-5 ml-3" />
                </a>
              </Magnetic>
            </div>
          </RevealText>
        </div>
      </section>

      {/* FOOTER */}
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
