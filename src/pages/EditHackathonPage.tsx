import { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { hackathonService } from '../services/hackathonService';
import { HackathonForm } from '../components/hackathons/HackathonForm';
import { useAuth } from '../hooks/useAuth';
import type { Hackathon } from '../types/database';

export default function EditHackathonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      if (!id || !user) return;
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hackathon) return null;

  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full mb-10 text-center">
        <h1 className="heading-page mb-3">EDIT HACKATHON</h1>
        <p className="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase">
          UPDATE TEAM REQUIREMENTS
        </p>
      </div>

      <HackathonForm initialData={hackathon} isEditing />
    </div>
  );
}
