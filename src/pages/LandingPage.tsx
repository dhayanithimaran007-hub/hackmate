import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowDown, Activity, Check, Users, Zap, Code, Cpu, 
  Globe, Database, Network, Compass, 
  Rocket, AlertCircle
} from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Hero Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  const textShiftX = useTransform(springX, [-1, 1], [-20, 20]);
  const textShiftY = useTransform(springY, [-1, 1], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!heroRef.current) return;
      
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const progress = Math.min(scrollY / 500, 1);
        
        if (heroRef.current) {
          heroRef.current.style.setProperty('--hero-y', `${scrollY * 0.4}px`);
          heroRef.current.style.setProperty('--hero-opacity', `${1 - progress * 1.5}`);
          heroRef.current.style.setProperty('--hero-scale', `${1 + progress * 0.1}`);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-accent/30 selection:text-accent">
      
      {/* Scroll Progress */}
      <motion.div 
        className="fixed left-0 top-0 bottom-0 w-1 bg-accent z-50 origin-top"
        style={{ scaleY }}
      />
      
      {/* Decorative Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern"></div>
      
      {/* 1. HERO SECTION */}
      <main 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="w-full min-h-[90vh] flex flex-col justify-center px-4 md:px-12 z-10 relative overflow-hidden"
        style={{
          transform: 'translateY(var(--hero-y, 0)) scale(var(--hero-scale, 1))',
          opacity: 'var(--hero-opacity, 1)',
          willChange: 'transform, opacity'
        } as React.CSSProperties}
      >
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col justify-center relative z-10">
          
          <div className="flex flex-col items-center md:items-start w-full mb-8 pb-4 text-center md:text-left">
            <motion.h1 
              style={{ x: textShiftX, y: textShiftY }}
              className="heading-hero m-0 p-0 text-foreground relative z-10 cursor-default"
            >
              FIND YOUR <span className="text-accent">TEAM</span><br />
              BUILD THE FUTURE
              {/* Subtle cursor-reactive accent dot */}
              <motion.span 
                className="absolute w-3.5 h-3.5 bg-accent -right-4 bottom-6 opacity-90 hidden sm:inline-block"
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.h1>
            
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl font-sans leading-relaxed">
              HackMate is the developer platform for discovering hackathons, finding compatible teammates, forming teams, and turning ideas into real projects.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto self-center md:self-start mt-2 z-10">
            <Link 
              to="/hackathons/new" 
              className="btn-hero-primary group"
            >
              <span className="group-hover:translate-x-0.5 transition-transform">POST A HACKATHON</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/discover" 
              className="btn-hero-secondary"
            >
              EXPLORE HACKATHONS
            </Link>
          </div>

        </div>
      </main>

      {/* 2. THE PROBLEM */}
      <section className="w-full border-t border-border bg-card py-20 z-20 relative">
        <div className="max-w-screen-xl mx-auto px-4 md:px-12 text-center flex flex-col items-center">
          <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="w-12 h-1 bg-accent mb-6"></motion.div>
          <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.1}} className="heading-section text-muted-foreground">
            Great ideas need <span className="text-foreground">great teams.</span>
          </motion.h2>
        </div>
      </section>

      {/* 3. THE SOLUTION (Product Experience Visualization) */}
      <section className="w-full border-t border-border bg-background py-20 md:py-28 z-20 relative overflow-hidden">

        <div className="max-w-screen-xl mx-auto px-4 md:px-12 flex flex-col items-center relative z-10">
          
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[0.95] tracking-tighter uppercase mb-4 text-foreground">
              THE RIGHT TEAM<br /><span className="text-accent">CHANGES EVERYTHING.</span>
            </h2>
            <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              HackMate helps you build balanced teams by connecting complementary skills, interests, and ambitions.
            </p>
          </div>

          {/* Interactive Visualization */}
          <div className="w-full max-w-4xl border border-border bg-card p-6 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
            
            <div className="flex flex-col items-center relative z-10">
              {/* Step 1: Idea */}
              <motion.div initial={{opacity:0, y:-20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="flex flex-col items-center mb-6">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 font-bold">Your Project Idea</span>
                <div className="px-5 py-2.5 border border-foreground bg-background font-mono text-sm">
                  "AI-Powered Healthcare Assistant"
                </div>
              </motion.div>

              <ArrowDown className="w-5 h-5 text-accent mb-6 opacity-50" />

              {/* Step 2: Matching Engine */}
              <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{delay:0.2}} className="w-full max-w-md p-5 border border-accent bg-accent/5 rounded-none flex flex-col items-center relative overflow-hidden group mb-10">
                <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Network className="w-7 h-7 text-accent mb-3" />
                <h3 className="font-mono text-base font-bold tracking-wider uppercase text-foreground mb-1">HackMate AI Matching</h3>
                <p className="font-mono text-xs text-muted-foreground text-center">Analyzing required capabilities & discovering complementary builders.</p>
              </motion.div>

              {/* Step 3: Skills Formation */}
              <div className="flex flex-wrap justify-center gap-6 w-full mb-10 relative">
                <svg className="absolute inset-0 w-full h-full -top-12 -z-10 opacity-30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 50% 0 Q 20% 50 20% 100" stroke="var(--color-accent)" fill="transparent" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M 50% 0 Q 50% 50 50% 100" stroke="var(--color-accent)" fill="transparent" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M 50% 0 Q 80% 50 80% 100" stroke="var(--color-accent)" fill="transparent" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {[
                  { icon: Cpu, label: "AI / ML" },
                  { icon: Code, label: "Frontend" },
                  { icon: Database, label: "Backend" }
                ].map((skill, idx) => (
                  <motion.div key={idx} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.4 + (idx*0.1)}} className="flex flex-col items-center gap-2.5">
                    <div className="w-14 h-14 border border-border bg-background flex items-center justify-center shadow-md">
                      <skill.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider uppercase">{skill.label}</span>
                  </motion.div>
                ))}
              </div>

              <ArrowDown className="w-5 h-5 text-accent mb-6 opacity-50" />

              {/* Step 4: Outcome */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.7}} className="px-6 py-3 bg-foreground text-background font-mono font-bold tracking-wider uppercase text-xs sm:text-sm">
                BALANCED TEAM FORMED
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEAM INTELLIGENCE DASHBOARD (Product Dashboard Preview) */}
      <section className="w-full border-t border-border bg-card py-20 md:py-28 z-20 relative">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          <div className="flex-1 text-left">
            <div className="font-mono text-xs font-bold tracking-wider text-accent uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> TEAM INTELLIGENCE
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter mb-4">
              Identify the missing link.
            </h2>
            <p className="font-sans text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
              HackMate actively analyzes your project requirements and your current team's capabilities to identify skill gaps, instantly connecting you with builders who fit the exact profile you need.
            </p>
            <Link to="/hackathons/new" className="inline-flex items-center gap-2 font-mono text-sm font-bold tracking-wider uppercase text-foreground hover:text-accent transition-colors group">
              POST A HACKATHON
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

          <div className="flex-1 w-full max-w-2xl relative">
            {/* Dashboard Mockup UI */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-full border border-border bg-background overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="h-9 border-b border-border bg-secondary flex items-center px-4 gap-2">
                <div className="w-2.5 h-2.5 bg-border"></div>
                <div className="w-2.5 h-2.5 bg-border"></div>
                <div className="w-2.5 h-2.5 bg-border"></div>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase mb-1">ACTIVE PROJECT</h4>
                  <div className="font-sans font-bold text-lg sm:text-xl">AI-Powered Healthcare Assistant</div>
                </div>

                <div className="border border-border bg-card p-5 mb-6">
                  <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase mb-4">REQUIRED CAPABILITIES</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Cpu className="w-4 h-4 text-muted-foreground" /><span className="font-mono text-xs sm:text-sm">AI / ML</span></div>
                      <Check className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Database className="w-4 h-4 text-muted-foreground" /><span className="font-mono text-xs sm:text-sm">Backend Architecture</span></div>
                      <Check className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Code className="w-4 h-4 text-muted-foreground" /><span className="font-mono text-xs sm:text-sm">Frontend Development</span></div>
                      <Check className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="w-full h-[1px] bg-border my-2"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Zap className="w-4 h-4 text-accent" /><span className="font-mono text-xs sm:text-sm font-bold text-accent">UI / UX Design</span></div>
                      <AlertCircle className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-accent" /><span className="font-mono text-xs sm:text-sm font-bold text-accent">Cloud Infrastructure</span></div>
                      <AlertCircle className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                </div>

                <div className="bg-secondary border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="font-mono text-xs uppercase font-bold text-accent">
                    2 SKILL GAPS DETECTED
                  </div>
                  <button className="px-4 py-2 bg-foreground text-background font-mono text-xs font-bold tracking-wider uppercase hover:bg-accent hover:text-white transition-all">
                    FIND MATCHES
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 5. HOW HACKMATE MATCHES YOU (Data flow visuals) */}
      <section className="w-full border-t border-border bg-background py-20 md:py-28 z-20 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 md:px-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase mb-4 tracking-tighter">BUILT AROUND YOUR SKILLS.</h2>
          <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            HackMate analyzes technical abilities, project interests, and collaboration styles to surface the most optimal teams.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center font-mono text-xs sm:text-sm tracking-wider uppercase font-bold text-muted-foreground">
            
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="border border-border p-5 bg-card shadow-sm flex flex-col items-center gap-3 group hover:border-foreground transition-colors">
              <Users className="w-5 h-5 group-hover:text-foreground transition-colors" />
              <span>YOUR PROFILE</span>
            </motion.div>
            
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.1}} className="hidden md:flex justify-center">
              <ArrowRight className="w-5 h-5 text-accent opacity-50" />
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}} className="border border-border p-5 bg-card shadow-sm flex flex-col items-center gap-3 group hover:border-foreground transition-colors">
              <Code className="w-5 h-5 group-hover:text-foreground transition-colors" />
              <span>SKILLS + INTERESTS</span>
            </motion.div>
            
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.3}} className="hidden md:flex justify-center">
              <ArrowRight className="w-5 h-5 text-accent opacity-50" />
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.4}} className="border border-accent bg-card p-5 flex flex-col items-center gap-3 relative overflow-hidden">
              <Network className="w-5 h-5 text-accent" />
              <span className="text-foreground relative z-10">MATCHING ENGINE</span>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 6. FROM IDEA TO TEAM IN MINUTES (Timeline / Journey) */}
      <section className="w-full border-t border-border bg-card py-20 md:py-28 z-20 relative">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
          <div className="mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase mb-3 tracking-tighter">FROM IDEA TO TEAM IN MINUTES.</h2>
            <div className="w-16 h-1 bg-accent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[36px] left-[10%] right-[10%] h-[1px] bg-border z-0"></div>

            {[
              { num: "01", title: "DEFINE YOUR IDEA", desc: "Describe what you want to build and the problem you are solving." },
              { num: "02", title: "DISCOVER REQUIRED SKILLS", desc: "HackMate identifies the exact roles needed to turn the idea into reality." },
              { num: "03", title: "FIND YOUR TEAM", desc: "Browse through compatible builders who match your exact requirements." },
              { num: "04", title: "START BUILDING", desc: "Connect, form your team instantly, and register for hackathons." }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:idx*0.1}}
                className="relative z-10 flex flex-col md:items-center md:text-center group"
              >
                <div className="w-16 h-16 bg-background border border-border flex items-center justify-center font-display text-2xl text-muted-foreground mb-6 group-hover:border-accent group-hover:text-accent transition-all duration-300">
                  {step.num}
                </div>
                <h3 className="font-mono text-sm font-bold tracking-wider uppercase mb-2">{step.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[260px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HACKATHON DISCOVERY EXPERIENCE */}
      <section className="w-full border-t border-border bg-background py-20 md:py-28 z-20 relative">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[0.95] tracking-tighter uppercase mb-2 text-foreground">
                DISCOVER YOUR NEXT<br/><span className="text-muted-foreground">HACKATHON.</span>
              </h2>
            </div>
            <Link to="/discover" className="font-mono text-sm font-bold tracking-wider uppercase bg-foreground text-background hover:bg-accent hover:text-white px-5 py-3 border border-foreground hover:border-accent transition-all flex items-center gap-2">
              EXPLORE ALL HACKATHONS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="border border-border bg-card p-6 md:p-8 shadow-sm">
            {/* UI Filters Mockup */}
            <div className="flex flex-col lg:flex-row gap-6 mb-10 pb-6 border-b border-border">
              <div className="flex-1">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold block mb-2.5">Technology</label>
                <div className="flex flex-wrap gap-2">
                  {['AI', 'Web', 'Cybersecurity', 'Cloud', 'Blockchain'].map(tech => (
                    <div key={tech} className="px-3 py-1 border border-border bg-background font-mono text-xs uppercase text-muted-foreground">{tech}</div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-border hidden lg:block"></div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold block mb-2.5">Mode</label>
                <div className="flex gap-2">
                  <div className="px-3 py-1 border border-border bg-background font-mono text-xs uppercase text-muted-foreground">Online</div>
                  <div className="px-3 py-1 border border-border bg-background font-mono text-xs uppercase text-muted-foreground">Offline</div>
                  <div className="px-3 py-1 border border-border bg-background font-mono text-xs uppercase text-muted-foreground">Hybrid</div>
                </div>
              </div>
            </div>

            {/* Empty/Product State */}
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent/10 flex items-center justify-center mb-5">
                <Compass className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl sm:text-3xl mb-3">OPPORTUNITY AWAITS</h3>
              <p className="font-sans text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
                Discover hackathons that match your skills, interests, and preferred mode of collaboration.
              </p>
              <Link to="/discover" className="btn-hero-primary">
                Launch Discovery Engine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. THE HACKMATE ECOSYSTEM */}
      <section className="w-full border-t border-border bg-card py-20 md:py-28 z-20 relative">
        <div className="max-w-screen-xl mx-auto px-4 md:px-12 text-center">
          <div className="font-mono text-xs font-bold tracking-wider text-accent uppercase mb-4">PLATFORM CAPABILITIES</div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase mb-12 tracking-tighter">EVERYTHING YOU NEED TO HACK BETTER.</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Compass, title: "DISCOVER", desc: "Find hackathons globally that align perfectly with your technical stack and interests." },
              { icon: Network, title: "MATCH", desc: "Utilize our intelligent engine to locate developers and designers with complementary abilities." },
              { icon: Users, title: "TEAM", desc: "Create, manage, and coordinate your hackathon squads from a centralized dashboard." },
              { icon: Code, title: "BUILD", desc: "Focus entirely on writing code and turning concepts into functional software architectures." },
              { icon: Rocket, title: "COMPETE", desc: "Take your finished projects directly into competitive hackathons as a unified team." }
            ].map((cap, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 md:p-8 border border-border bg-background text-left hover:border-accent transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-bl-full group-hover:bg-accent/20 transition-all duration-500"></div>
                <cap.icon className="w-6 h-6 text-accent mb-4" />
                <h3 className="font-mono text-base font-bold tracking-wider uppercase mb-2">{cap.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. WHY HACKMATE? (Stop Building Alone / Community) */}
      <section id="community" className="w-full border-t border-border bg-background py-20 md:py-28 z-20 relative">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
          <div className="mb-14 max-w-3xl">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter mb-4">STOP BUILDING ALONE.</h2>
            <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed">
              Great hackathon ideas don't fail because of a lack of talent. They fail because the right people never find each other.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">FIND THE MISSING SKILL</h3>
              <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
                Your team has an idea but needs an AI engineer, product designer, backend architect, or cybersecurity specialist. HackMate helps you discover them instantly.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">BUILD BALANCED TEAMS</h3>
              <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
                Instead of randomly assembling people or settling for incomplete skill sets, purposefully build squads equipped with comprehensive, complementary strengths.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">MOVE TO EXECUTION</h3>
              <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
                Spend significantly less time searching through forums and Discord channels for teammates, and maximize the time you actually spend building the product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="w-full border-t border-border bg-card py-24 md:py-36 overflow-hidden relative z-20">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern"></div>
        
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12 relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{scale:0}} whileInView={{scale:1}} viewport={{once:true}} transition={{type:"spring"}} className="w-16 h-16 border border-accent bg-background flex items-center justify-center mb-8">
            <Network className="w-7 h-7 text-accent" />
          </motion.div>
          
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1] tracking-tight uppercase mb-6">
            YOUR TEAM IS<br />
            <span className="text-accent">OUT THERE.</span>
          </h2>
          
          <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Find the people who can turn your next idea into something real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              to="/hackathons/new" 
              className="btn-hero-primary group"
            >
              <span>POST A HACKATHON</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/discover" 
              className="btn-hero-secondary"
            >
              EXPLORE HACKATHONS
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-border bg-background py-10 md:py-14 z-20 relative">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
          <div className="font-display text-2xl tracking-tight uppercase flex items-center gap-2 group cursor-pointer">
            HACK<span className="text-accent transition-all duration-300">MATE</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-mono text-xs tracking-wider font-bold uppercase text-muted-foreground">
            <Link to="/discover" className="hover:text-accent transition-colors duration-300">DISCOVER HACKATHONS</Link>
            <Link to="/hackathons/new" className="hover:text-accent transition-colors duration-300">POST HACKATHON</Link>
            <Link to="/login" className="hover:text-accent transition-colors duration-300">LOG IN</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
