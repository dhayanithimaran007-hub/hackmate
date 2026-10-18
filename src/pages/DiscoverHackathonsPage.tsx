import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hackathonService } from '../services/hackathonService';
import { ArrowRight, Search, Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function DiscoverHackathonsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const navigate = useNavigate();

  const fetchHackathons = async (search?: string, mode?: string) => {
    setLoading(true);
    try {
      const data = await hackathonService.getHackathons({ mode: mode === 'All' ? undefined : mode });
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        setHackathons(data.filter((h: any) => 
          (h.title && h.title.toLowerCase().includes(s)) ||
          (h.profiles?.full_name && h.profiles.full_name.toLowerCase().includes(s)) ||
          (h.profiles?.college && h.profiles.college.toLowerCase().includes(s)) ||
          (h.district && h.district.toLowerCase().includes(s)) ||
          (h.state && h.state.toLowerCase().includes(s)) ||
          (h.hosting_college && h.hosting_college.toLowerCase().includes(s)) ||
          (h.description && h.description.toLowerCase().includes(s)) ||
          (Array.isArray(h.skills) && h.skills.some((skill: string) => skill.toLowerCase().includes(s))) ||
          (Array.isArray(h.required_roles) && h.required_roles.some((role: string) => role.toLowerCase().includes(s)))
        ));
      } else {
        setHackathons(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const data = await hackathonService.getHackathons();
        if (isMounted) setHackathons(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHackathons(searchTerm, modeFilter);
  };

  const handleModeChange = (mode: string) => {
    setModeFilter(mode);
    fetchHackathons(searchTerm, mode);
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Restrained Orbital Earth Motif behind title & search */}
      <EarthBackground variant="subtle-top" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
              DISCOVER <span className="text-accent">HACKATHONS.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
              Find upcoming competitions, explore required team roles, and apply to open positions.
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

        {/* Compact Search and Filtering Toolbar */}
        <form 
          onSubmit={handleSearch} 
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 bg-[#0E1013] border border-border rounded-sm"
        >
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event title, college, skills, or location..."
              className="w-full h-10 px-3 pl-10 bg-[#101216] border border-border/80 focus:border-accent rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground placeholder:text-muted-foreground tracking-wide"
            />
          </div>

          {/* Mode Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 sm:py-0">
            {['All', 'Online', 'Offline', 'Hybrid'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`h-9 px-3 rounded-sm text-xs font-sans font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                  modeFilter === mode
                    ? 'bg-card text-foreground border border-accent/80 shadow-sm'
                    : 'bg-transparent text-text-secondary hover:text-foreground border border-transparent'
                }`}
              >
                {mode === 'All' ? 'All Modes' : mode}
              </button>
            ))}
          </div>

          {/* Submit Search Button */}
          <button 
            type="submit" 
            className="h-10 px-5 bg-card border border-border hover:border-accent text-foreground hover:text-accent font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-all shrink-0"
          >
            SEARCH
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="relative z-10 flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pb-16 pt-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-card border border-border rounded-sm animate-pulse p-5" />
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="w-full p-12 md:p-20 bg-card border border-border rounded-sm text-center flex flex-col items-center max-w-xl mx-auto my-8">
            <Search className="w-8 h-8 text-muted-foreground mb-4 opacity-70" />
            <h2 className="text-xl font-bold uppercase mb-2">No hackathons found</h2>
            <p className="font-sans text-text-secondary text-sm mb-6 max-w-md">
              No active hackathons matched your search criteria. Try modifying your filters or organize a new event.
            </p>
            <button 
              onClick={() => navigate('/hackathons/new')}
              className="inline-flex items-center gap-2 h-10 px-5 bg-accent text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-hover-red transition-all"
            >
              <Plus size={14} />
              <span>POST A HACKATHON</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {hackathons.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
              >
                <Link
                  to={`/hackathons/${h.id}`}
                  className="group block h-full bg-card border border-border hover:border-accent/70 transition-all duration-200 rounded-sm p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Status & Capacity Row */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-sans text-xs tracking-wider uppercase font-medium px-2 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent transition-colors">
                        {h.mode}
                      </span>
                      <div className="font-sans text-xs text-muted-foreground flex items-center gap-1.5 bg-surface-elevated/60 px-2 py-0.5 rounded-sm border border-border/50">
                        <Users size={12} className="text-text-secondary" />
                        <span>{h.team_size}/{h.max_team_size} members</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug mb-1">
                      {h.title}
                    </h2>
                    
                    {/* Organizer byline */}
                    {h.profiles && (
                      <p className="font-sans text-xs tracking-wider text-muted-foreground uppercase mb-2.5 truncate">
                        BY {h.profiles.full_name} {h.profiles.college ? `• ${h.profiles.college}` : ''}
                      </p>
                    )}

                    {/* Short Description */}
                    <p className="font-sans text-text-secondary text-xs sm:text-[13px] line-clamp-2 mb-3.5 leading-relaxed">
                      {h.description}
                    </p>

                    {/* Skills Chips */}
                    {h.skills && Array.isArray(h.skills) && h.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {h.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span 
                            key={idx}
                            className="text-xs font-sans text-text-secondary bg-surface-elevated border border-border/70 px-2 py-0.5 rounded-sm tracking-wide truncate max-w-[100px]"
                          >
                            {skill}
                          </span>
                        ))}
                        {h.skills.length > 3 && (
                          <span className="text-xs font-sans text-muted-foreground px-1">
                            +{h.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-3 border-t border-border/60 flex flex-col gap-2 mt-auto">
                    <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar size={12} className="text-accent shrink-0" />
                        <span className="truncate">{formatDisplayDate(h.event_date)}</span>
                      </div>
                      
                      {h.registration_deadline && (
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <Clock size={11} />
                          <span>Deadline: {formatDisplayDate(h.registration_deadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground truncate">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">
                          {h.mode === 'Online' 
                            ? 'Virtual' 
                            : [h.district, h.state].filter(Boolean).join(', ') || h.hosting_college || 'Offline'}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-text-secondary group-hover:text-accent transition-colors shrink-0">
                        View details <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
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
