import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileService } from '../services/profileService';
import type { Profile, Project, HackathonExperience } from '../types/database';
import { Globe, MapPin, GraduationCap, Building, Code2, Briefcase, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatExternalUrl } from '../utils/formatters';
const getInitials = (name?: string | null) => {
  if (!name || !name.trim()) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<HackathonExperience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      try {
        const data = await profileService.getProfileByUsername(username);
        if (data) {
          setProfile(data);
          const [projData, expData] = await Promise.all([
            profileService.getProjects(data.id),
            profileService.getHackathonExperience(data.id)
          ]);
          setProjects(projData || []);
          setExperiences(expData || []);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center font-mono animate-pulse">LOADING PROFILE...</div>;
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="heading-page mb-3 uppercase">PROFILE NOT FOUND</h2>
        <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-6">The user @{username} does not exist or has not set up their profile.</p>
        <Link to="/developers" className="px-6 py-3 min-h-[46px] bg-foreground text-background font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent transition-colors inline-flex items-center justify-center">
          DISCOVER DEVELOPERS
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-8 items-start mb-12 paper-panel p-6 sm:p-10 border border-border bg-card relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
        
        <div className="w-28 h-28 md:w-40 md:h-40 rounded-none border-2 border-foreground overflow-hidden flex-shrink-0 bg-background flex items-center justify-center relative">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`avatar-fallback w-full h-full items-center justify-center ${profile.avatar_url ? 'hidden' : 'flex'}`}>
            <span className="font-display text-4xl md:text-5xl text-muted-foreground">
              {getInitials(profile.full_name) || profile.full_name?.charAt(0) || '?'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="heading-page uppercase leading-none">{profile.full_name}</h1>
              <p className="font-mono text-accent text-base sm:text-lg mt-1.5 font-bold">@{profile.username}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {profile.github_url && (
                <a href={formatExternalUrl(profile.github_url)} target="_blank" rel="noopener noreferrer" className="p-2.5 min-h-[40px] min-w-[40px] border border-border hover:border-accent hover:text-accent transition-colors bg-background flex items-center justify-center">
                  <ExternalLink size={18} />
                </a>
              )}
              {profile.linkedin_url && (
                <a href={formatExternalUrl(profile.linkedin_url)} target="_blank" rel="noopener noreferrer" className="p-2.5 min-h-[40px] min-w-[40px] border border-border hover:border-accent hover:text-accent transition-colors bg-background flex items-center justify-center">
                  <ExternalLink size={18} />
                </a>
              )}
              {profile.portfolio_url && (
                <a href={formatExternalUrl(profile.portfolio_url)} target="_blank" rel="noopener noreferrer" className="p-2.5 min-h-[40px] min-w-[40px] border border-border hover:border-accent hover:text-accent transition-colors bg-background flex items-center justify-center">
                  <Globe size={18} />
                </a>
              )}
              {profile.leetcode_url && (
                <a href={formatExternalUrl(profile.leetcode_url)} target="_blank" rel="noopener noreferrer" className="p-2.5 min-h-[40px] min-w-[40px] border border-border hover:border-accent hover:text-accent transition-colors bg-background font-mono font-bold text-xs flex items-center justify-center">
                  LC
                </a>
              )}
            </div>
          </div>

          {profile.headline && (
            <p className="font-sans text-base sm:text-lg mb-6 text-foreground/90 max-w-2xl leading-relaxed">
              {profile.headline}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs sm:text-sm text-muted-foreground uppercase">
            {profile.location && (
              <div className="flex items-center gap-2"><MapPin size={16} /> {profile.location}</div>
            )}
            {profile.college && (
              <div className="flex items-center gap-2"><Building size={16} /> {profile.college}</div>
            )}
            {profile.department && (
              <div className="flex items-center gap-2"><GraduationCap size={16} /> {profile.department} ({profile.study_year})</div>
            )}
            {profile.availability_status && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile.availability_status === 'Looking for a team' ? 'bg-green-500' : profile.availability_status === 'Open to opportunities' ? 'bg-accent' : 'bg-red-500'}`} />
                {profile.availability_status}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Bio, Skills, Roles */}
        <div className="lg:col-span-1 space-y-10">
          {profile.bio && (
            <section>
              <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Briefcase size={16} /> ABOUT
              </h3>
              <p className="font-sans text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </section>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <section>
              <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Code2 size={16} /> SKILLS
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 text-xs font-mono border border-border bg-background uppercase">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.preferred_roles && profile.preferred_roles.length > 0 && (
            <section>
              <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Briefcase size={16} /> PREFERRED ROLES
              </h3>
              <div className="flex flex-col gap-2">
                {profile.preferred_roles.map((role, index) => (
                  <div key={index} className="px-3.5 py-2.5 font-mono text-xs sm:text-sm border-l-2 border-accent bg-background uppercase">
                    {role}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Projects, Experience */}
        <div className="lg:col-span-2 space-y-10">
          
          <section>
            <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Code2 size={16} /> PROJECTS & PORTFOLIO
            </h3>
            
            {projects.length === 0 ? (
              <p className="font-mono text-xs sm:text-sm text-muted-foreground uppercase">NO PROJECTS LISTED YET.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="border border-border p-5 sm:p-6 bg-card flex flex-col group hover:border-foreground transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="heading-card uppercase group-hover:text-accent transition-colors">{project.title}</h4>
                      {project.status && (
                        <span className="text-xs font-mono border border-border px-2.5 py-1 uppercase">{project.status}</span>
                      )}
                    </div>
                    {project.description && (
                      <p className="font-sans text-sm sm:text-base text-foreground/80 mb-5 flex-1 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="text-xs font-mono text-muted-foreground uppercase">
                            #{tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-4 mt-auto pt-4 border-t border-border/50">
                      {project.repository_url && (
                        <a href={formatExternalUrl(project.repository_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider hover:text-accent transition-colors">
                          <ExternalLink size={14} /> REPO
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={formatExternalUrl(project.demo_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider hover:text-accent transition-colors">
                          <Globe size={14} /> LIVE DEMO
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Briefcase size={16} /> HACKATHON EXPERIENCE
            </h3>
            
            {experiences.length === 0 ? (
              <p className="font-mono text-xs sm:text-sm text-muted-foreground uppercase">NO HACKATHON EXPERIENCE LISTED YET.</p>
            ) : (
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-border hover:border-accent transition-colors pl-6 py-2 relative">
                    <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-border group-hover:bg-accent transition-colors" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4 className="heading-card uppercase">{exp.hackathon_name}</h4>
                      {exp.event_date && (
                        <span className="font-mono text-xs text-muted-foreground uppercase">{exp.event_date}</span>
                      )}
                    </div>
                    {exp.project_title && (
                      <p className="font-sans text-sm sm:text-base font-bold mb-1">Project: {exp.project_title} {exp.project_url && <a href={exp.project_url} target="_blank" rel="noopener noreferrer" className="text-accent underline ml-2 text-sm">Link</a>}</p>
                    )}
                    {exp.role && (
                      <p className="font-mono text-xs sm:text-sm text-foreground/80 mb-2 uppercase">Role: {exp.role}</p>
                    )}
                    {exp.achievement && (
                      <div className="inline-block px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 font-mono text-xs font-bold uppercase mt-2">
                        🏆 {exp.achievement}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
