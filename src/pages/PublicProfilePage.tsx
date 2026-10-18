import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import type { Profile, Project, HackathonExperience } from '../types/database';
import { 
  Globe, MapPin, GraduationCap, Building, Code2, Briefcase, 
  ExternalLink, Mail, Copy, Check, Lock, ArrowLeft 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatExternalUrl, sanitizeUsername } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

const getInitials = (name?: string | null) => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<HackathonExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

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
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
        Retrieving developer credentials...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background text-foreground">
        <h2 className="text-xl font-bold uppercase mb-2">DEVELOPER NOT FOUND</h2>
        <p className="font-sans text-xs sm:text-sm text-text-secondary mb-6">
          The user @{username} does not exist or has not set up their profile.
        </p>
        <Link 
          to="/developers" 
          className="h-10 px-5 bg-accent text-white font-mono text-xs font-bold uppercase rounded-sm inline-flex items-center hover:bg-hover-red transition-all"
        >
          Discover Developers
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(user && profile && user.id === profile.id);

  // Email computation honoring privacy preferences
  const rawEmail = profile.email || (isOwner ? (user?.user_metadata?.contact_email || user?.email) : null);
  const isEmailPublic = profile.is_email_public ?? (isOwner ? (user?.user_metadata?.is_email_public ?? true) : true);
  const publicEmail = isEmailPublic ? rawEmail : (isOwner ? rawEmail : null);

  // Phone computation honoring privacy preferences
  const rawPhone = profile.phone || (isOwner ? user?.user_metadata?.contact_phone : null);
  const isPhonePublic = profile.is_phone_public ?? (isOwner ? (user?.user_metadata?.is_phone_public ?? true) : true);
  const publicPhone = isPhonePublic ? rawPhone : (isOwner ? rawPhone : null);

  const isLooking = profile.availability_status?.toLowerCase().includes('team') || 
                    profile.availability_status === 'Looking for a team';
  const isOpen = profile.availability_status?.toLowerCase().includes('open') || 
                 profile.availability_status === 'Open to opportunities';

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital curves */}
      <EarthBackground variant="minimal" />

      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 md:px-8 py-8 md:py-14">
        
        {/* Back Link */}
        <Link 
          to="/developers" 
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider uppercase font-semibold text-text-secondary hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          <span>BACK TO DEVELOPERS</span>
        </Link>

        {/* Profile Hero Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 md:gap-8 items-start mb-10 p-6 md:p-8 rounded-sm border border-border bg-card relative"
        >
          {/* Avatar / Initials */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm border border-border bg-surface-elevated flex items-center justify-center font-mono font-bold text-2xl text-foreground shrink-0 overflow-hidden">
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
            <span className={`avatar-fallback ${profile.avatar_url ? 'hidden' : 'flex'}`}>
              {getInitials(profile.full_name)}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground leading-tight truncate">
                  {profile.full_name || 'Anonymous Builder'}
                </h1>
                <p className="font-mono text-xs sm:text-sm text-accent font-semibold mt-0.5">
                  @{profile.username || sanitizeUsername(profile.full_name) || 'developer'}
                </p>
              </div>
              
              {/* External Links Bar */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {publicEmail && (
                  <a 
                    href={`mailto:${publicEmail}`} 
                    title={`Email ${publicEmail}`}
                    className="h-8 px-2.5 rounded-sm border border-border hover:border-accent hover:text-accent bg-surface-elevated flex items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors"
                  >
                    <Mail size={13} />
                    <span>EMAIL</span>
                  </a>
                )}
                {profile.github_url && (
                  <a 
                    href={formatExternalUrl(profile.github_url)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-8 px-2.5 rounded-sm border border-border hover:border-accent hover:text-accent bg-surface-elevated flex items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>GITHUB</span>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={formatExternalUrl(profile.linkedin_url)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-8 px-2.5 rounded-sm border border-border hover:border-accent hover:text-accent bg-surface-elevated flex items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>LINKEDIN</span>
                  </a>
                )}
                {profile.portfolio_url && (
                  <a 
                    href={formatExternalUrl(profile.portfolio_url)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="h-8 px-2.5 rounded-sm border border-border hover:border-accent hover:text-accent bg-surface-elevated flex items-center gap-1.5 font-mono text-xs text-text-secondary transition-colors"
                  >
                    <Globe size={13} />
                    <span>PORTFOLIO</span>
                  </a>
                )}
                {isOwner && (
                  <Link 
                    to="/profile"
                    className="h-8 px-3 rounded-sm bg-accent text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-hover-red transition-all flex items-center gap-1 shadow-sm ml-1"
                  >
                    <span>EDIT PROFILE</span>
                  </Link>
                )}
              </div>
            </div>

            {profile.headline && (
              <p className="text-xs sm:text-sm text-text-secondary font-sans leading-relaxed mb-4 max-w-2xl">
                {profile.headline}
              </p>
            )}

            {/* Quick Meta Tags */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground uppercase pt-3 border-t border-border/50">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-accent shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.college && (
                <div className="flex items-center gap-1.5">
                  <Building size={13} className="shrink-0" />
                  <span>{profile.college}</span>
                </div>
              )}
              {profile.department && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap size={13} className="shrink-0" />
                  <span>{profile.department} {profile.study_year ? `(${profile.study_year})` : ''}</span>
                </div>
              )}
              {profile.availability_status && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isLooking 
                      ? 'bg-success' 
                      : isOpen 
                        ? 'bg-accent' 
                        : 'bg-muted-foreground'
                  }`} />
                  <span className="text-text-secondary">{profile.availability_status}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Bio, Contact, Skills */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {profile.bio && (
              <div className="p-5 rounded-sm bg-card border border-border">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-accent" />
                  <span>ABOUT</span>
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Contact Details Card */}
            <div className="p-5 rounded-sm bg-card border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Mail size={14} className="text-accent" />
                  <span>DIRECT REACH</span>
                </h3>
                {isOwner && (
                  <Link to="/profile" className="font-mono text-[11px] text-accent hover:underline uppercase">
                    [ EDIT ]
                  </Link>
                )}
              </div>

              {!publicEmail && !publicPhone ? (
                <p className="font-mono text-xs text-muted-foreground py-2 flex items-center gap-1.5">
                  <Lock size={12} /> No public contact information shared.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {publicEmail && (
                    <div className="p-2.5 rounded-sm bg-[#0E1013] border border-border/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase block">EMAIL</span>
                        <a href={`mailto:${publicEmail}`} className="font-mono text-xs text-foreground hover:text-accent truncate block">
                          {publicEmail}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(publicEmail)}
                        className="p-1.5 border border-border hover:border-accent text-text-secondary hover:text-accent rounded-sm shrink-0"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}

                  {publicPhone && (
                    <div className="p-2.5 rounded-sm bg-[#0E1013] border border-border/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase block">PHONE</span>
                        <a href={`tel:${publicPhone}`} className="font-mono text-xs text-foreground hover:text-accent truncate block">
                          {publicPhone}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(publicPhone)}
                        className="p-1.5 border border-border hover:border-accent text-text-secondary hover:text-accent rounded-sm shrink-0"
                        title="Copy phone"
                      >
                        {copiedPhone ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="p-5 rounded-sm bg-card border border-border">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Code2 size={14} className="text-accent" />
                  <span>TECHNICAL SKILLS</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-0.5 rounded-sm text-xs font-mono border border-border bg-surface-elevated text-text-secondary uppercase"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Roles */}
            {profile.preferred_roles && profile.preferred_roles.length > 0 && (
              <div className="p-5 rounded-sm bg-card border border-border">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-accent" />
                  <span>DESIRED SQUAD ROLES</span>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {profile.preferred_roles.map((role, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-1.5 rounded-sm font-mono text-xs border-l-2 border-accent bg-surface-elevated text-foreground uppercase"
                    >
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Projects & Hackathons */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Projects */}
            <div className="p-5 sm:p-6 rounded-sm bg-card border border-border">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <Code2 size={14} className="text-accent" />
                <span>PROJECTS & PORTFOLIO</span>
              </h3>
              
              {projects.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground uppercase py-4">
                  No public projects added yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-4 rounded-sm border border-border/80 bg-[#0E1013] hover:border-accent/60 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">{project.title}</h4>
                          {project.status && (
                            <span className="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded-sm uppercase text-text-secondary">
                              {project.status}
                            </span>
                          )}
                        </div>

                        {project.description && (
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-3">
                            {project.description}
                          </p>
                        )}
                        
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {project.technologies.map((tech, i) => (
                              <span key={i} className="text-[10px] font-mono text-muted-foreground">
                                #{tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-border/60 flex items-center gap-3 font-mono text-xs mt-auto">
                        {project.repository_url && (
                          <a 
                            href={formatExternalUrl(project.repository_url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Repository
                          </a>
                        )}
                        {project.demo_url && (
                          <a 
                            href={formatExternalUrl(project.demo_url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-foreground hover:text-accent flex items-center gap-1"
                          >
                            <Globe size={11} /> Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hackathon Experience */}
            <div className="p-5 sm:p-6 rounded-sm bg-card border border-border">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <Briefcase size={14} className="text-accent" />
                <span>HACKATHON TRACK RECORD</span>
              </h3>
              
              {experiences.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground uppercase py-4">
                  No hackathon experience listed yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="p-3.5 rounded-sm bg-[#0E1013] border border-border/70 border-l-2 border-l-accent">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4 className="text-sm font-semibold text-foreground uppercase">{exp.hackathon_name}</h4>
                        {exp.event_date && (
                          <span className="font-mono text-[11px] text-muted-foreground">{exp.event_date}</span>
                        )}
                      </div>
                      {exp.project_title && (
                        <p className="text-xs text-text-secondary mb-1">
                          Project: <span className="text-foreground font-medium">{exp.project_title}</span>
                        </p>
                      )}
                      {exp.role && (
                        <p className="font-mono text-xs text-muted-foreground uppercase">Role: {exp.role}</p>
                      )}
                      {exp.achievement && (
                        <div className="inline-block px-2 py-0.5 rounded-sm bg-accent/10 text-accent border border-accent/20 font-mono text-[11px] font-bold uppercase mt-2">
                          🏆 {exp.achievement}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
