import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Zap, Search, Briefcase, RotateCcw } from 'lucide-react';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  
  const [stats, setStats] = useState({
    applicationsReceived: 0,
    accepted: 0,
    pending: 0,
  });

  const handleRetry = useCallback(() => {
    setRefreshIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function fetchDashboard() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [hacksRes, myAppsRes] = await Promise.allSettled([
          hackathonService.getMyHackathons(user.id),
          applicationService.getMyApplications(user.id)
        ]);

        if (!isSubscribed) return;

        const hacks = hacksRes.status === 'fulfilled' && Array.isArray(hacksRes.value) ? hacksRes.value : [];
        const myApps = myAppsRes.status === 'fulfilled' && Array.isArray(myAppsRes.value) ? myAppsRes.value : [];

        if (hacksRes.status === 'rejected') {
          console.warn('[HackMate Dashboard] Failed to load my hackathons:', hacksRes.reason);
        }
        if (myAppsRes.status === 'rejected') {
          console.warn('[HackMate Dashboard] Failed to load my applications:', myAppsRes.reason);
        }

        setHackathons(hacks);
        setApplications(myApps);

        if (hacks.length > 0) {
          const hackIds = hacks.map((h: any) => h?.id).filter(Boolean);
          
          if (hackIds.length > 0) {
            try {
              const [appsRes, accRes, pendRes] = await Promise.allSettled([
                supabase
                  .from('applications')
                  .select('*', { count: 'exact', head: true })
                  .in('hackathon_id', hackIds),
                supabase
                  .from('applications')
                  .select('*', { count: 'exact', head: true })
                  .in('hackathon_id', hackIds)
                  .eq('status', 'accepted'),
                supabase
                  .from('applications')
                  .select('*', { count: 'exact', head: true })
                  .in('hackathon_id', hackIds)
                  .eq('status', 'pending')
              ]);

              if (isSubscribed) {
                setStats({
                  applicationsReceived: (appsRes.status === 'fulfilled' && appsRes.value.count) || 0,
                  accepted: (accRes.status === 'fulfilled' && accRes.value.count) || 0,
                  pending: (pendRes.status === 'fulfilled' && pendRes.value.count) || 0,
                });
              }
            } catch (statsErr) {
              console.warn('[HackMate Dashboard] Non-critical error fetching stats:', statsErr);
            }
          }
        }

        if (hacksRes.status === 'rejected' && myAppsRes.status === 'rejected') {
          setError('Unable to load dashboard data. Please check your network connection.');
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data', err);
        if (isSubscribed) {
          setError(err?.message || 'Failed to load dashboard data');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isSubscribed = false;
    };
  }, [user, refreshIndex]);

  // Derived Metrics
  const activeHackathons = Array.isArray(hackathons) ? hackathons.filter(h => h && h.status === 'OPEN').length : 0;
  const activeApplications = Array.isArray(applications) ? applications.filter(a => a && a.status === 'pending').length : 0;
  const acceptedApplicationsCount = Array.isArray(applications) ? applications.filter(a => a && a.status === 'accepted').length : 0;

  const totalMatches = stats.accepted + acceptedApplicationsCount;
  
  // What Needs Attention Logic
  const totalIncomingApps = stats.pending; 

  const formatEventDate = (date: Date) => {
    try {
      if (isNaN(date.getTime())) return 'RECENT ACTIVITY';
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'RECENT ACTIVITY';
    }
  };

  // Combine for timeline safely
  const posterEvents = (Array.isArray(hackathons) ? hackathons : [])
    .filter(h => h && h.created_at)
    .map((h, index) => {
      const d = new Date(h.created_at);
      return {
        id: h.id ? `hack-${h.id}` : `hack-idx-${index}`,
        type: 'HACKATHON_POSTED',
        title: h.title || 'Untitled Hackathon',
        date: d,
        isValidDate: !isNaN(d.getTime()),
        meta: h.mode ? String(h.mode).toUpperCase() : 'ONLINE',
        link: h.id ? `/hackathons/${h.id}` : '/hackathons'
      };
    })
    .filter(e => e.isValidDate);
  
  const providerEvents = (Array.isArray(applications) ? applications : [])
    .filter(a => a && a.created_at)
    .map((a, index) => {
      const d = new Date(a.created_at);
      return {
        id: a.id ? `app-${a.id}` : `app-idx-${index}`,
        type: 'APPLICATION_SUBMITTED',
        title: a.hackathons?.title || 'A Hackathon',
        date: d,
        isValidDate: !isNaN(d.getTime()),
        meta: a.status ? String(a.status).toUpperCase() : 'PENDING',
        link: a.hackathon_id ? `/hackathons/${a.hackathon_id}` : '/my-applications'
      };
    })
    .filter(e => e.isValidDate);

  const timelineEvents = [...posterEvents, ...providerEvents]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground">
      
      {/* Editorial Header */}
      <header className="w-full px-4 md:px-12 pt-16 pb-12 border-b border-border bg-card relative z-20">
        <div className="max-w-screen-2xl mx-auto flex flex-col gap-12">
          
          <div className="text-center md:text-left mb-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
              <h1 className="heading-page mb-3">
                WHAT DO YOU WANT TO DO?
              </h1>
              <p className="font-mono text-xs sm:text-sm tracking-wider uppercase text-muted-foreground">
                CHOOSE AN ACTION TO GET STARTED.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="h-full group flex flex-col p-6 md:p-10 border border-border bg-card hover:border-foreground transition-all duration-300 hover:-translate-y-1">
              <div className="bg-background w-fit p-3.5 mb-6 group-hover:text-accent transition-colors border border-border">
                <Briefcase className="w-7 h-7" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight mb-2">POST A HACKATHON</h2>
              <p className="font-sans text-sm text-muted-foreground mb-6 flex-1">"I am organizing a team and need members."</p>
              <Link to="/hackathons/new" className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors border border-foreground hover:border-accent min-h-[48px]">
                <span>CREATE HACKATHON</span> <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="h-full group flex flex-col p-6 md:p-10 border border-border bg-card hover:border-foreground transition-all duration-300 hover:-translate-y-1">
              <div className="bg-background w-fit p-3.5 mb-6 group-hover:text-accent transition-colors border border-border">
                <Search className="w-7 h-7" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight mb-2">FIND A TEAM</h2>
              <p className="font-sans text-sm text-muted-foreground mb-6 flex-1">"I want to join a hackathon team."</p>
              <Link to="/discover" className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors border border-foreground hover:border-accent min-h-[48px]">
                <span>DISCOVER HACKATHONS</span> <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Compact Overview */}
          <motion.div 
            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:0.3}}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 border-t border-border pt-12"
          >
            <div className="md:border-r border-border flex flex-col">
              <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-2">MY ACTIVE HACKATHONS</span>
              <span className="font-display text-4xl sm:text-5xl">{loading ? '-' : activeHackathons}</span>
            </div>
            <div className="md:border-r border-border flex flex-col md:pl-12">
              <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-2">MY ACTIVE APPLICATIONS</span>
              <span className="font-display text-4xl sm:text-5xl">{loading ? '-' : activeApplications}</span>
            </div>
            <div className="md:border-r border-border flex flex-col md:pl-12">
              <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-2">APPS RECEIVED</span>
              <span className="font-display text-4xl sm:text-5xl">{loading ? '-' : stats.applicationsReceived}</span>
            </div>
            <div className="flex flex-col md:pl-12">
              <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-2">SUCCESSFUL TEAMS</span>
              <span className="font-display text-4xl sm:text-5xl text-accent">{loading ? '-' : totalMatches}</span>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-12 py-14">
        {loading ? (
          <div className="flex justify-center py-28">
            <span className="font-mono text-sm uppercase tracking-wider text-muted-foreground animate-pulse">Compiling Market Data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="font-mono text-xs uppercase tracking-wider text-accent border border-accent p-4 max-w-md">
              {error}
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="py-3 px-6 bg-foreground text-background font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors flex items-center gap-2 min-h-[46px]"
            >
              <RotateCcw className="w-4 h-4" />
              RETRY CONNECTION
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Column: Timeline & Intelligence */}
            <div className="lg:col-span-8 flex flex-col gap-14">
              
              {/* Attention Section */}
              {totalIncomingApps > 0 && (
                <section>
                  <div className="border-b border-border pb-3 mb-6">
                    <h2 className="heading-section flex items-center gap-3 text-accent">
                      <Zap className="w-5 h-5 fill-accent" /> WHAT NEEDS YOUR ATTENTION
                    </h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Link to="/team-requests" className="p-6 bg-secondary border border-border flex justify-between items-center group hover:border-accent transition-colors duration-300">
                      <div>
                        <div className="font-sans text-lg font-bold mb-1 text-foreground group-hover:text-accent transition-colors">{totalIncomingApps} PENDING APPLICATIONS</div>
                        <div className="font-mono text-xs tracking-wider uppercase text-muted-foreground">Review incoming team requests for your hackathons</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </section>
              )}

              {/* Market Pulse Timeline */}
              <section>
                <div className="border-b border-border pb-3 mb-6 flex items-center justify-between">
                  <h2 className="heading-section">RECENT ACTIVITY</h2>
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                
                {timelineEvents.length === 0 ? (
                  <div className="py-14 border border-border border-dashed p-8 text-center bg-card flex flex-col items-center">
                    <span className="font-mono text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">NO RECENT ACTIVITY DETECTED</span>
                  </div>
                ) : (
                  <div className="flex flex-col relative pl-6 border-l border-border ml-2">
                    {timelineEvents.map((event, i) => (
                      <motion.div 
                        initial={{opacity:0, x:-20}} whileInView={{opacity:1, x:0}} viewport={{once:true}} transition={{delay: i * 0.1}}
                        key={event.id} className="mb-8 relative group"
                      >
                        <div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 border-background ${event.type === 'APPLICATION_SUBMITTED' ? 'bg-accent' : 'bg-foreground'}`}></div>
                        <div className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-1.5 flex items-center gap-3">
                          {formatEventDate(event.date)}
                          <span className={`px-2 py-[2px] border ${event.type === 'APPLICATION_SUBMITTED' ? 'border-accent/30 text-accent bg-accent/5' : 'border-border bg-card'}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                        <Link to={event.link} className="inline-block">
                          <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-tight group-hover:text-accent transition-colors">
                            {event.title}
                          </h3>
                        </Link>
                        <div className="font-mono text-xs text-muted-foreground mt-1.5 font-bold tracking-wider">{event.meta}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Quick Actions */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <section>
                <div className="border-b border-border pb-3 mb-6">
                  <h2 className="heading-section">QUICK LINKS</h2>
                </div>
                
                <div className="flex flex-col gap-4">
                  <Link to="/hackathons" className="p-5 bg-card border border-border hover:border-foreground transition-colors group flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-background transform scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ease-out"></div>
                    <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider group-hover:text-accent transition-colors flex justify-between items-center relative z-10">
                      <span>VIEW MY HACKATHONS</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h3>
                  </Link>

                  <Link to="/my-applications" className="p-5 bg-card border border-border hover:border-foreground transition-colors group flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-background transform scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ease-out"></div>
                    <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider group-hover:text-accent transition-colors flex justify-between items-center relative z-10">
                      <span>VIEW MY APPLICATIONS</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h3>
                  </Link>
                </div>
              </section>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
