import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import type { Hackathon } from '../types/database';
import { Settings, Users, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate } from '../utils/formatters';

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

  if (loading) {
    return <div className="flex-1 flex items-center justify-center font-mono text-xs tracking-widest uppercase animate-pulse">Loading...</div>;
  }

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
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
        <div>
          <h1 className="heading-page mb-2">MY HACKATHONS</h1>
          <p className="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase">
            MANAGE YOUR POSTED HACKATHONS
          </p>
        </div>
        <Link 
          to="/hackathons/new"
          className="mt-6 md:mt-0 px-5 py-3 bg-foreground text-background font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-300 flex items-center gap-2 min-h-[46px]"
        >
          <Plus size={16} />
          POST HACKATHON
        </Link>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full">
        {hackathons.length === 0 ? (
          <div className="w-full p-12 md:p-20 border border-border bg-card flex flex-col items-center justify-center text-center">
            <h3 className="heading-section uppercase mb-3">NO HACKATHONS POSTED</h3>
            <p className="font-sans text-sm sm:text-base text-muted-foreground mb-6 max-w-md">You haven't posted any hackathons yet. Create one to start building your team.</p>
            <Link 
              to="/hackathons/new"
              className="px-6 py-3.5 bg-background border border-foreground text-foreground font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors duration-300 min-h-[48px] inline-flex items-center"
            >
              POST YOUR FIRST HACKATHON
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hackathons.map((h: any, i: number) => {
              const appCount = h.applications?.[0]?.count || 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={h.id} 
                  className="paper-panel p-6 flex flex-col group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`font-mono text-xs tracking-wider uppercase font-bold px-2 py-1 ${h.status === 'OPEN' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-muted border border-border text-muted-foreground'}`}>
                      {h.status}
                    </span>
                    <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground">
                      {formatDisplayDate(h.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="heading-card mb-3 group-hover:text-accent transition-colors">{h.title}</h3>
                  
                  <div className="flex flex-col gap-2.5 font-mono text-xs tracking-wider text-muted-foreground mb-6">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span>OPEN POSITIONS:</span>
                      <span className="text-foreground font-bold">{h.open_positions} / {h.max_team_size}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span>MODE:</span>
                      <span className="text-foreground font-bold">{h.mode.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEADLINE:</span>
                      <span className="text-foreground font-bold">{formatDisplayDate(h.registration_deadline)}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link 
                      to={`/hackathons/${h.id}`}
                      className="flex-1 py-2.5 bg-background border border-border text-center font-mono text-xs font-bold uppercase tracking-wider hover:border-foreground transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
                    >
                      <Users size={14} /> TEAM
                      {appCount > 0 && <span className="bg-accent text-white px-1.5 rounded-none text-xs">{appCount}</span>}
                    </Link>
                    <Link 
                      to={`/hackathons/${h.id}/edit`}
                      className="flex-1 py-2.5 bg-foreground text-background text-center font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
                    >
                      <Settings size={14} /> EDIT
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(h.id, h.title)}
                      className="flex-none px-3.5 py-2.5 bg-background border border-red-900/30 text-red-500 text-center font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 hover:border-red-500 transition-colors flex items-center justify-center min-h-[42px]"
                      title="Delete Hackathon"
                    >
                      <Trash2 size={14} />
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
        <div className="fixed bottom-8 right-8 bg-green-900/90 border border-green-500 text-green-100 px-6 py-4 font-mono text-xs tracking-wider uppercase shadow-2xl z-50">
          {successToast}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={22} />
              <h3 className="heading-section uppercase">DELETE HACKATHON</h3>
            </div>
            
            <div>
              <p className="font-sans text-sm text-muted-foreground mb-2">Are you sure you want to delete:</p>
              <p className="font-mono text-sm font-bold bg-background p-3 border border-border">"{deleteTitle}"</p>
              <p className="font-sans text-red-400 text-xs sm:text-sm mt-3">This action cannot be undone.</p>
            </div>

            {deleteError && (
              <div className="bg-red-900/20 border border-red-500/50 p-3 font-mono text-xs tracking-wider uppercase text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button 
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-background border border-border text-foreground font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent/10 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                CANCEL
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isDeleting ? 'DELETING...' : 'DELETE HACKATHON'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
