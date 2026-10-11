import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { matchingService } from '../services/matchingService';
import { Check, X, ShieldCheck, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatExternalUrl, formatWhatsAppUrl, formatTelUrl } from '../utils/formatters';

export default function MyTeamRequestsPage() {
  const { user } = useAuth();
  
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchHackathons = async () => {
      if (!user) return;
      try {
        const hacks = await hackathonService.getMyHackathons(user.id);
        setHackathons(hacks.filter((h: any) => h.status === 'OPEN'));
        if (hacks.length > 0) {
          setSelectedHackathonId(hacks[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, [user]);

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
      // Refresh
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

  if (loading && hackathons.length === 0) return <div className="flex-1 flex items-center justify-center font-mono">Loading...</div>;

  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full mb-10">
        <h1 className="heading-page uppercase mb-2">TEAM REQUESTS</h1>
        <p className="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase">
          REVIEW APPLICATIONS FOR YOUR HACKATHONS
        </p>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-2">
          <div className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">SELECT HACKATHON</div>
          {hackathons.length === 0 ? (
            <div className="p-4 border border-border text-center font-mono text-xs text-muted-foreground">No active hackathons.</div>
          ) : (
            hackathons.map((h: any) => (
              <button 
                key={h.id}
                onClick={() => setSelectedHackathonId(h.id)}
                className={`text-left p-4 border font-mono text-xs uppercase tracking-wider transition-colors ${selectedHackathonId === h.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:border-foreground text-muted-foreground'}`}
              >
                <div className="truncate font-bold mb-1">{h.title}</div>
                <div className="text-xs opacity-80">{h.open_positions} OPEN POSITIONS</div>
              </button>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {!selectedHackathonId ? (
            <div className="flex-1 border border-border bg-card p-12 text-center text-muted-foreground font-mono text-sm uppercase">
              Select a hackathon to view requests
            </div>
          ) : loading ? (
            <div className="flex-1 border border-border bg-card p-12 text-center text-muted-foreground font-mono text-sm uppercase animate-pulse">
              Loading requests...
            </div>
          ) : applications.length === 0 ? (
            <div className="flex-1 border border-border bg-card p-12 text-center flex flex-col items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4" />
              <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground">No applications received yet.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {actionError && (
                <div className="p-4 border border-accent bg-accent/10 text-accent font-mono text-xs tracking-wider uppercase">
                  {actionError}
                </div>
              )}
              {applications.map((app: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  key={app.id} 
                  className={`border ${app.status === 'accepted' ? 'border-accent bg-accent/5' : app.status === 'rejected' ? 'border-border bg-muted/30 opacity-70' : 'border-border bg-card'} p-6 flex flex-col`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-full overflow-hidden">
                        {app.profiles?.avatar_url ? (
                          <img src={app.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        {app.profiles?.username ? (
                          <Link to={`/profile/${app.profiles.username}`} className="heading-card uppercase leading-none mb-1.5 hover:text-accent transition-colors block">
                            {app.profiles?.full_name || app.profiles.username}
                          </Link>
                        ) : (
                          <div className="heading-card uppercase leading-none mb-1.5">{app.profiles?.full_name || 'Anonymous'}</div>
                        )}
                        <div className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{app.role} • {app.experience_level}</div>
                      </div>
                    </div>
                    {app.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(app.id, 'accepted')} className="px-4 py-2 min-h-[38px] bg-foreground text-background font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5">
                          <Check size={14} /> ACCEPT
                        </button>
                        <button onClick={() => handleAction(app.id, 'rejected')} className="px-4 py-2 min-h-[38px] border border-border font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors flex items-center gap-1.5">
                          <X size={14} /> REJECT
                        </button>
                      </div>
                    ) : (
                      <div className={`font-mono text-xs font-bold tracking-wider uppercase px-3 py-1.5 border ${app.status === 'accepted' ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>
                        {app.status}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 border-y border-border py-6">
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">MESSAGE</span>
                      <p className="font-sans text-sm sm:text-base leading-relaxed">{app.message}</p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">APPLICANT SKILLS</span>
                        <div className="flex flex-wrap gap-1.5">
                          {app.skills?.map((s: string) => <span key={s} className="px-2.5 py-1 bg-background border border-border font-mono text-xs uppercase">{s}</span>)}
                        </div>
                      </div>
                      {(app.github_url || app.portfolio_url) && (
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">LINKS</span>
                          <div className="flex gap-3">
                            {app.github_url && <a href={formatExternalUrl(app.github_url)} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-accent hover:underline">GITHUB</a>}
                            {app.portfolio_url && <a href={formatExternalUrl(app.portfolio_url)} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-accent hover:underline">PORTFOLIO</a>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Match Score */}
                  {app.matchData && (
                    <div className="bg-background border border-border p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-xs font-bold tracking-wider uppercase">MATCH SCORE</span>
                        <span className="font-display text-2xl sm:text-3xl text-accent">{app.matchData.matchScore}%</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{app.explanation?.summary}</p>
                    </div>
                  )}

                  {(app.contact_email || app.contact_phone) && (
                    <div className="w-full mt-4 flex flex-col gap-2">
                      <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 border-t border-border pt-4">APPLICANT CONTACT DETAILS</span>
                      {app.contact_phone && (
                        <div className="flex gap-2">
                          <a href={formatTelUrl(app.contact_phone)} className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[40px] bg-background border border-border hover:border-foreground transition-colors font-mono text-xs uppercase font-bold tracking-wider">
                            <Phone size={14} /> CALL
                          </a>
                          <a href={formatWhatsAppUrl(app.contact_phone)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[40px] bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-colors font-mono text-xs uppercase font-bold tracking-wider">
                            <MessageSquare size={14} /> WHATSAPP
                          </a>
                        </div>
                      )}
                      {app.contact_email && (
                        <a href={`mailto:${app.contact_email}`} className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[40px] bg-background border border-border hover:border-foreground transition-colors font-mono text-xs uppercase font-bold tracking-wider">
                          <Mail size={14} /> EMAIL
                        </a>
                      )}
                    </div>
                  )}
                  {(!app.contact_email && !app.contact_phone) && (
                    <div className="font-mono text-xs text-muted-foreground border border-border p-3 mt-4 text-center">NO CONTACT DETAILS PROVIDED</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
