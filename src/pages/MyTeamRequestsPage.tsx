import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { profileService } from '../services/profileService';
import { matchingService } from '../services/matchingService';
import { Check, X, ShieldCheck, User, ExternalLink, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
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

  // Withdrawal & action state
  const [withdrawingApp, setWithdrawingApp] = useState<any | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string>('');

  const loadApplications = async (hackId: string, currentHacks: any[]) => {
    if (!hackId) return;
    try {
      const apps = await applicationService.getApplicationsForHackathon(hackId);
      const hackathon = currentHacks.find((h: any) => h.id === hackId);
      if (hackathon) {
        const appsWithScores = apps.map((app: any) => {
          const matchData = matchingService.evaluateApplication(hackathon, app);
          const explanation = matchingService.generateExplanation(matchData, hackathon, app);
          return { ...app, matchData, explanation };
        });
        setApplications(appsWithScores.sort((a: any, b: any) => (b.matchData?.matchScore || 0) - (a.matchData?.matchScore || 0)));
      } else {
        setApplications(apps);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    if (!selectedHackathonId) return;
    let isCurrent = true;
    applicationService.getApplicationsForHackathon(selectedHackathonId)
      .then((apps) => {
        if (!isCurrent) return;
        const hackathon = hackathons.find((h: any) => h.id === selectedHackathonId);
        if (hackathon) {
          const appsWithScores = apps.map((app: any) => {
            const matchData = matchingService.evaluateApplication(hackathon, app);
            const explanation = matchingService.generateExplanation(matchData, hackathon, app);
            return { ...app, matchData, explanation };
          });
          setApplications(appsWithScores.sort((a: any, b: any) => (b.matchData?.matchScore || 0) - (a.matchData?.matchScore || 0)));
        } else {
          setApplications(apps);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedHackathonId, hackathons]);

  const handleAction = async (appId: string, status: 'accepted' | 'rejected') => {
    if (activeActionId) return;
    setActiveActionId(appId);
    setActionError('');
    try {
      await applicationService.updateApplicationStatus(appId, status);
      // Re-fetch hackathons so updated open_positions is reflected
      let updatedHacks = hackathons;
      if (user) {
        const freshHacks = await hackathonService.getMyHackathons(user.id);
        updatedHacks = freshHacks.filter((h: any) => h.status === 'OPEN');
        setHackathons(updatedHacks);
      }
      await loadApplications(selectedHackathonId, updatedHacks);
      setSuccessToast(status === 'accepted' ? 'Application accepted!' : 'Application rejected.');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update application. Please try again.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleWithdrawClick = (app: any) => {
    if (app.status === 'rejected') {
      return;
    }
    setWithdrawingApp(app);
    setWithdrawError('');
  };

  const handleCancelWithdraw = () => {
    if (isWithdrawing) return;
    setWithdrawingApp(null);
    setWithdrawError('');
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawingApp || isWithdrawing) return;
    setIsWithdrawing(true);
    setActiveActionId(withdrawingApp.id);
    setWithdrawError('');

    try {
      await applicationService.withdrawApplication(
        withdrawingApp.id,
        withdrawingApp.hackathon_id,
        withdrawingApp.applicant_id
      );

      // Refresh hackathons & applications immediately
      let updatedHacks = hackathons;
      if (user) {
        const freshHacks = await hackathonService.getMyHackathons(user.id);
        updatedHacks = freshHacks.filter((h: any) => h.status === 'OPEN');
        setHackathons(updatedHacks);
      }
      await loadApplications(selectedHackathonId, updatedHacks);

      const toastMessage = withdrawingApp.status === 'accepted'
        ? "Team member acceptance withdrawn successfully."
        : "Team request withdrawn successfully.";
      setSuccessToast(toastMessage);
      setTimeout(() => setSuccessToast(''), 3500);

      setWithdrawingApp(null);
    } catch (err: any) {
      console.error('Withdraw error:', err);
      setWithdrawError(err.message || 'Failed to withdraw application. Please try again.');
    } finally {
      setIsWithdrawing(false);
      setActiveActionId(null);
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

                      {/* Status / Accept, Reject & Withdraw Actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        {isPending && (
                          <>
                            <button 
                              onClick={() => handleAction(app.id, 'accepted')} 
                              disabled={activeActionId === app.id}
                              className="h-8 px-3.5 bg-accent hover:bg-hover-red text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              title="Accept builder onto your squad"
                            >
                              <Check size={13} />
                              <span>ACCEPT</span>
                            </button>
                            <button 
                              onClick={() => handleAction(app.id, 'rejected')} 
                              disabled={activeActionId === app.id}
                              className="h-8 px-3.5 border border-border hover:border-red-500 text-muted-foreground hover:text-red-400 font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              title="Reject application"
                            >
                              <X size={13} />
                              <span>REJECT</span>
                            </button>
                            <button 
                              id={`withdraw-btn-${app.id}`}
                              onClick={() => handleWithdrawClick(app)}
                              disabled={activeActionId === app.id}
                              className="h-8 px-3.5 bg-[#0E1013] border border-accent text-accent hover:bg-accent/10 hover:border-accent font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50"
                              title="Withdraw application request"
                            >
                              {activeActionId === app.id && isWithdrawing ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Withdrawing...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={13} />
                                  <span>Withdraw</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <>
                            <span className="font-sans text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border bg-accent/10 border-accent/40 text-accent">
                              accepted
                            </span>
                            <button 
                              id={`withdraw-btn-${app.id}`}
                              onClick={() => handleWithdrawClick(app)}
                              disabled={activeActionId === app.id}
                              className="h-8 px-3.5 bg-[#0E1013] border border-accent text-accent hover:bg-accent/10 hover:border-accent font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50"
                              title="Withdraw acceptance and revoke team membership"
                            >
                              {activeActionId === app.id && isWithdrawing ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Withdrawing...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={13} />
                                  <span>Withdraw</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {isRejected && (
                          <>
                            <span className="font-sans text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border bg-surface-elevated border-border text-muted-foreground">
                              rejected
                            </span>
                            <button 
                              disabled
                              className="h-8 px-3.5 bg-[#0E1013]/40 border border-border/40 text-muted-foreground/50 font-sans text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-not-allowed opacity-50"
                              title="Application is already withdrawn or rejected"
                            >
                              <RotateCcw size={13} />
                              <span>Withdrawn</span>
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Success Notification Toast */}
      {successToast && (
        <div 
          id="withdraw-success-toast"
          className="fixed bottom-6 right-6 bg-[#0E1013] border border-accent/60 text-foreground px-5 py-3 font-sans text-xs font-semibold tracking-wider uppercase shadow-2xl z-50 rounded-sm flex items-center gap-2.5"
        >
          <Check size={15} className="text-accent shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {withdrawingApp && (
        <div 
          id="withdraw-confirmation-modal"
          className="fixed inset-0 bg-[#090A0C]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border p-6 max-w-md w-full shadow-2xl rounded-sm flex flex-col gap-4 text-foreground"
          >
            <div className="flex items-center gap-2.5 text-accent">
              <AlertTriangle size={20} className="shrink-0 text-accent" />
              <h3 className="font-bold text-base sm:text-lg uppercase tracking-tight text-foreground">
                CONFIRM WITHDRAWAL
              </h3>
            </div>
            
            <div>
              <p className="font-sans text-xs text-text-secondary mb-3 leading-relaxed">
                {withdrawingApp.status === 'accepted'
                  ? "Are you sure you want to withdraw this team member's acceptance? This action may revoke their accepted status."
                  : "Are you sure you want to withdraw this application request? This action will reject the application."}
              </p>

              <div className="bg-[#0E1013] p-3 border border-border rounded-sm">
                <div className="font-semibold text-xs text-foreground mb-0.5">
                  {withdrawingApp.profiles?.full_name || withdrawingApp.profiles?.username || 'Applicant'}
                </div>
                <div className="font-mono text-[11px] text-text-secondary">
                  Role: <span className="text-foreground font-medium">{withdrawingApp.role}</span>
                  {withdrawingApp.status ? ` • Current Status: ${withdrawingApp.status.toUpperCase()}` : ''}
                </div>
              </div>

              {withdrawingApp.status === 'accepted' && (
                <p className="font-sans text-red-400 text-xs mt-2.5 leading-relaxed">
                  Revoking this acceptance will remove the member from your squad and restore open team slots.
                </p>
              )}
            </div>

            {withdrawError && (
              <div 
                id="withdraw-error-alert"
                className="bg-red-500/10 border border-red-500/40 p-2.5 font-sans text-xs text-red-400 rounded-sm"
              >
                {withdrawError}
              </div>
            )}

            <div className="flex gap-2.5 mt-2">
              <button 
                id="cancel-withdraw-btn"
                onClick={handleCancelWithdraw}
                disabled={isWithdrawing}
                className="flex-1 h-9 px-4 bg-surface-elevated border border-border text-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#16191E] transition-colors disabled:opacity-50 rounded-sm"
              >
                CANCEL
              </button>
              <button 
                id="confirm-withdraw-btn"
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                className="flex-1 h-9 px-4 bg-accent hover:bg-hover-red text-white font-sans text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 rounded-sm flex items-center justify-center gap-1.5"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>WITHDRAWING...</span>
                  </>
                ) : (
                  <span>CONFIRM WITHDRAW</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
