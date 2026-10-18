import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import type { Hackathon } from '../types/database';
import { Settings, Users, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function MyHackathonsPage() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    const fetchHackathons = async () => {
      if (!user) return;
      try {
        const data = await hackathonService.getMyHackathons(user.id);
        setHackathons(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, [user]);

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
    setDeleteError('');
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
    setDeleteTitle('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || !user) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await hackathonService.deleteHackathon(deleteId, user.id);
      setHackathons(prev => prev.filter(h => h.id !== deleteId));
      setSuccessToast('Hackathon deleted successfully.');
      setTimeout(() => setSuccessToast(''), 3000);
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23503') {
        setDeleteError('Cannot delete hackathon because it has active team applications or members. Please remove them first.');
      } else {
        setDeleteError(err.message || 'Failed to delete hackathon.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital curves background */}
      <EarthBackground variant="minimal" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
              MY <span className="text-accent">HACKATHONS.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
              Manage your posted events, squad requirements, and team applications.
            </p>
          </div>

          <Link
            to="/hackathons/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-hover-red transition-all shrink-0"
          >
            <Plus size={14} />
            <span>POST HACKATHON</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-60 bg-card border border-border rounded-sm animate-pulse p-5" />
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="w-full p-12 md:p-20 border border-border bg-card rounded-sm flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8">
            <h2 className="text-xl font-bold uppercase mb-2">NO HACKATHONS POSTED YET</h2>
            <p className="font-sans text-sm text-text-secondary mb-6 max-w-md">
              You haven't posted any hackathons yet. Create an event listing to start forming your team.
            </p>
            <Link
              to="/hackathons/new"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-sm bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-hover-red transition-all"
            >
              <Plus size={14} />
              <span>POST YOUR FIRST HACKATHON</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {hackathons.map((h: any, i: number) => {
              const appCount = h.applications?.[0]?.count || 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  key={h.id} 
                  className="bg-card border border-border hover:border-accent/60 transition-all rounded-sm p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Status & Date */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-mono text-[11px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm border ${
                        h.status === 'OPEN' 
                          ? 'bg-success/10 text-success border-success/30' 
                          : 'bg-surface-elevated text-muted-foreground border-border'
                      }`}>
                        {h.status}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatDisplayDate(h.created_at)}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 hover:text-accent transition-colors leading-snug mb-3">
                      <Link to={`/hackathons/${h.id}`}>{h.title}</Link>
                    </h2>
                    
                    {/* Metrics List */}
                    <div className="flex flex-col gap-2 font-mono text-xs text-text-secondary mb-5 p-3 rounded-sm bg-[#0E1013] border border-border/60">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">OPEN POSITIONS:</span>
                        <span className="text-foreground font-semibold">{h.open_positions} / {h.max_team_size}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">MODE:</span>
                        <span className="text-foreground font-semibold">{h.mode.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">DEADLINE:</span>
                        <span className="text-foreground font-semibold">{formatDisplayDate(h.registration_deadline)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-border/60 flex items-center gap-2 mt-auto">
                    <Link 
                      to={`/hackathons/${h.id}`}
                      className="flex-1 h-9 bg-surface-elevated border border-border text-center font-sans text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-foreground hover:border-accent/60 transition-colors flex items-center justify-center gap-1.5 rounded-sm"
                    >
                      <Users size={13} />
                      <span>TEAM</span>
                      {appCount > 0 && (
                        <span className="bg-accent text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {appCount}
                        </span>
                      )}
                    </Link>

                    <Link 
                      to={`/hackathons/${h.id}/edit`}
                      className="h-9 px-3.5 bg-surface-elevated border border-border text-center font-sans text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-foreground hover:border-accent/60 transition-colors flex items-center justify-center gap-1.5 rounded-sm"
                      title="Edit Hackathon Details"
                    >
                      <Settings size={13} />
                      <span>EDIT</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteClick(h.id, h.title)}
                      className="h-9 px-3 bg-surface-elevated border border-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/60 hover:bg-red-500/10 transition-colors flex items-center justify-center rounded-sm"
                      title="Delete Hackathon"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-card border border-success text-success px-5 py-3 font-sans text-xs font-semibold tracking-wider uppercase shadow-xl z-50 rounded-sm">
          {successToast}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-[#090A0C]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border p-6 max-w-md w-full shadow-2xl rounded-sm flex flex-col gap-4"
          >
            <div className="flex items-center gap-2.5 text-accent">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-lg uppercase tracking-tight">CONFIRM DELETION</h3>
            </div>
            
            <div>
              <p className="font-sans text-xs text-text-secondary mb-2">Are you sure you want to permanently remove:</p>
              <p className="font-sans text-xs font-semibold bg-[#101216] p-3 border border-border rounded-sm text-foreground">
                "{deleteTitle}"
              </p>
              <p className="font-sans text-red-400 text-xs mt-2.5">
                This action cannot be undone. All associated squad listing records will be removed.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/40 p-2.5 font-sans text-xs text-red-400 rounded-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 h-9 px-4 bg-surface-elevated border border-border text-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#16191E] transition-colors disabled:opacity-50 rounded-sm"
              >
                CANCEL
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 h-9 px-4 bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 rounded-sm"
              >
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
