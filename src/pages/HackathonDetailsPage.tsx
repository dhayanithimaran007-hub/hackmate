import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { ArrowLeft, MapPin, ExternalLink, ShieldCheck, Terminal, ShieldAlert, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileService } from '../services/profileService';
import { formatExternalUrl, formatTelUrl, formatDisplayDate } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

export default function HackathonDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hackathon, setHackathon] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [organizerContact, setOrganizerContact] = useState<{phone?: string, email?: string} | null>(null);

  // Application form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyRole, setApplyRole] = useState('');
  const [applySkills, setApplySkills] = useState('');
  const [applyExp, setApplyExp] = useState('Intermediate');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyEmail, setApplyEmail] = useState<string>(() => user?.email || user?.user_metadata?.contact_email || '');
  const [applyPhone, setApplyPhone] = useState<string>(() => user?.user_metadata?.contact_phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await hackathonService.getHackathon(id);
        if (!data) {
          setError('Hackathon not found');
          setLoading(false);
          return;
        }
        setHackathon(data);
        
        if (user) {
          setIsOwner(data.organizer_id === user.id);
          if (data.organizer_id !== user.id) {
            const existingApp = await applicationService.getApplication(id, user.id);
            if (existingApp) {
              setHasApplied(true);
              setApplication(existingApp);
              if (existingApp.status === 'accepted') {
                const contact = await profileService.getContactInfo(data.organizer_id);
                if (contact) setOrganizerContact(contact);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error loading hackathon');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hackathon) return;
    
    setSubmitting(true);
    setApplyError('');
    try {
      const newApp = await applicationService.submitApplication({
        hackathon_id: hackathon.id,
        applicant_id: user.id,
        role: applyRole,
        skills: applySkills.split(',').map(s => s.trim()).filter(Boolean),
        experience_level: applyExp,
        message: applyMessage,
        contact_email: applyEmail || null,
        contact_phone: applyPhone || null
      });
      setHasApplied(true);
      setApplication(newApp);
      setShowApplyForm(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505' || err.message?.includes('unique constraint') || err.message?.includes('duplicate key')) {
        setApplyError('You have already submitted an application for this hackathon.');
      } else {
        setApplyError(err.message || 'Unable to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
        Retrieving event details...
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold uppercase mb-2">EVENT NOT FOUND</h2>
        <p className="font-sans text-sm text-text-secondary mb-5">
          {error || 'The requested hackathon could not be found or has expired.'}
        </p>
        <Link to="/discover" className="h-9 px-4 bg-accent text-white font-mono text-xs font-bold uppercase rounded-sm inline-flex items-center">
          Back to Hackathons
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital background */}
      <EarthBackground variant="minimal" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8 py-8 md:py-12 w-full">
        
        {/* Back navigation */}
        <Link 
          to="/discover" 
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider uppercase font-semibold text-text-secondary hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          <span>BACK TO DISCOVER</span>
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Main Content (Left) */}
          <div className="flex-1 flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className={`font-mono text-[11px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm border ${
                hackathon.status === 'OPEN' 
                  ? 'bg-success/10 text-success border-success/30' 
                  : 'bg-surface-elevated text-muted-foreground border-border'
              }`}>
                {hackathon.status}
              </span>
              <span className="font-mono text-[11px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm border border-border bg-surface-elevated text-text-secondary">
                {hackathon.mode}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-foreground leading-tight mb-4">
              {hackathon.title}
            </h1>
            
            {hackathon.profiles && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-sm bg-card border border-border/80">
                <div className="w-9 h-9 rounded-sm border border-border bg-surface-elevated flex items-center justify-center font-mono font-bold text-xs text-foreground shrink-0 overflow-hidden">
                  {hackathon.profiles.avatar_url ? (
                    <img 
                      src={hackathon.profiles.avatar_url} 
                      alt="Organizer" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.org-avatar-fallback');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`org-avatar-fallback ${hackathon.profiles.avatar_url ? 'hidden' : 'flex'}`}>
                    {hackathon.profiles.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-foreground truncate">
                    {hackathon.profiles.username ? (
                      <Link to={`/profile/${hackathon.profiles.username}`} className="hover:text-accent transition-colors">
                        ORGANIZED BY {hackathon.profiles.full_name}
                      </Link>
                    ) : (
                      <span>ORGANIZED BY {hackathon.profiles.full_name}</span>
                    )}
                  </div>
                  {hackathon.profiles.college && (
                    <div className="font-mono text-[11px] text-muted-foreground uppercase truncate mt-0.5">
                      {hackathon.profiles.college}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-sm bg-[#0E1013] border border-border/70 mb-8 font-mono text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">EVENT DATE</span>
                <span className="font-semibold text-foreground">{formatDisplayDate(hackathon.event_date)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">DEADLINE</span>
                <span className="font-semibold text-foreground">{formatDisplayDate(hackathon.registration_deadline)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">OPEN ROLES</span>
                <span className="font-semibold text-foreground">{hackathon.open_positions} / {hackathon.max_team_size}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">EXPERIENCE</span>
                <span className="font-semibold text-foreground">{hackathon.experience_level}</span>
              </div>
            </div>

            {/* Event Description */}
            <div className="mb-8">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                ABOUT THIS HACKATHON
              </h2>
              <div className="p-5 rounded-sm bg-card border border-border text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {hackathon.description}
              </div>
            </div>

            {/* Required Skills */}
            {hackathon.skills && hackathon.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  REQUIRED SKILLS
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {hackathon.skills.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-sm border border-border bg-card font-mono text-xs text-text-secondary uppercase">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Open Roles */}
            {hackathon.required_roles && hackathon.required_roles.length > 0 && (
              <div className="mb-8">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  OPEN SQUAD POSITIONS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {hackathon.required_roles.map((r: string) => (
                    <div key={r} className="p-3 rounded-sm border border-border bg-card flex items-center gap-2.5">
                      <Terminal size={14} className="text-accent shrink-0" />
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Application Controls (Right) */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
            <div className="p-5 rounded-sm bg-card border border-border flex flex-col sticky top-20">
              
              {hackathon.hackathon_url && (
                <a 
                  href={formatExternalUrl(hackathon.hackathon_url)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 font-mono text-xs font-semibold text-accent hover:underline mb-4"
                >
                  <ExternalLink size={13} />
                  <span>OFFICIAL EVENT WEBSITE</span>
                </a>
              )}

              {/* Location Card */}
              <div className="flex items-start gap-2.5 mb-5 pb-5 border-b border-border/60">
                <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs font-mono">
                  <span className="text-[10px] text-muted-foreground uppercase mb-0.5">LOCATION</span>
                  {hackathon.mode === 'Online' ? (
                    <span className="text-foreground">Online Event — Virtual</span>
                  ) : (
                    <span className="text-foreground leading-normal">
                      {[hackathon.hosting_college, hackathon.venue, hackathon.city, hackathon.district, hackathon.state].filter(Boolean).join(', ') || 'Venue details to be announced'}
                    </span>
                  )}
                </div>
              </div>

              {/* Organizer Contact (if available) */}
              {(hackathon.contact_email || hackathon.contact_phone) && (
                <div className="flex flex-col gap-2 mb-5 pb-5 border-b border-border/60 text-xs font-mono">
                  <span className="text-[10px] text-muted-foreground uppercase">ORGANIZER CHANNELS</span>
                  {hackathon.contact_email && (
                    <a href={`mailto:${hackathon.contact_email}`} className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors truncate">
                      <Mail size={13} className="shrink-0" />
                      <span className="truncate">{hackathon.contact_email}</span>
                    </a>
                  )}
                  {hackathon.contact_phone && (
                    <a href={formatTelUrl(hackathon.contact_phone)} className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors truncate">
                      <Phone size={13} className="shrink-0" />
                      <span>{hackathon.contact_phone}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Owner Actions vs Application Form */}
              {isOwner ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-accent/10 border border-accent/30 p-2.5 rounded-sm font-mono text-[11px] text-accent flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>YOU ARE THE TEAM ORGANIZER</span>
                  </div>
                  <Link 
                    to={`/hackathons/${id}/edit`} 
                    className="w-full h-9 rounded-sm border border-border bg-surface-elevated hover:bg-[#16191E] font-mono text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-center transition-colors"
                  >
                    EDIT REQUIREMENTS
                  </Link>
                  <Link 
                    to={`/team-requests?hackathonId=${id}`} 
                    state={{ hackathonId: id }} 
                    className="w-full h-9 rounded-sm bg-accent text-white hover:bg-hover-red font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors shadow-sm"
                  >
                    VIEW APPLICATIONS
                  </Link>
                </div>
              ) : hasApplied && application ? (
                <div className="p-4 rounded-sm bg-[#0E1013] border border-border flex flex-col items-center text-center gap-2.5">
                  {application.status === 'accepted' ? (
                    <>
                      <ShieldCheck size={24} className="text-accent" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">APPLICATION ACCEPTED</span>
                      <p className="font-sans text-xs text-text-secondary">Welcome to the team squad!</p>
                      {(organizerContact?.phone || organizerContact?.email) && (
                        <div className="w-full mt-2 pt-2 border-t border-border/60 text-xs font-mono text-left">
                          <span className="text-[10px] text-muted-foreground uppercase block mb-1">TEAM LEAD CONTACT</span>
                          {organizerContact.phone && <div className="text-foreground">Phone: {organizerContact.phone}</div>}
                          {organizerContact.email && <div className="text-foreground truncate">Email: {organizerContact.email}</div>}
                        </div>
                      )}
                    </>
                  ) : application.status === 'rejected' ? (
                    <>
                      <ShieldAlert size={24} className="text-red-400" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">APPLICATION NOT ACCEPTED</span>
                      <p className="font-sans text-xs text-muted-foreground">The team has filled their positions.</p>
                    </>
                  ) : (
                    <>
                      <Clock size={24} className="text-text-secondary" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">APPLICATION SUBMITTED</span>
                      <p className="font-sans text-xs text-muted-foreground">The organizer is reviewing your credentials.</p>
                    </>
                  )}
                  <Link to="/my-applications" className="font-mono text-xs text-accent hover:underline mt-1">
                    Track status →
                  </Link>
                </div>
              ) : (
                <div>
                  {showApplyForm ? (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleApply} 
                      className="flex flex-col gap-3"
                    >
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                        SUBMIT SQUAD APPLICATION
                      </h3>

                      {applyError && (
                        <div className="font-mono text-xs text-accent border border-accent/40 bg-accent/10 p-2.5 rounded-sm">
                          {applyError}
                        </div>
                      )}

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">ROLE</label>
                        <input 
                          type="text" required
                          placeholder="e.g. Frontend Developer"
                          value={applyRole} onChange={e => setApplyRole(e.target.value)}
                          className="w-full h-8 px-2.5 bg-[#101216] border border-border focus:border-accent font-sans text-xs rounded-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">SKILLS</label>
                        <input 
                          type="text" required
                          placeholder="React, TypeScript, Tailwind"
                          value={applySkills} onChange={e => setApplySkills(e.target.value)}
                          className="w-full h-8 px-2.5 bg-[#101216] border border-border focus:border-accent font-sans text-xs rounded-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">EXPERIENCE LEVEL</label>
                        <select 
                          required
                          value={applyExp} onChange={e => setApplyExp(e.target.value)}
                          className="w-full h-8 px-2 bg-[#101216] border border-border focus:border-accent font-mono text-xs rounded-sm outline-none cursor-pointer"
                        >
                          <option value="Beginner">BEGINNER</option>
                          <option value="Intermediate">INTERMEDIATE</option>
                          <option value="Advanced">ADVANCED</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">EMAIL ADDRESS</label>
                        <input 
                          type="email" required
                          placeholder="your.email@domain.com"
                          value={applyEmail} onChange={e => setApplyEmail(e.target.value)}
                          className="w-full h-8 px-2.5 bg-[#101216] border border-border focus:border-accent font-mono text-xs rounded-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">PHONE NUMBER</label>
                        <input 
                          type="tel" required
                          placeholder="+1 234 567 890"
                          value={applyPhone} onChange={e => setApplyPhone(e.target.value)}
                          className="w-full h-8 px-2.5 bg-[#101216] border border-border focus:border-accent font-mono text-xs rounded-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">PITCH / NOTE TO ORGANIZER</label>
                        <textarea 
                          required rows={3}
                          placeholder="Why are you a great addition to this squad?"
                          value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
                          className="w-full p-2.5 bg-[#101216] border border-border focus:border-accent font-sans text-xs rounded-sm outline-none resize-none"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full h-9 bg-accent text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-hover-red transition-all disabled:opacity-50 mt-1"
                      >
                        {submitting ? 'TRANSMITTING...' : 'CONFIRM APPLICATION'}
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setShowApplyForm(false)}
                        className="w-full py-1.5 font-mono text-xs text-muted-foreground uppercase hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </motion.form>
                  ) : (
                    <button 
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        setApplyEmail((prev: string) => prev || user.email || user.user_metadata?.contact_email || '');
                        setApplyPhone((prev: string) => prev || user.user_metadata?.contact_phone || '');
                        setShowApplyForm(true);
                      }}
                      disabled={hackathon.status !== 'OPEN'}
                      className="w-full h-10 bg-accent text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-hover-red transition-all disabled:opacity-50 shadow-sm"
                    >
                      APPLY TO JOIN SQUAD
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
