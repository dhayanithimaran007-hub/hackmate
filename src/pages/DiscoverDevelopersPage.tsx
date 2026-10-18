import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/database';
import { Search, ArrowRight, ArrowUpRight, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeUsername } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

const getInitials = (name?: string | null) => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function DiscoverDevelopersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'looking' | 'open'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'skills'>('newest');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await profileService.getAllProfiles();
        // Show discoverable developers with a real name or handle
        setProfiles((data || []).filter(p => (p.full_name || p.username) && p.available_for_hackathons !== false));
      } catch (err) {
        console.error('Failed to load profiles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const filteredAndSortedProfiles = useMemo(() => {
    return profiles
      .filter(p => {
        // Availability Filter
        if (availabilityFilter === 'looking') {
          const status = (p.availability_status || '').toLowerCase();
          if (!status.includes('team') && !status.includes('looking')) return false;
        } else if (availabilityFilter === 'open') {
          const status = (p.availability_status || '').toLowerCase();
          if (!status.includes('open') && !status.includes('opportunit')) return false;
        }

        // Search Filter
        if (!search.trim()) return true;
        const term = search.toLowerCase().trim();
        return Boolean(
          (p.full_name?.toLowerCase().includes(term)) ||
          (p.username?.toLowerCase().includes(term)) ||
          (p.headline?.toLowerCase().includes(term)) ||
          (p.bio?.toLowerCase().includes(term)) ||
          (p.college?.toLowerCase().includes(term)) ||
          (p.skills?.some(s => s.toLowerCase().includes(term))) ||
          (p.preferred_roles?.some(r => r.toLowerCase().includes(term)))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
        }
        if (sortBy === 'skills') {
          return (b.skills?.length || 0) - (a.skills?.length || 0);
        }
        // 'newest' default
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [profiles, search, availabilityFilter, sortBy]);

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Decorative Red Wireframe Earth in Top-Right Background */}
      <EarthBackground variant="top-right" />

      {/* Header & Page Title */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
            Find your <span className="text-accent">people.</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
            Meet builders ready for the next big idea.
          </p>
        </div>

        {/* Search and Filtering Toolbar */}
        <div className="mt-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-[#0E1013] border border-border rounded-sm">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search developers by name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3 pl-10 bg-[#101216] border border-border/80 focus:border-accent rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground placeholder:text-muted-foreground tracking-wide"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 sm:py-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={`h-9 px-3.5 rounded-sm text-xs font-sans font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                availabilityFilter === 'all'
                  ? 'bg-card text-foreground border border-accent/80 shadow-sm'
                  : 'bg-transparent text-text-secondary hover:text-foreground border border-transparent'
              }`}
            >
              All developers
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('looking')}
              className={`h-9 px-3.5 rounded-sm text-xs font-sans font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                availabilityFilter === 'looking'
                  ? 'bg-card text-foreground border border-accent/80 shadow-sm'
                  : 'bg-transparent text-text-secondary hover:text-foreground border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
              Looking for a team
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('open')}
              className={`h-9 px-3.5 rounded-sm text-xs font-sans font-medium uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                availabilityFilter === 'open'
                  ? 'bg-card text-foreground border border-accent/80 shadow-sm'
                  : 'bg-transparent text-text-secondary hover:text-foreground border border-transparent'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Open to opportunities
            </button>
          </div>

          {/* Sort Control */}
          <div className="relative shrink-0 flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort developers"
                className="w-full sm:w-auto h-9 pl-8 pr-7 bg-[#101216] border border-border/80 focus:border-accent rounded-sm font-sans text-xs font-medium uppercase tracking-wider text-text-secondary focus:text-foreground cursor-pointer outline-none appearance-none"
              >
                <option value="newest">Sort: Newest</option>
                <option value="name">Sort: Name (A-Z)</option>
                <option value="skills">Sort: Most Skills</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Developer Profile Cards Grid */}
      <div className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pb-16 pt-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className="h-48 border border-border/70 bg-card rounded-sm p-5 flex flex-col justify-between animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-elevated rounded-sm" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-surface-elevated rounded-sm" />
                    <div className="h-3 w-1/3 bg-surface-elevated rounded-sm" />
                  </div>
                </div>
                <div className="h-8 w-full bg-surface-elevated rounded-sm my-3" />
                <div className="h-4 w-1/2 bg-surface-elevated rounded-sm" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedProfiles.length === 0 ? (
          <div className="text-center py-24 border border-border bg-card/60 rounded-sm p-8 max-w-md mx-auto my-8">
            <p className="font-mono text-xs sm:text-sm text-text-secondary uppercase tracking-wider mb-3">
              No developers found matching your criteria.
            </p>
            <button
              onClick={() => { setSearch(''); setAvailabilityFilter('all'); }}
              className="font-mono text-xs font-bold text-accent hover:underline uppercase tracking-wider"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredAndSortedProfiles.map((profile, i) => {
              const handle = profile.username || sanitizeUsername(profile.full_name) || profile.id.slice(0, 8);
              const initials = getInitials(profile.full_name);
              const bioText = profile.headline || profile.bio || 'No bio added yet.';

              // Availability mapping based solely on actual profile field
              const isLooking = profile.availability_status?.toLowerCase().includes('team') || 
                                profile.availability_status === 'Looking for a team';
              const isOpen = profile.availability_status?.toLowerCase().includes('open') ||
                             profile.availability_status === 'Open to opportunities';

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link 
                    to={`/profile/${handle}`}
                    className="group block h-full bg-card border border-border hover:border-accent/70 transition-all duration-200 rounded-sm p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Avatar, Name, Handle, Subtle Arrow */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Compact Avatar or Initials Block */}
                          <div className="w-10 h-10 rounded-sm border border-border bg-surface-elevated flex items-center justify-center font-sans font-semibold text-xs text-foreground overflow-hidden shrink-0">
                            {profile.avatar_url ? (
                              <img 
                                src={profile.avatar_url} 
                                alt={profile.full_name || 'Developer Avatar'} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials');
                                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span className={`avatar-initials text-xs tracking-wider font-sans font-semibold text-text-secondary ${profile.avatar_url ? 'hidden' : 'flex'}`}>
                              {initials}
                            </span>
                          </div>

                          {/* Name & Handle */}
                          <div className="min-w-0 flex-1">
                            <h2 className="text-[15px] sm:text-base font-semibold text-foreground truncate group-hover:text-accent transition-colors leading-snug">
                              {profile.full_name || 'Anonymous Builder'}
                            </h2>
                            <p className="font-sans text-xs text-muted-foreground truncate mt-0.5">
                              @{handle}
                            </p>
                          </div>
                        </div>

                        {/* Top-Right Directional Arrow Affordance */}
                        <div className="text-muted-foreground group-hover:text-accent transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 pt-0.5">
                          <ArrowUpRight size={15} />
                        </div>
                      </div>

                      {/* Bio with graceful fallback */}
                      <p className="text-xs sm:text-[13px] text-text-secondary line-clamp-2 my-3 min-h-[36px] leading-relaxed">
                        {bioText}
                      </p>

                      {/* Small collection of actual skill tags */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs font-sans text-text-secondary bg-surface-elevated border border-border/80 px-2 py-0.5 rounded-sm tracking-wide truncate max-w-[120px]"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="text-xs font-sans text-muted-foreground px-1">
                              +{profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Availability Indicator & View Profile */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                      {/* Availability status marker (only rendered if actual data exists) */}
                      {profile.availability_status ? (
                        <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary truncate">
                          <span 
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isLooking 
                                ? 'bg-success' 
                                : isOpen 
                                  ? 'bg-accent' 
                                  : 'bg-muted-foreground'
                            }`} 
                          />
                          <span className="truncate">{profile.availability_status}</span>
                        </div>
                      ) : (
                        <span />
                      )}

                      {/* View Profile Action */}
                      <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-text-secondary group-hover:text-accent transition-colors ml-auto shrink-0">
                        View profile <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
