import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { applicationService } from '../services/applicationService';
import { ArrowRight, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      if (!user) return;
      try {
        const data = await applicationService.getMyApplications(user.id);
        setApplications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [user]);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 text-accent border border-accent/30 bg-accent/10 px-2.5 py-1 rounded-sm font-mono text-xs font-bold">
            <CheckCircle2 size={13} /> ACCEPTED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-red-400 border border-red-500/30 bg-red-500/10 px-2.5 py-1 rounded-sm font-mono text-xs font-bold">
            <XCircle size={13} /> REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-text-secondary border border-border bg-surface-elevated px-2.5 py-1 rounded-sm font-mono text-xs font-medium">
            <Clock size={13} /> PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital curves */}
      <EarthBackground variant="minimal" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
              MY <span className="text-accent">APPLICATIONS.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
              Track the status of your applications to join hackathon squads.
            </p>
          </div>

          <Link 
            to="/discover"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-card border border-border hover:border-accent text-foreground hover:text-accent font-sans text-xs font-semibold uppercase tracking-wider transition-all shrink-0"
          >
            <Search size={14} />
            <span>FIND HACKATHONS</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-card border border-border rounded-sm animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="w-full p-12 md:p-16 border border-border bg-card rounded-sm flex flex-col items-center justify-center text-center max-w-lg mx-auto my-8">
            <h2 className="text-lg font-semibold uppercase mb-2">No applications sent</h2>
            <p className="font-sans text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
              You haven't submitted any requests to join hackathon teams yet. Explore events and reach out to team leads.
            </p>
            <Link 
              to="/discover"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-sm bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-hover-red transition-all"
            >
              <span>BROWSE HACKATHONS</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.25) }}
                key={app.id} 
                className="p-4 sm:p-5 border border-border bg-card hover:border-accent/60 transition-colors rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2.5">
                    <span>{formatDisplayDate(app.created_at)}</span>
                    <span>•</span>
                    <span className="font-semibold text-text-secondary">{app.hackathons?.mode || 'EVENT'}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
                    {app.hackathons?.title || 'Hackathon Event'}
                  </h3>

                  <div className="font-sans text-xs text-text-secondary">
                    APPLIED AS: <span className="text-foreground font-semibold">{app.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <div>
                    {getStatusDisplay(app.status)}
                  </div>
                  
                  {app.hackathon_id && (
                    <Link 
                      to={`/hackathons/${app.hackathon_id}`}
                      className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-text-secondary hover:text-accent transition-colors"
                    >
                      <span>VIEW EVENT</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
