import { useRef, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Server, Zap, MapPin, Mail, ChevronRight, BarChart3, ShieldCheck, Phone, Linkedin, Activity } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

import { BackgroundGrid } from '../components/BackgroundGrid';


// Magnetic effect for buttons and links
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

// Text Reveal for better reading experience
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

const projects = [
  { id: 1, title: 'Facility Alpha', category: 'MDB Integration', spec: '12,000A System' },
  { id: 2, title: 'District Cooling', category: 'HVAC Control', spec: 'Redundant PLC' },
  { id: 3, title: 'Data Center Omega', category: 'Power Monitoring', spec: 'Tier IV ATS' },
];

export default function Landing() {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnFrame = useRef<number>(-1);

  const [activeProject, setActiveProject] = useState(projects[0].id);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loadProgress, setLoadProgress] = useState(0);
  const [barVisible, setBarVisible] = useState(true);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const overlaysContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawFrame = (frameIndex: number, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !img.complete || img.naturalWidth === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth = canvas.width, drawHeight = canvas.height, offsetX = 0, offsetY = 0;
    if (imgRatio > canvasRatio) {
      drawWidth = canvas.height * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    } else {
      drawHeight = canvas.width / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastDrawnFrame.current = frameIndex;
  };

  useEffect(() => {
    if (loadProgress >= 165) {
      const t = setTimeout(() => setBarVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [loadProgress]);

  useEffect(() => {
    if (isMobile) return;
    const TOTAL = 165;
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL);

    const loadFrame = (i: number) => {
      const img = new Image();
      const frameNumber = i.toString().padStart(4, '0');
      img.onload = () => {
        loadedCount++;
        setLoadProgress(loadedCount);
        if (i === 1 && canvasRef.current) drawFrame(0, canvasRef.current, img);
      };
      img.src = `/frame_${frameNumber}.webp`;
      images[i - 1] = img;
    };

    // Priority: frame 1 first, then keyframes at 25/50/75/100%, then the rest
    const priority = [1, 42, 83, 124, 165];
    const prioritySet = new Set(priority);
    priority.forEach(loadFrame);
    for (let i = 1; i <= TOTAL; i++) {
      if (!prioritySet.has(i)) loadFrame(i);
    }

    imagesRef.current = images;
    return () => { imagesRef.current = []; };
  }, [isMobile]);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        if (!heroRef.current) return;

        const section = heroRef.current;
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;

        let progress = (scrollY - sectionTop) / (sectionHeight - viewportHeight);
        progress = Math.max(0, Math.min(1, progress));

        // Scrub canvas frames with scroll (desktop)
        if (!isMobile) {
          const canvas = canvasRef.current;
          const images = imagesRef.current;
          if (canvas && images.length > 0) {
            const frameIndex = Math.min(images.length - 1, Math.floor(progress * images.length));
            if (lastDrawnFrame.current !== frameIndex) {
              // Find nearest loaded frame at or before target
              let drawIndex = frameIndex;
              while (drawIndex > 0 && !images[drawIndex]?.complete) drawIndex--;
              if (images[drawIndex]?.complete && lastDrawnFrame.current !== drawIndex) {
                drawFrame(drawIndex, canvas, images[drawIndex]);
              }
            }
          }
        }

        // TEXT ANIMATION MATH (Cinematic Reveal)
        const titleProgress = Math.max(0, Math.min(1, (progress - 0.85) / 0.15));
        const easeOutQuart = 1 - Math.pow(1 - titleProgress, 4);

        const subProgress = Math.max(0, Math.min(1, (progress - 0.88) / 0.12));
        const subEase = 1 - Math.pow(1 - subProgress, 4);

        if (textOverlayRef.current) {
          textOverlayRef.current.style.display = progress > 0.8 ? "flex" : "none";
        }

        if (glowRef.current) {
          glowRef.current.style.opacity = `${easeOutQuart * 0.5}`;
          glowRef.current.style.transform = `translate(-50%, -50%) scale(${0.8 + easeOutQuart * 0.2})`;
        }

        if (titleRef.current) {
          titleRef.current.style.opacity = `${easeOutQuart}`;
          titleRef.current.style.transform = `scale(${1.2 - easeOutQuart * 0.2}) translateY(${(1 - easeOutQuart) * 40}px)`;
          titleRef.current.style.filter = `blur(${(1 - easeOutQuart) * 15}px)`;
        }

        if (subtitleRef.current) {
          subtitleRef.current.style.opacity = `${subEase}`;
          subtitleRef.current.style.transform = `translateY(${(1 - subEase) * 20}px)`;
          subtitleRef.current.style.letterSpacing = `${0.1 + (1 - subEase) * 0.2}em`;
          subtitleRef.current.style.filter = `blur(${(1 - subEase) * 10}px)`;
        }

        if (scrollIndicatorRef.current) {
          const indicatorOpacity = 1 - Math.max(0, Math.min(1, progress / 0.05));
          scrollIndicatorRef.current.style.opacity = `${indicatorOpacity}`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  useGSAP(() => {
    // 2. Bento Grid Animation
    gsap.fromTo(".bento-item",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: "#manufacturing", start: "top 70%" }
      }
    );

    // 3. Image Parallax
    gsap.utils.toArray('.parallax-img').forEach((img: any) => {
      gsap.to(img, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    // 4. Projects Row Animation
    gsap.fromTo(".project-row",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: "#projects", start: "top 70%" }
      }
    );

    // 5. Dashboard UI Animation
    gsap.fromTo(".stat-bar",
      { height: "0%" },
      {
        height: (_: number, el: Element) => (el as HTMLElement).dataset.height + "%",
        duration: 2,
        stagger: 0.15,
        ease: "expo.out",
        scrollTrigger: { trigger: ".dashboard-ui", start: "top 80%" }
      }
    );

  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-blue/30 relative">

      {/* Thin loading progress bar */}
      {!isMobile && barVisible && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${(loadProgress / 165) * 100}%`,
          height: "3px",
          background: "#1a5fff",
          zIndex: 9999,
          transition: "width 0.2s ease, opacity 0.5s ease",
          opacity: loadProgress >= 165 ? 0 : 1,
          pointerEvents: "none",
        }} />
      )}

      {/* Background Grid - Replaces the custom cursor and particles */}
      <BackgroundGrid />

      {/* NAVIGATION - Premium & Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-brand-black/80 backdrop-blur-xl border-b border-white/5">
        <Magnetic>
          <div className="flex items-center space-x-4 cursor-pointer">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center font-black text-lg tracking-tighter shadow-[0_0_20px_rgba(26,95,255,0.4)] rounded-xl">TG</div>
            <span className="font-bold tracking-[0.15em] text-sm uppercase">Technicat</span>
          </div>
        </Magnetic>
        <div className="hidden lg:flex items-center space-x-8 xl:space-x-12 text-xs font-bold tracking-[0.15em] text-zinc-400 uppercase">
          <Magnetic><a href="#identity" className="hover:text-white transition-colors block py-2">Identity</a></Magnetic>
          <Magnetic><a href="#manufacturing" className="hover:text-white transition-colors block py-2">Manufacturing</a></Magnetic>
          <Magnetic><Link to="/projects" className="hover:text-white transition-colors block py-2">Projects</Link></Magnetic>
          <Magnetic><a href="#technidaq" className="hover:text-brand-blue transition-colors block py-2">Software</a></Magnetic>
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

      {/* 1. HERO - Full Page Scroll-Driven Assembly */}
      <section ref={heroRef} style={{ height: "400vh", position: "relative" }}>
        {/* Video/Canvas Container (Blended) */}
        <div
          ref={videoContainerRef}
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 1,
            marginTop: "0"
          }}
        >
          {isMobile ? (
            <video
              ref={videoRef}
              src="/panel-assembly.mp4"
              muted
              playsInline
              preload="auto"
              autoPlay
              loop
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          )}
        </div>

        {/* Overlays Container (Normal) */}
        <div
          ref={overlaysContainerRef}
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 2,
            marginTop: "-100vh"
          }}
        >
          {/* Dark gradient overlay for text readability */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent 60%, rgba(0,0,0,0.8) 100%)",
          }}></div>

          {/* Fade-in overlay text */}
          <div
            ref={textOverlayRef}
            style={{
              position: "absolute",
              inset: 0,
              display: "none",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30
            }}
          >
            {/* Cinematic Glow */}
            <div
              ref={glowRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vw] max-w-[1000px] max-h-[500px] bg-brand-blue/40 blur-[100px] rounded-[100%] pointer-events-none"
              style={{ willChange: "opacity, transform" }}
            ></div>

            <h1
              ref={titleRef}
              className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(3.5rem, 10vw, 8rem)",
                letterSpacing: "-0.02em",
                margin: 0,
                textTransform: "uppercase",
                willChange: "transform, opacity, filter",
                lineHeight: 1.1,
                textAlign: "center",
                textShadow: "0 10px 30px rgba(0,0,0,0.5)"
              }}
            >
              Technicat Group
            </h1>
            <p
              ref={subtitleRef}
              style={{
                fontSize: "clamp(0.8rem, 1.5vw, 1.2rem)",
                color: "#88ccff",
                marginTop: "24px",
                fontWeight: 700,
                textTransform: "uppercase",
                willChange: "transform, opacity, filter, letter-spacing",
                textShadow: "0 0 20px rgba(26,95,255,0.5)"
              }}
            >
              Edge-to-Cloud Power Intelligence
            </p>
          </div>

          {/* Scroll down indicator */}
          <div
            ref={scrollIndicatorRef}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              willChange: "opacity"
            }}
          >
            <span style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase"
            }}>Scroll</span>
            <div style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)"
            }}></div>
          </div>
        </div>
      </section>

      {/* 2. IDENTITY - Glassmorphic Cards */}
      <section id="identity" className="relative z-10 bg-brand-black border-t border-white/5 py-32 md:py-40">
        <div className="max-w-7xl mx-auto px-8 mb-24">
          <RevealText>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-[1px] bg-brand-blue"></div>
              <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">01 / Identity</h2>
            </div>
          </RevealText>
          <RevealText>
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-medium tracking-tight text-white mb-8 max-w-4xl">
              We engineer the <span className="text-brand-blue font-bold">nervous system</span> of modern infrastructure.
            </h2>
          </RevealText>
        </div>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[80px] rounded-full group-hover:bg-brand-blue/30 transition-colors duration-700"></div>
               <div className="relative z-10">
                 <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase mb-8">
                   Forged in<br/>Lebanon.<br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-blue-400">
                     Powering<br/>the future.
                   </span>
                 </h3>
               </div>
            </div>
            <div className="flex-1 flex flex-col gap-8">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex-1 flex items-center hover:bg-white/10 transition-colors duration-500">
                <p className="text-xl md:text-3xl text-zinc-300 font-medium leading-[1.6]">
                  Technicat Group was founded on a singular principle: <span className="text-white font-bold">uncompromising reliability</span> in power distribution.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex-1 flex items-center hover:bg-white/10 transition-colors duration-500">
                <p className="text-xl md:text-3xl text-zinc-300 font-medium leading-[1.6]">
                  We don't just assemble panels; we architect the central nervous system of modern industrial facilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MANUFACTURING - Bento Grid */}
      <section id="manufacturing" className="relative z-10 bg-transparent border-t border-white/5 py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center space-x-4 mb-16">
            <div className="w-12 h-[1px] bg-brand-blue"></div>
            <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">02 / Manufacturing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Feature */}
            <div className="bento-item md:col-span-2 md:row-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 relative overflow-hidden group flex flex-col justify-end hover:bg-white/10 transition-all duration-500">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 blur-[100px] rounded-full group-hover:bg-brand-blue/20 transition-colors duration-700"></div>
              <Server className="w-24 h-24 text-brand-blue mb-8 opacity-50 group-hover:opacity-100 transition-opacity duration-500 absolute top-12 right-12" />
              <div className="relative z-10">
                <h4 className="text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase">Bespoke<br/>Architecture</h4>
                <p className="text-xl text-zinc-400 leading-[1.6] max-w-xl">
                  Every facility has unique power demands. We design bespoke distribution architectures from the ground up, ensuring exact alignment with your operational requirements.
                </p>
              </div>
            </div>

            {/* Image Placeholder 1 */}
            <div className="bento-item bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-0 relative overflow-hidden group">
              <img
                src="https://picsum.photos/seed/manufacturing1/600/600"
                alt="Manufacturing Process"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none"></div>
            </div>

            {/* Small Feature 1 */}
            <div className="bento-item bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/10 transition-all duration-500 flex flex-col justify-between">
              <Zap className="w-12 h-12 text-brand-blue mb-4" />
              <div>
                <h4 className="text-2xl font-bold mb-3 uppercase tracking-tight">Precision Assembly</h4>
                <p className="text-zinc-400 leading-relaxed">Meticulously hand-assembled and wired by master technicians, guaranteeing zero-compromise quality.</p>
              </div>
            </div>

            {/* Small Feature 2 */}
            <div className="bento-item bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/10 transition-all duration-500 flex flex-col justify-between">
              <ShieldCheck className="w-12 h-12 text-brand-blue mb-4" />
              <div>
                <h4 className="text-2xl font-bold mb-3 uppercase tracking-tight">Rigorous Validation</h4>
                <p className="text-zinc-400 leading-relaxed">Exhaustive stress testing and simulation to ensure absolute reliability under extreme conditions.</p>
              </div>
            </div>

            {/* Image Placeholder 2 */}
            <div className="bento-item md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-0 relative overflow-hidden group">
              <img
                src="https://picsum.photos/seed/manufacturing2/1200/400"
                alt="Factory Floor"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROJECTS - Interactive Accordion / List */}
      <section id="projects" className="py-40 bg-brand-black relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div>
              <RevealText>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-[1px] bg-brand-blue"></div>
                  <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">03 / Deployments</h2>
                </div>
              </RevealText>
              <RevealText>
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Systems in Action.</h3>
              </RevealText>
            </div>
            <RevealText>
              <Magnetic>
                <Link to="/projects" className="group inline-flex items-center space-x-3 text-sm font-bold tracking-[0.15em] uppercase text-white hover:text-brand-blue transition-colors pb-2 border-b border-white/20 hover:border-brand-blue p-4">
                  <span>View All Projects</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
            </RevealText>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-white/10 pt-12">
            <div className="lg:col-span-7 flex flex-col">
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  onMouseEnter={() => setActiveProject(project.id)}
                  className={`project-row group relative border-b border-white/10 py-10 md:py-12 cursor-pointer overflow-hidden transition-colors duration-500 ${activeProject === project.id ? 'bg-white/5' : ''}`}
                >
                  <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
                    <div className="flex items-center gap-6 md:gap-10">
                      <span className={`text-xl font-mono transition-colors duration-300 ${activeProject === project.id ? 'text-brand-blue' : 'text-zinc-600 group-hover:text-white/50'}`}>
                        0{i + 1}
                      </span>
                      <h3 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase transition-colors duration-300 drop-shadow-lg ${activeProject === project.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                        {project.title}
                      </h3>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 text-left md:text-right">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-1">Category</div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${activeProject === project.id ? 'text-brand-blue' : 'text-zinc-400 group-hover:text-white'}`}>{project.category}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-1">Spec</div>
                        <div className={`text-sm font-mono transition-colors duration-300 ${activeProject === project.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{project.spec}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="sticky top-32 h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 bg-brand-black/50 backdrop-blur-sm shadow-2xl">
                {projects.map((project) => (
                  <img
                    key={project.id}
                    src={`https://picsum.photos/seed/industrial${project.id}/800/1000`}
                    alt={project.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] ${activeProject === project.id ? 'opacity-100 scale-100 mix-blend-normal' : 'opacity-0 scale-105 mix-blend-luminosity'}`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="text-white">
                    <div className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase mb-2">Featured Deployment</div>
                    <div className="text-2xl font-bold">{projects.find(p => p.id === activeProject)?.title}</div>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRANSITION MOMENT - Hardware to Software */}
      <section className="min-h-screen bg-transparent relative z-10 overflow-hidden flex flex-col items-center justify-center py-32">
        {/* Electric Blue Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8 text-center relative z-10 w-full">
          <RevealText>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-500 mb-12">
              Hardware is only half the equation.
            </h2>
          </RevealText>
          <RevealText>
            <div className="w-[2px] h-32 bg-gradient-to-b from-transparent via-brand-blue to-transparent mx-auto my-16"></div>
          </RevealText>
          <RevealText>
            <h2 className="text-[12vw] md:text-[10vw] leading-[0.85] font-black tracking-tighter uppercase text-white drop-shadow-[0_0_40px_rgba(26,95,255,0.4)] mb-8">
              Techni<span className="text-brand-blue">DAQ</span>
            </h2>
          </RevealText>
          <RevealText>
            <p className="text-xl md:text-3xl text-zinc-300 font-medium tracking-[0.2em] uppercase">
              The Intelligence Layer.
            </p>
          </RevealText>
        </div>
      </section>

      {/* 6. TECHNIDAQ REVEAL */}
      <section id="technidaq" className="py-32 bg-brand-black relative z-10 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-8 md:left-16 flex items-center space-x-4">
          <div className="w-12 h-[1px] bg-brand-blue"></div>
          <div className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">04 / Software</div>
        </div>

        <div className="relative z-10 w-full max-w-7xl px-8 mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-brand-blue/10 border border-brand-blue/30 rounded-full px-4 py-2 mb-8 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></div>
                <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">Live Telemetry</span>
              </div>
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] uppercase mb-8">
                Total System<br/>Control.
              </h3>
              <p className="text-xl md:text-2xl text-zinc-300 font-medium leading-[1.6] mb-12">
                Real-time analytics. Predictive maintenance. Monitor your entire facility's power infrastructure from a single pane of glass.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:bg-white/10 transition-colors">
                  <div className="text-4xl font-black text-white mb-2">99.9%</div>
                  <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Uptime</div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:bg-white/10 transition-colors">
                  <div className="text-4xl font-black text-brand-blue mb-2">&lt;1ms</div>
                  <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Latency</div>
                </div>
              </div>
            </div>

            {/* Glassmorphic Dashboard UI */}
            <div className="dashboard-ui relative w-full aspect-square md:aspect-[4/3] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-brand-blue/20 to-transparent opacity-50"></div>

              {/* Fake UI Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-xs font-mono text-zinc-500">SYSTEM.STATUS: NOMINAL</div>
              </div>

              {/* Fake UI Body */}
              <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)] relative z-10">
                <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute top-4 left-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">Load</div>
                  <div className="flex items-end space-x-2 h-32">
                    {[40, 70, 45, 90, 60, 85, 50].map((height, i) => (
                      <div
                        key={i}
                        data-height={height}
                        className="stat-bar flex-1 bg-gradient-to-t from-brand-blue/80 to-brand-blue/20 rounded-t-md relative group-hover:from-brand-blue group-hover:to-brand-blue/40 transition-colors duration-500"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col justify-center items-center relative">
                  <div className="absolute top-4 left-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">Efficiency</div>
                  <div className="w-32 h-32 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin-slow"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">94%</div>
                </div>
                <div className="col-span-2 bg-black/40 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
                  <div className="absolute top-4 left-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">Active Alerts</div>
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-zinc-300 font-medium">Phase A Voltage</span>
                      <span className="text-green-400 font-mono">Stable</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-zinc-300 font-medium">Thermal Sensor 04</span>
                      <span className="text-brand-blue font-mono">Optimal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-32 text-center mb-24">
            <RevealText>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-[1px] bg-brand-blue"></div>
                <h2 className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">Deployment</h2>
                <div className="w-12 h-[1px] bg-brand-blue"></div>
              </div>
            </RevealText>
            <RevealText>
              <h3 className="text-5xl md:text-6xl font-bold tracking-tight">Software Tiers.</h3>
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto mb-24">
            {/* Local Core */}
            <RevealText className="h-full">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 h-full flex flex-col hover:bg-white/10 transition-colors rounded-3xl cursor-pointer">
                <h4 className="text-2xl font-bold mb-4">Local Core</h4>
                <p className="text-zinc-400 text-base mb-10 leading-relaxed">On-premise SCADA integration for single facilities.</p>
                <div className="text-4xl font-bold mb-12 tracking-tight">$X,XXX</div>
                <ul className="space-y-5 text-zinc-300 font-medium mt-auto text-sm">
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> Local HMI Setup</li>
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> Basic Data Logging</li>
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> Standard Support</li>
                </ul>
              </div>
            </RevealText>

            {/* Cloud Pro (Featured) */}
            <RevealText className="h-full z-10">
              <div className="relative p-[2px] bg-gradient-to-b from-brand-blue via-brand-blue/50 to-transparent shadow-[0_0_60px_rgba(26,95,255,0.15)] transform md:-translate-y-6 rounded-3xl h-full cursor-pointer">
                <div className="bg-black/40 backdrop-blur-2xl p-12 h-full relative overflow-hidden flex flex-col rounded-[22px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[60px]"></div>
                  <div className="absolute top-6 right-6 bg-brand-blue text-white text-xs font-bold px-3 py-1 uppercase tracking-[0.15em] rounded-full">
                    Recommended
                  </div>
                  <h4 className="text-2xl font-bold mb-4 text-white">Cloud Pro</h4>
                  <p className="text-zinc-400 text-base mb-10 leading-relaxed">Full cloud telemetry and predictive maintenance.</p>
                  <div className="text-4xl font-bold mb-12 text-brand-blue tracking-tight">$XX,XXX</div>
                  <ul className="space-y-5 text-zinc-200 font-medium mt-auto text-sm">
                    <li className="flex items-center"><BarChart3 className="w-4 h-4 mr-4 text-brand-blue"/> Multi-site Dashboard</li>
                    <li className="flex items-center"><ShieldCheck className="w-4 h-4 mr-4 text-brand-blue"/> Predictive Alerts</li>
                    <li className="flex items-center"><Activity className="w-4 h-4 mr-4 text-brand-blue"/> 24/7 Priority Support</li>
                  </ul>
                  <button className="w-full mt-10 bg-brand-blue text-white py-4 font-bold tracking-[0.15em] uppercase text-xs hover:bg-blue-600 transition-colors rounded-xl">
                    Deploy Cloud Pro
                  </button>
                </div>
              </div>
            </RevealText>

            {/* Enterprise */}
            <RevealText className="h-full">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 h-full flex flex-col hover:bg-white/10 transition-colors rounded-3xl cursor-pointer">
                <h4 className="text-2xl font-bold mb-4">Enterprise</h4>
                <p className="text-zinc-400 text-base mb-10 leading-relaxed">Custom architecture for national grids & heavy industry.</p>
                <div className="text-4xl font-bold mb-12 tracking-tight">Custom</div>
                <ul className="space-y-5 text-zinc-300 font-medium mt-auto text-sm">
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> Custom API Integration</li>
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> Dedicated Engineer</li>
                  <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-4 text-brand-blue"/> White-label Options</li>
                </ul>
              </div>
            </RevealText>
          </div>

          <div className="text-center">
            <RevealText>
              <button className="group relative inline-flex items-center justify-center px-8 py-4 font-bold tracking-[0.15em] text-white uppercase text-sm overflow-hidden rounded-xl bg-brand-blue/10 border border-brand-blue/30 hover:bg-brand-blue/20 transition-colors">
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Request Demo Inquiry</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </RevealText>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="py-40 bg-transparent relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <RevealText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">The Grid Dispatch.</h2>
          </RevealText>
          <RevealText>
            <p className="text-zinc-400 mb-12 text-lg md:text-xl font-normal leading-[1.8] max-w-2xl mx-auto">
              Subscribe to our monthly technical writings. Breakthroughs in power distribution, SCADA architecture, and project deep-dives.
            </p>
          </RevealText>
          <RevealText>
            <form className="flex flex-col sm:flex-row gap-0 max-w-xl mx-auto border border-white/10 focus-within:border-brand-blue transition-colors rounded-2xl overflow-hidden shadow-2xl" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="engineer@company.com"
                className="flex-1 bg-white/5 backdrop-blur-xl px-6 py-5 text-base text-white focus:outline-none placeholder:text-zinc-500"
              />
              <button className="bg-white text-black px-10 py-5 font-bold tracking-[0.15em] uppercase text-xs hover:bg-brand-blue hover:text-white transition-colors">
                Subscribe
              </button>
            </form>
          </RevealText>
        </div>
      </section>

      {/* 9. CONTACT + FOOTER */}
      <footer className="bg-brand-black relative z-10 border-t border-white/5 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-32">
            <div>
              <RevealText>
                <h2 className="text-4xl font-bold tracking-tight mb-12">Initiate Contact.</h2>
              </RevealText>
              <div className="space-y-8">
                <RevealText>
                  <Magnetic className="inline-block cursor-pointer">
                    <div className="flex items-start space-x-6 group p-4 -ml-4">
                      <MapPin className="w-6 h-6 text-brand-blue mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold uppercase tracking-[0.15em] text-xs mb-2 text-white">Headquarters</div>
                        <div className="text-zinc-400 text-base leading-relaxed">Beirut, Lebanon<br/>Industrial District</div>
                      </div>
                    </div>
                  </Magnetic>
                </RevealText>
                <RevealText>
                  <Magnetic className="inline-block cursor-pointer">
                    <div className="flex items-start space-x-6 group p-4 -ml-4">
                      <Mail className="w-6 h-6 text-brand-blue mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold uppercase tracking-[0.15em] text-xs mb-2 text-white">Email</div>
                        <div className="text-zinc-400 text-base leading-relaxed">systems@technicat.com</div>
                      </div>
                    </div>
                  </Magnetic>
                </RevealText>
                <RevealText>
                  <Magnetic className="inline-block cursor-pointer">
                    <div className="flex items-start space-x-6 group p-4 -ml-4">
                      <Phone className="w-6 h-6 text-brand-blue mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold uppercase tracking-[0.15em] text-xs mb-2 text-white">Direct Line</div>
                        <div className="text-zinc-400 text-base leading-relaxed">+961 1 123 456</div>
                      </div>
                    </div>
                  </Magnetic>
                </RevealText>
                <RevealText>
                  <Magnetic className="inline-block cursor-pointer">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-start space-x-6 group p-4 -ml-4">
                      <Linkedin className="w-6 h-6 text-brand-blue mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold uppercase tracking-[0.15em] text-xs mb-2 text-white">LinkedIn</div>
                        <div className="text-zinc-400 text-base leading-relaxed">Connect with us</div>
                      </div>
                    </a>
                  </Magnetic>
                </RevealText>
              </div>
            </div>

            <div className="flex flex-col justify-end md:items-end w-full">
              <RevealText>
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 w-full max-w-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-brand-blue/10 to-transparent opacity-50 pointer-events-none"></div>
                  <h3 className="text-xl font-bold tracking-tight mb-8 text-white">Direct Inquiry</h3>
                  <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">First Name</label>
                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm" placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Last Name</label>
                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm" placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Company Email</label>
                      <input type="email" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm" placeholder="engineer@company.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Project Scope</label>
                      <textarea rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm resize-none" placeholder="Brief description of your requirements..."></textarea>
                    </div>
                    <button className="w-full bg-white text-black py-4 font-bold tracking-[0.15em] uppercase text-xs hover:bg-brand-blue hover:text-white transition-colors rounded-xl mt-4 flex items-center justify-center space-x-2 group">
                      <span>Transmit</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </div>
              </RevealText>
            </div>
          </div>

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
