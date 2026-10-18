import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Zap, Search, Briefcase, RotateCcw, Users, Plus } from 'lucide-react';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { supabase } from '../lib/supabase';
import { formatDisplayDate } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function DashboardPage() {
  const { user, profile } = useAuth();
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
  const totalIncomingApps = stats.pending; 

  const formatEventDate = (date: Date) => {
    try {
      if (isNaN(date.getTime())) return 'RECENT ACTIVITY';
      return `${formatDisplayDate(date.toISOString())} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'RECENT ACTIVITY';
    }
  };

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
    .slice(0, 8);

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Builder';

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      
      {/* Top Welcome Section with Subtle Partially Cropped Earth Background */}
      <section className="relative z-10 w-full border-b border-border bg-[#0E1013]/70 overflow-hidden">
        <EarthBackground variant="dashboard" />
        
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10 md:py-14 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="font-sans text-xs text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SYSTEM DASHBOARD
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-foreground leading-tight">
                WELCOME BACK, <span className="text-accent">{displayName}</span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary font-sans max-w-xl leading-relaxed">
                Track your active hackathon squads, manage incoming team requests, and discover new competitions.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link 
                to="/hackathons/new" 
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-sm bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-hover-red transition-all"
              >
                <Plus size={13} />
                <span>POST HACKATHON</span>
              </Link>
              <Link 
                to="/developers" 
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-sm bg-card border border-border hover:border-accent text-text-secondary hover:text-foreground font-sans text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <Users size={13} />
                <span>FIND TEAMMATES</span>
              </Link>
            </div>
          </div>

          {/* Useful Real Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-8 border-t border-border/60">
            <div className="p-4 sm:p-5 rounded-sm bg-card border border-border">
              <span className="font-sans text-xs font-medium tracking-wider uppercase text-text-secondary block mb-1.5">
                MY POSTED HACKATHONS
              </span>
              <span className="font-sans font-bold text-3xl sm:text-4xl text-foreground leading-none block">
                {loading ? '—' : activeHackathons}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-sm bg-card border border-border">
              <span className="font-sans text-xs font-medium tracking-wider uppercase text-text-secondary block mb-1.5">
                PENDING APPLICATIONS
              </span>
              <span className="font-sans font-bold text-3xl sm:text-4xl text-foreground leading-none block">
                {loading ? '—' : activeApplications}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-sm bg-card border border-border">
              <span className="font-sans text-xs font-medium tracking-wider uppercase text-text-secondary block mb-1.5">
                INCOMING SQUAD APPS
              </span>
              <span className="font-sans font-bold text-3xl sm:text-4xl text-foreground leading-none block">
                {loading ? '—' : stats.applicationsReceived}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-sm bg-card border border-border">
              <span className="font-sans text-xs font-medium tracking-wider uppercase text-text-secondary block mb-1.5">
                ACCEPTED MATCHES
              </span>
              <span className="font-sans font-bold text-3xl sm:text-4xl text-accent leading-none block">
                {loading ? '—' : totalMatches}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <main className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground animate-pulse font-medium">
              SYNCING HACKATHON & SQUAD DATA...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-border bg-card p-6 max-w-md mx-auto rounded-sm">
            <div className="font-sans text-xs uppercase tracking-wider text-accent font-semibold">
              {error}
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="py-2.5 px-5 bg-card border border-border hover:border-accent font-sans text-xs font-semibold uppercase tracking-wider text-foreground hover:text-accent transition-colors flex items-center gap-2 rounded-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETRY CONNECTION</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Left 8 Cols: Attention & Activity Timeline */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Needs Attention Alert (Real Pending Applications) */}
              {totalIncomingApps > 0 && (
                <div className="p-4 sm:p-5 bg-accent/10 border border-accent/40 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-sm bg-accent/20 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground leading-snug">
                        {totalIncomingApps} PENDING SQUAD {totalIncomingApps === 1 ? 'APPLICATION' : 'APPLICATIONS'}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-normal">
                        Candidates have applied to join your hackathon teams and are awaiting review.
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/team-requests" 
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-sm bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-hover-red transition-all shrink-0 self-start sm:self-auto"
                  >
                    <span>REVIEW INBOX</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              {/* Action Pathways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/hackathons/new"
                  className="group p-5 bg-card border border-border hover:border-accent/70 rounded-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-sm bg-surface-elevated border border-border flex items-center justify-center text-text-secondary group-hover:text-accent mb-3.5 transition-colors">
                      <Briefcase size={16} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-snug mb-1.5">
                      POST A HACKATHON
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      Create an event listing, define required capabilities, and build your team roster.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wide text-muted-foreground group-hover:text-accent transition-colors">
                    <span>CREATE LISTING</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                <Link
                  to="/discover"
                  className="group p-5 bg-card border border-border hover:border-accent/70 rounded-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-sm bg-surface-elevated border border-border flex items-center justify-center text-text-secondary group-hover:text-accent mb-3.5 transition-colors">
                      <Search size={16} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-snug mb-1.5">
                      JOIN A HACKATHON TEAM
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      Discover open teams seeking your specific engineering or design skillset.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wide text-muted-foreground group-hover:text-accent transition-colors">
                    <span>BROWSE TEAMS</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Recent Activity Timeline */}
              <section className="bg-card border border-border rounded-sm p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
                  <div className="flex items-center gap-2">
                    <Activity size={15} className="text-accent" />
                    <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                      RECENT ACTIVITY LOG
                    </h2>
                  </div>
                  <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                    LIVE STATUS
                  </span>
                </div>
                
                {timelineEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      NO RECENT ACTIVITY RECORDED YET.
                    </p>
                    <p className="text-xs sm:text-sm text-text-secondary mt-1.5">
                      Apply to a hackathon or post an event to begin building activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timelineEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-sm bg-[#0E1013] border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${event.type === 'APPLICATION_SUBMITTED' ? 'bg-accent' : 'bg-success'}`} />
                            <span className="uppercase font-medium tracking-wide">{event.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{formatEventDate(event.date)}</span>
                          </div>
                          <Link 
                            to={event.link}
                            className="text-xs sm:text-sm font-semibold text-foreground hover:text-accent transition-colors truncate block"
                          >
                            {event.title}
                          </Link>
                        </div>

                        <span className="text-[11px] font-sans font-medium uppercase px-2 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-secondary shrink-0 tracking-wide">
                          {event.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right 4 Cols: Navigation Shortcuts & Quick Tools */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-card border border-border rounded-sm p-5">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  PLATFORM SHORTCUTS
                </h3>

                <div className="flex flex-col gap-2">
                  <Link 
                    to="/hackathons" 
                    className="p-3 bg-surface-elevated hover:bg-[#16191E] border border-border hover:border-accent/60 rounded-sm transition-all flex items-center justify-between text-xs font-sans font-medium tracking-wide text-text-secondary hover:text-foreground"
                  >
                    <span>MY HACKATHONS</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </Link>

                  <Link 
                    to="/team-requests" 
                    className="p-3 bg-surface-elevated hover:bg-[#16191E] border border-border hover:border-accent/60 rounded-sm transition-all flex items-center justify-between text-xs font-sans font-medium tracking-wide text-text-secondary hover:text-foreground"
                  >
                    <span>INBOX & SQUAD REQUESTS</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </Link>

                  <Link 
                    to="/my-applications" 
                    className="p-3 bg-surface-elevated hover:bg-[#16191E] border border-border hover:border-accent/60 rounded-sm transition-all flex items-center justify-between text-xs font-sans font-medium tracking-wide text-text-secondary hover:text-foreground"
                  >
                    <span>MY APPLICATIONS</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </Link>

                  <Link 
                    to="/developers" 
                    className="p-3 bg-surface-elevated hover:bg-[#16191E] border border-border hover:border-accent/60 rounded-sm transition-all flex items-center justify-between text-xs font-sans font-medium tracking-wide text-text-secondary hover:text-foreground"
                  >
                    <span>DEVELOPERS DIRECTORY</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </Link>

                  <Link 
                    to="/profile" 
                    className="p-3 bg-surface-elevated hover:bg-[#16191E] border border-border hover:border-accent/60 rounded-sm transition-all flex items-center justify-between text-xs font-sans font-medium tracking-wide text-text-secondary hover:text-foreground"
                  >
                    <span>EDIT MY PROFILE</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Developer Tip Box */}
              <div className="p-5 rounded-sm bg-surface-elevated border border-border/80">
                <span className="font-sans text-xs font-bold text-accent uppercase tracking-wider block mb-1.5">
                  PRO TIP
                </span>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Keep your technical skills and availability status updated in your profile so other teams can discover you in the directory.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
