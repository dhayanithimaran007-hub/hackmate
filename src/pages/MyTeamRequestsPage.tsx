import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { profileService } from '../services/profileService';
import { matchingService } from '../services/matchingService';
import { Check, X, ShieldCheck, User, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatExternalUrl } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function MyTeamRequestsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetHackathonId = searchParams.get('hackathonId') || location.state?.hackathonId || '';
  
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [extraContacts, setExtraContacts] = useState<Record<string, { email?: string; phone?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchHackathons = async () => {
      if (!user) return;
      try {
        const hacks = await hackathonService.getMyHackathons(user.id);
        const openHacks = hacks.filter((h: any) => h.status === 'OPEN');
        setHackathons(openHacks);
        if (openHacks.length > 0) {
          const matchTarget = targetHackathonId && openHacks.some((h: any) => h.id === targetHackathonId)
            ? targetHackathonId
            : openHacks[0].id;
          setSelectedHackathonId(matchTarget);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, [user, targetHackathonId]);

  useEffect(() => {
    const fetchApps = async () => {
      if (!selectedHackathonId) return;
      setLoading(true);
      try {
        const apps = await applicationService.getApplicationsForHackathon(selectedHackathonId);
        
        // Calculate match scores if pending
        const hackathon = hackathons.find((h: any) => h.id === selectedHackathonId);
        if (hackathon) {
          const appsWithScores = apps.map((app: any) => {
            const matchData = matchingService.evaluateApplication(hackathon, app);
            const explanation = matchingService.generateExplanation(matchData, hackathon, app);
            return { ...app, matchData, explanation };
          });
          // Sort by match score descending
          setApplications(appsWithScores.sort((a: any, b: any) => (b.matchData?.matchScore || 0) - (a.matchData?.matchScore || 0)));
        } else {
          setApplications(apps);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [selectedHackathonId, hackathons]);

  const handleAction = async (appId: string, status: 'accepted' | 'rejected') => {
    setActionError('');
    try {
      await applicationService.updateApplicationStatus(appId, status);
      // Re-fetch hackathons so updated open_positions is reflected
      if (user) {
        const freshHacks = await hackathonService.getMyHackathons(user.id);
        setHackathons(freshHacks.filter((h: any) => h.status === 'OPEN'));
      }
      // Refresh applications
      const apps = await applicationService.getApplicationsForHackathon(selectedHackathonId);
      const hackathon = hackathons.find((h: any) => h.id === selectedHackathonId);
      if (hackathon) {
        const appsWithScores = apps.map((app: any) => {
          const matchData = matchingService.evaluateApplication(hackathon, app);
          const explanation = matchingService.generateExplanation(matchData, hackathon, app);
          return { ...app, matchData, explanation };
        });
        setApplications(appsWithScores.sort((a: any, b: any) => (b.matchData?.matchScore || 0) - (a.matchData?.matchScore || 0)));
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update application. Please try again.');
    }
  };

  useEffect(() => {
    const fetchExtraContacts = async () => {
      const acceptedApps = applications.filter(
        (app: any) => (app.status === 'accepted' || app.status === undefined) && app.applicant_id
      );
      if (acceptedApps.length === 0) return;

      const newContacts: Record<string, { email?: string; phone?: string }> = {};
      await Promise.all(
        acceptedApps.map(async (app: any) => {
          if (app.contact_email && app.contact_phone) return;
          try {
            const info = await profileService.getContactInfo(app.applicant_id);
            if (info) {
              newContacts[app.applicant_id] = info;
            }
          } catch {
            // Silently handle if RPC is not available
          }
        })
      );

      if (Object.keys(newContacts).length > 0) {
        setExtraContacts(prev => ({ ...prev, ...newContacts }));
      }
    };

    fetchExtraContacts();
  }, [applications]);

  const getApplicantContacts = (app: any) => {
    const extra = extraContacts[app.applicant_id];
    const phone = app.contact_phone || app.phone || app.profiles?.phone || extra?.phone || null;

    const hasExplicitWhatsappField =
      'contact_whatsapp' in app ||
      'whatsapp' in app ||
      'whatsapp_number' in app ||
      (app.profiles && ('whatsapp' in app.profiles || 'whatsapp_number' in app.profiles));

    let whatsapp: string | null = null;
    if (hasExplicitWhatsappField) {
      whatsapp =
        app.contact_whatsapp ||
        app.whatsapp ||
        app.whatsapp_number ||
        app.profiles?.whatsapp ||
        app.profiles?.whatsapp_number ||
        null;
    } else {
      whatsapp = phone;
    }

    const email = app.contact_email || app.email || app.profiles?.email || extra?.email || null;

    return {
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null
    };
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital background */}
      <EarthBackground variant="minimal" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
          INBOX & <span className="text-accent">SQUAD REQUESTS.</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
          Review incoming builder applications, compare match affinities, and approve team members.
        </p>
      </div>

      {/* Layout: Sidebar + Main Content */}
      <div className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pb-16 flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar: Event selector */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
          <div className="font-sans text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
            MY POSTED EVENTS
          </div>

          {hackathons.length === 0 ? (
            <div className="p-4 rounded-sm border border-border bg-card text-center font-sans text-xs text-muted-foreground">
              No active hackathons found.
            </div>
          ) : (
            hackathons.map((h: any) => {
              const isSelected = selectedHackathonId === h.id;
              return (
                <button 
                  key={h.id}
                  onClick={() => setSelectedHackathonId(h.id)}
                  className={`text-left p-3.5 rounded-sm border transition-all ${
                    isSelected 
                      ? 'bg-card border-accent shadow-sm' 
                      : 'bg-[#0E1013] border-border hover:border-border/80 text-text-secondary'
                  }`}
                >
                  <div className="truncate font-semibold text-xs sm:text-sm text-foreground mb-1">
                    {h.title}
                  </div>
                  <div className="text-xs font-sans text-muted-foreground">
                    {h.open_positions} OPEN {h.open_positions === 1 ? 'POSITION' : 'POSITIONS'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedHackathonId ? (
            <div className="flex-1 border border-border bg-card rounded-sm p-12 text-center text-text-secondary font-mono text-xs uppercase tracking-wider">
              Select an event to view incoming squad applications.
            </div>
          ) : loading ? (
            <div className="flex-1 border border-border bg-card rounded-sm p-12 text-center text-muted-foreground font-mono text-xs uppercase tracking-wider animate-pulse">
              Retrieving applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="flex-1 border border-border bg-card rounded-sm p-12 text-center flex flex-col items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-muted-foreground mb-3 opacity-60" />
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                No applications received for this hackathon yet.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {actionError && (
                <div className="p-3 border border-accent bg-accent/10 text-accent font-mono text-xs rounded-sm">
                  {actionError}
                </div>
              )}

              {applications.map((app: any, i: number) => {
                const isAccepted = app.status === 'accepted';
                const isRejected = app.status === 'rejected';
                const isPending = app.status === 'pending';

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.25) }}
                    key={app.id} 
                    className={`border rounded-sm p-5 flex flex-col bg-card transition-colors ${
                      isAccepted 
                        ? 'border-accent/60' 
                        : isRejected 
                          ? 'border-border/60 opacity-60' 
                          : 'border-border hover:border-border/80'
                    }`}
                  >
                    {/* Header Row: Applicant details & Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-elevated flex items-center justify-center rounded-sm overflow-hidden border border-border shrink-0">
                          {app.profiles?.avatar_url ? (
                            <img 
                              src={app.profiles.avatar_url} 
                              alt="Avatar" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`avatar-fallback w-full h-full items-center justify-center font-mono text-xs font-bold text-foreground ${app.profiles?.avatar_url ? 'hidden' : 'flex'}`}>
                            {app.profiles?.full_name?.charAt(0) || <User className="text-muted-foreground w-4 h-4" />}
                          </div>
                        </div>

                        <div>
                          {app.profiles?.username ? (
                            <Link 
                              to={`/profile/${app.profiles.username}`}
                              className="text-sm sm:text-base font-semibold text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
                            >
                              <span>{app.profiles?.full_name || app.profiles.username}</span>
                              <ExternalLink size={12} className="text-muted-foreground" />
                            </Link>
                          ) : (
                            <div className="text-sm sm:text-base font-semibold text-foreground">
                              {app.profiles?.full_name || 'Anonymous Applicant'}
                            </div>
                          )}
                          <div className="font-mono text-xs text-text-secondary">
                            APPLIED FOR: <span className="text-foreground font-semibold">{app.role}</span> {app.experience_level ? `• ${app.experience_level}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Status / Accept & Reject */}
                      {isPending ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => handleAction(app.id, 'accepted')} 
                            className="h-8 px-3.5 bg-accent hover:bg-hover-red text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5"
                          >
                            <Check size={13} />
                            <span>ACCEPT</span>
                          </button>
                          <button 
                            onClick={() => handleAction(app.id, 'rejected')} 
                            className="h-8 px-3.5 border border-border hover:border-red-500 text-muted-foreground hover:text-red-400 font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5"
                          >
                            <X size={13} />
                            <span>REJECT</span>
                          </button>
                        </div>
                      ) : (
                        <span className={`font-sans text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${
                          isAccepted 
                            ? 'bg-accent/10 border-accent/40 text-accent' 
                            : 'bg-surface-elevated border-border text-muted-foreground'
                        }`}>
                          {app.status}
                        </span>
                      )}
                    </div>

                    {/* Applicant Pitch & Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 border-y border-border/60 mb-4">
                      <div>
                        <span className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                          APPLICATION MESSAGE
                        </span>
                        <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed">
                          {app.message || 'No message included with this request.'}
                        </p>
                      </div>

                      <div>
                        <span className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          APPLICANT CAPABILITIES
                        </span>
                        {app.skills && app.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {app.skills.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 rounded-sm bg-surface-elevated border border-border/80 font-sans text-xs text-text-secondary">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No skills listed.</span>
                        )}

                        {(app.github_url || app.portfolio_url) && (
                          <div className="flex gap-3 mt-3 font-sans text-xs">
                            {app.github_url && (
                              <a href={formatExternalUrl(app.github_url)} target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium">
                                GitHub →
                              </a>
                            )}
                            {app.portfolio_url && (
                              <a href={formatExternalUrl(app.portfolio_url)} target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium">
                                Portfolio →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Score & Explanation */}
                    {app.matchData && (
                      <div className="p-3 bg-[#0E1013] border border-border/70 rounded-sm mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-sans text-xs uppercase text-text-secondary font-semibold">
                            SKILL AFFINITY SCORE
                          </span>
                          <span className="font-sans font-bold text-lg text-accent">
                            {app.matchData.matchScore}%
                          </span>
                        </div>
                        {app.explanation?.summary && (
                          <p className="font-sans text-xs text-muted-foreground leading-normal">
                            {app.explanation.summary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Accepted Applicant Contact Channels */}
                    {isAccepted && (() => {
                      const { phone, whatsapp, email } = getApplicantContacts(app);
                      return (
                        <div className="p-3 bg-[#0E1013] border border-accent/30 rounded-sm">
                          <span className="font-sans text-xs font-bold text-accent uppercase tracking-wider block mb-2">
                            ACCEPTED TEAM MEMBER CONTACT CHANNELS
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">PHONE</span>
                              <span className="text-foreground">{phone || 'Not shared'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">WHATSAPP</span>
                              <span className="text-foreground">{whatsapp || 'Not shared'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">EMAIL</span>
                              <span className="text-foreground break-all">{email || 'Not shared'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
