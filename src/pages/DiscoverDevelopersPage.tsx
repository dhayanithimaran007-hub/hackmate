import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/database';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoverDevelopersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await profileService.getAllProfiles();
        // Only show profiles that have set a username (completed initial setup)
        setProfiles((data || []).filter(p => p.username));
      } catch (err) {
        console.error('Failed to load profiles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => {
    const term = search.toLowerCase();
    return (
      (p.full_name?.toLowerCase().includes(term)) ||
      (p.username?.toLowerCase().includes(term)) ||
      (p.skills?.some(s => s.toLowerCase().includes(term))) ||
      (p.preferred_roles?.some(r => r.toLowerCase().includes(term))) ||
      (p.headline?.toLowerCase().includes(term)) ||
      (p.bio?.toLowerCase().includes(term)) ||
      (p.college?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border py-10 md:py-16 px-4">
        <div className="max-w-screen-xl mx-auto flex flex-col items-center text-center">
          <h1 className="heading-page mb-4">
            DISCOVER <span className="text-accent">DEVELOPERS</span>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-8 max-w-2xl">
            FIND TEAMMATES FOR YOUR NEXT HACKATHON. SEARCH BY SKILLS, ROLES, OR NAME.
          </p>
          
          <div className="w-full max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="SEARCH DEVELOPERS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[50px] px-4 pl-11 bg-card border border-border focus:border-accent outline-none font-mono uppercase text-sm tracking-wider"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 border border-border bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20 font-mono text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
            NO DEVELOPERS FOUND MATCHING YOUR CRITERIA.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  to={`/profile/${profile.username}`}
                  className="block h-full border border-border bg-card p-6 hover:border-accent transition-all group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -z-10 group-hover:bg-accent/10 transition-colors" />
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-none border border-border overflow-hidden bg-background flex items-center justify-center flex-shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl text-muted-foreground">
                          {profile.full_name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="heading-card truncate group-hover:text-accent transition-colors">
                        {profile.full_name}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </div>

                  <p className="font-sans text-sm text-foreground/80 mb-5 line-clamp-2 min-h-[40px] leading-relaxed">
                    {profile.headline || profile.bio || 'No bio provided.'}
                  </p>

                  <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-border/50">
                    {profile.availability_status && (
                      <div className="font-mono text-xs uppercase flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${profile.availability_status === 'Looking for a team' ? 'bg-green-500' : profile.availability_status === 'Open to opportunities' ? 'bg-accent' : 'bg-red-500'}`} />
                        <span className="truncate">{profile.availability_status}</span>
                      </div>
                    )}
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="text-xs font-mono bg-background border border-border px-2 py-0.5 uppercase">
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 4 && (
                          <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5">
                            +{profile.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
