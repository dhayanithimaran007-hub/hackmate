import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hackathonService } from '../services/hackathonService';
import { ArrowRight, Search, Filter, Users, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate } from '../utils/formatters';
import { LightBeamButton } from '../components/ui/LightBeamButton';

export default function DiscoverHackathonsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const navigate = useNavigate();

  const fetchHackathons = async (search?: string, mode?: string) => {
    setLoading(true);
    try {
      const data = await hackathonService.getHackathons({ mode });
      if (search) {
        const s = search.toLowerCase();
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

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setModeFilter(val);
    fetchHackathons(searchTerm, val);
  };

  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      {/* Header */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full mb-12">
        <h1 className="heading-page mb-6">
          DISCOVER<br/><span className="text-muted-foreground">HACKATHONS</span>
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH BY NAME OR SKILLS..."
              className="w-full bg-card border border-border h-[50px] px-4 pl-11 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1 sm:flex-initial">
              <select 
                value={modeFilter}
                onChange={handleModeChange}
                className="w-full h-[50px] bg-card border border-border px-5 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-foreground transition-colors appearance-none pr-11"
              >
                <option value="All">ALL MODES</option>
                <option value="Online">ONLINE</option>
                <option value="Offline">OFFLINE</option>
                <option value="Hybrid">HYBRID</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
            <LightBeamButton 
              type="submit" 
              size="md" 
              className="h-[50px] shrink-0"
            >
              SEARCH
            </LightBeamButton>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-card border border-border animate-pulse"></div>
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="w-full p-16 md:p-24 bg-card border border-border text-center flex flex-col items-center">
            <Search className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="heading-section uppercase mb-3">NO HACKATHONS AVAILABLE YET</h3>
            <p className="font-sans text-muted-foreground text-sm sm:text-base mb-6 max-w-md">Try adjusting your search criteria or be the first to organize one.</p>
            <LightBeamButton 
              onClick={() => navigate('/hackathons/new')}
              size="md"
            >
              CREATE A HACKATHON
            </LightBeamButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {hackathons.map((h, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                key={h.id}
                onClick={() => navigate(`/hackathons/${h.id}`)}
                className="paper-panel group cursor-pointer p-6 md:p-8 flex flex-col h-full bg-card hover:bg-background transition-colors border border-border hover:border-foreground"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xs tracking-wider uppercase font-bold border border-foreground/20 px-2 py-1 group-hover:border-accent group-hover:text-accent transition-colors">
                    {h.mode}
                  </span>
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users size={13} /> {h.team_size}/{h.max_team_size}
                  </div>
                </div>

                <h3 className="heading-card mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                  {h.title}
                </h3>
                
                {h.profiles && (
                  <p className="font-mono text-xs tracking-wider text-foreground/70 uppercase mb-3 truncate">
                    BY {h.profiles.full_name} {h.profiles.college ? `• ${h.profiles.college}` : ''}
                  </p>
                )}

                <p className="font-sans text-muted-foreground text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                  {h.description}
                </p>

                <div className="flex flex-col gap-2.5 font-mono text-xs tracking-wider text-muted-foreground uppercase border-t border-border pt-5">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-foreground shrink-0" />
                    <span>EVENT: {formatDisplayDate(h.event_date)}</span>
                  </div>
                  
                  {h.mode === 'Online' ? (
                    <div className="flex items-center gap-2.5">
                      <MapPin size={14} className="text-foreground shrink-0" />
                      <span>ONLINE EVENT — NO PHYSICAL VENUE</span>
                    </div>
                  ) : (
                    <>
                      {(h.district || h.state) && (
                        <div className="flex items-center gap-2.5">
                          <MapPin size={14} className="text-foreground shrink-0" />
                          <span className="truncate">{[h.district, h.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {h.hosting_college && (
                        <div className="flex items-center gap-2.5">
                          <Users size={14} className="text-foreground shrink-0" />
                          <span className="truncate">HOSTED BY {h.hosting_college}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 text-foreground font-mono text-xs font-bold tracking-wider uppercase group-hover:text-accent transition-colors">
                  <span>VIEW DETAILS</span> <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
