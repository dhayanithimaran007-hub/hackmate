import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hackathonService } from '../services/hackathonService';
import { HackathonForm } from '../components/hackathons/HackathonForm';
import { useAuth } from '../hooks/useAuth';
import type { Hackathon } from '../types/database';
import EarthBackground from '../components/ui/EarthBackground';

export default function EditHackathonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      if (!user) {
        return;
      }
      try {
        const data = await hackathonService.getHackathon(id);
        if (!data || data.organizer_id !== user.id) {
          navigate('/hackathons');
          return;
        }
        setHackathon(data);
      } catch (err) {
        console.error(err);
        navigate('/hackathons');
      } finally {
        setLoading(false);
      }
    };
    fetchHackathon();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[300px]">
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse text-muted-foreground">
          Loading Hackathon Data...
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-background text-foreground">
        <h2 className="text-xl font-bold uppercase mb-2">HACKATHON NOT FOUND</h2>
        <p className="font-sans text-xs sm:text-sm text-text-secondary mb-6 max-w-md">
          The requested hackathon could not be found or you do not have permission to edit it.
        </p>
        <button
          type="button"
          onClick={() => navigate('/hackathons')}
          className="h-10 px-5 bg-accent text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-hover-red transition-all"
        >
          Return to My Hackathons
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital curves */}
      <EarthBackground variant="minimal" />

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
          EDIT <span className="text-accent">HACKATHON.</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-md mx-auto leading-relaxed">
          Update team requirements, open positions, and competition details.
        </p>
      </div>

      <div className="relative z-10 w-full px-4 md:px-8 pb-16">
        <HackathonForm initialData={hackathon} isEditing />
      </div>
    </div>
  );
}
