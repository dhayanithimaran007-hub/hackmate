import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { applicationService } from '../services/applicationService';
import { ArrowRight, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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

  if (loading) {
    return <div className="flex-1 flex items-center justify-center font-mono text-xs tracking-widest uppercase animate-pulse">Loading...</div>;
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'accepted':
        return <span className="flex items-center gap-2 text-accent border border-accent/20 bg-accent/10 px-3 py-1 font-bold"><CheckCircle2 size={14} /> ACCEPTED</span>;
      case 'rejected':
        return <span className="flex items-center gap-2 text-red-500 border border-red-500/20 bg-red-500/10 px-3 py-1"><XCircle size={14} /> REJECTED</span>;
      default:
        return <span className="flex items-center gap-2 text-muted-foreground border border-border bg-card px-3 py-1"><Clock size={14} /> PENDING</span>;
    }
  };

  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="heading-page uppercase mb-2">MY APPLICATIONS</h1>
          <p className="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase">
            TRACK YOUR TEAM REQUESTS
          </p>
        </div>
        <Link 
          to="/discover"
          className="px-5 py-2.5 min-h-[46px] bg-foreground text-background font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <Search size={16} />
          FIND HACKATHONS
        </Link>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full">
        {applications.length === 0 ? (
          <div className="w-full p-10 md:p-16 border border-border bg-card flex flex-col items-center justify-center text-center">
            <h3 className="heading-card uppercase mb-3">NO APPLICATIONS SENT</h3>
            <p className="font-sans text-sm sm:text-base text-muted-foreground mb-6">You haven't applied to join any hackathon teams yet.</p>
            <Link 
              to="/discover"
              className="px-6 py-3 min-h-[46px] bg-background border border-foreground text-foreground font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors duration-300 inline-flex items-center justify-center"
            >
              BROWSE HACKATHONS
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map((app: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={app.id} 
                className="paper-panel p-5 sm:p-6 border border-border bg-card hover:border-foreground transition-colors group flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-3">
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-bold text-foreground">{app.hackathons?.mode}</span>
                  </div>
                  <h3 className="heading-card uppercase mb-1.5">{app.hackathons?.title || 'Unknown Hackathon'}</h3>
                  <div className="font-mono text-xs sm:text-sm text-muted-foreground">APPLIED AS: <span className="text-foreground font-bold">{app.role}</span></div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="font-mono text-xs tracking-wider uppercase">
                    {getStatusDisplay(app.status)}
                  </div>
                  
                  <Link 
                    to={`/hackathons/${app.hackathon_id}`}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
