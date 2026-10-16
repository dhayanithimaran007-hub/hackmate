import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hackathonService } from '../services/hackathonService';
import { applicationService } from '../services/applicationService';
import { ArrowLeft, MapPin, ExternalLink, ShieldCheck, Terminal, ShieldAlert, Phone, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileService } from '../services/profileService';
import { formatExternalUrl, formatWhatsAppUrl, formatTelUrl, formatDisplayDate } from '../utils/formatters';

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

  if (loading) return <div className="flex-1 flex items-center justify-center font-mono animate-pulse">Loading...</div>;
  if (error || !hackathon) return <div className="flex-1 flex items-center justify-center font-mono">{error || 'Not found'}</div>;

  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-xl mx-auto px-4 md:px-12 w-full">
        
        {/* Back navigation */}
        <Link to="/discover" className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase font-bold text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft size={14} /> BACK TO HACKATHONS
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <span className={`font-mono text-xs tracking-wider uppercase font-bold px-3 py-1 border ${hackathon.status === 'OPEN' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted text-muted-foreground border-border'}`}>
                {hackathon.status}
              </span>
              <span className="font-mono text-xs tracking-wider uppercase font-bold px-3 py-1 border border-border bg-card">
                {hackathon.mode}
              </span>
            </div>
            
            <h1 className="heading-page mb-4">{hackathon.title}</h1>
            
            {hackathon.profiles && (
              <div className="flex items-center gap-3.5 mb-8">
                {hackathon.profiles.avatar_url ? (
                  <img 
                    src={hackathon.profiles.avatar_url} 
                    alt="Organizer" 
                    className="w-10 h-10 object-cover border border-border" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.organizer-avatar-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`organizer-avatar-fallback w-10 h-10 border border-border items-center justify-center font-mono text-sm bg-card ${hackathon.profiles.avatar_url ? 'hidden' : 'flex'}`}>
                  {hackathon.profiles.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-mono text-xs uppercase font-bold text-foreground">
                    {hackathon.profiles.username ? (
                      <Link to={`/profile/${hackathon.profiles.username}`} className="hover:text-accent transition-colors hover:underline">
                        ORGANIZED BY {hackathon.profiles.full_name}
                      </Link>
                    ) : (
                      <span>ORGANIZED BY {hackathon.profiles.full_name}</span>
                    )}
                  </div>
                  {hackathon.profiles.college && (
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                      {hackathon.profiles.college}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 border-y border-border py-6">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">EVENT DATE</span>
                <span className="font-mono text-sm font-bold">{formatDisplayDate(hackathon.event_date)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">REGISTRATION CLOSE</span>
                <span className="font-mono text-sm font-bold">{formatDisplayDate(hackathon.registration_deadline)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">OPEN POSITIONS</span>
                <span className="font-mono text-sm font-bold">{hackathon.open_positions} / {hackathon.max_team_size}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">EXPERIENCE</span>
                <span className="font-mono text-sm font-bold">{hackathon.experience_level}</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none font-sans text-muted-foreground mb-12">
              <h3 className="heading-section text-foreground mb-3">ABOUT THE HACKATHON</h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{hackathon.description}</p>
            </div>

            {(hackathon.skills && hackathon.skills.length > 0) && (
              <div className="mb-12">
                <h3 className="heading-section text-foreground mb-4">REQUIRED SKILLS</h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.skills.map((s: string) => (
                    <span key={s} className="px-3.5 py-1.5 border border-border bg-card font-mono text-xs uppercase tracking-wider">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(hackathon.required_roles && hackathon.required_roles.length > 0) && (
              <div className="mb-12">
                <h3 className="heading-section text-foreground mb-4">OPEN ROLES</h3>
                <div className="flex flex-wrap gap-3">
                  {hackathon.required_roles.map((r: string) => (
                    <div key={r} className="px-5 py-3 border border-border bg-card flex items-center gap-3">
                      <Terminal size={15} className="text-accent" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="paper-panel p-6 md:p-8 bg-card border border-border flex flex-col sticky top-24">
              
              {hackathon.hackathon_url && (
                <a href={formatExternalUrl(hackathon.hackathon_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-xs text-accent hover:underline mb-6">
                  <ExternalLink size={14} /> OFFICIAL WEBSITE
                </a>
              )}

              {(hackathon.contact_email || hackathon.contact_phone) && (
                <div className="flex flex-col gap-3.5 mb-6">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider border-b border-border pb-2">ORGANIZER CONTACT</span>
                  {hackathon.contact_email && (
                    <a href={`mailto:${hackathon.contact_email}`} className="flex items-center gap-2.5 font-mono text-xs hover:text-accent transition-colors">
                      <Mail size={15} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{hackathon.contact_email}</span>
                    </a>
                  )}
                  {hackathon.contact_phone && (
                    <a href={formatTelUrl(hackathon.contact_phone)} className="flex items-center gap-2.5 font-mono text-xs hover:text-accent transition-colors">
                      <Phone size={15} className="text-muted-foreground shrink-0" />
                      {hackathon.contact_phone}
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3 mb-6">
                <MapPin size={17} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">LOCATION</span>
                  {hackathon.mode === 'Online' ? (
                    <span className="font-mono text-xs sm:text-sm">ONLINE EVENT — NO PHYSICAL VENUE</span>
                  ) : (
                    <>
                      {(hackathon.hosting_college) && (
                        <span className="font-mono text-xs sm:text-sm font-bold block mb-0.5 uppercase">
                          {hackathon.hosting_college}
                        </span>
                      )}
                      {(hackathon.venue) && (
                        <span className="font-mono text-xs text-muted-foreground block mb-0.5 uppercase">
                          {hackathon.venue}
                        </span>
                      )}
                      {(hackathon.district || hackathon.state || hackathon.city) && (
                        <span className="font-mono text-xs text-muted-foreground uppercase block">
                          {[hackathon.city, hackathon.district, hackathon.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {hackathon.location && !hackathon.district && !hackathon.state && (
                        <span className="font-mono text-xs sm:text-sm text-muted-foreground block">
                          {hackathon.location}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-border mb-6"></div>

              {isOwner ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-accent/10 border border-accent/20 p-3.5 font-mono text-xs text-accent flex items-start gap-2.5">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    <span>YOU ARE THE ORGANIZER OF THIS TEAM</span>
                  </div>
                  <Link to={`/hackathons/${id}/edit`} className="w-full py-3.5 text-center border border-border hover:bg-background transition-colors font-mono text-xs sm:text-sm font-bold uppercase tracking-wider min-h-[48px] flex items-center justify-center">
                    EDIT REQUIREMENTS
                  </Link>
                  <Link to={`/team-requests?hackathonId=${id}`} state={{ hackathonId: id }} className="w-full py-3.5 bg-foreground text-background text-center hover:bg-accent hover:text-white transition-colors font-mono text-xs sm:text-sm font-bold uppercase tracking-wider min-h-[48px] flex items-center justify-center">
                    VIEW APPLICATIONS
                  </Link>
                </div>
              ) : hasApplied && application ? (
                <div className="bg-background border border-foreground p-5 text-center flex flex-col items-center gap-3.5">
                  {application.status === 'accepted' ? (
                    <>
                      <ShieldCheck size={28} className="text-accent" />
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">APPLICATION ACCEPTED</span>
                      <span className="font-mono text-xs text-muted-foreground">Your application has been accepted. Welcome to the team!</span>
                      
                      {(() => {
                        const effectiveEmail = organizerContact?.email || hackathon.contact_email;
                        const effectivePhone = organizerContact?.phone || hackathon.contact_phone;
                        if (!effectiveEmail && !effectivePhone) {
                          return (
                            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-2 border border-border p-2">
                              NO CONTACT DETAILS PROVIDED BY ORGANIZER
                            </span>
                          );
                        }
                        return (
                          <div className="w-full mt-3 flex flex-col gap-2">
                            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">TEAM LEAD CONTACT</span>
                            {effectivePhone && (
                              <div className="flex gap-2">
                                <a href={formatTelUrl(effectivePhone)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background border border-border hover:border-foreground transition-colors font-mono text-xs uppercase font-bold">
                                  <Phone size={14} /> CALL
                                </a>
                                <a href={formatWhatsAppUrl(effectivePhone)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-colors font-mono text-xs uppercase font-bold">
                                  <MessageSquare size={14} /> WHATSAPP
                                </a>
                              </div>
                            )}
                            {effectiveEmail && (
                              <a href={`mailto:${effectiveEmail}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-background border border-border hover:border-foreground transition-colors font-mono text-xs uppercase font-bold">
                                <Mail size={14} /> EMAIL
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : application.status === 'rejected' ? (
                    <>
                      <ShieldAlert size={28} className="text-red-500" />
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-red-500">APPLICATION REJECTED</span>
                      <span className="font-mono text-xs text-muted-foreground">Unfortunately, your application was not accepted.</span>
                    </>
                  ) : application.status === 'pending' ? (
                    <>
                      <ShieldAlert size={28} className="text-foreground" />
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">APPLICATION SENT</span>
                      <span className="font-mono text-xs text-muted-foreground">The organizer is reviewing your profile.</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={28} className="text-muted-foreground" />
                      <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">APPLICATION STATUS</span>
                      <span className="font-mono text-xs text-muted-foreground">Status unavailable. Please try again.</span>
                    </>
                  )}
                  <Link to="/my-applications" className="mt-2 text-xs text-accent hover:underline font-mono uppercase tracking-wider">
                    VIEW STATUS
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <div className="font-mono text-xs text-muted-foreground text-center uppercase tracking-wider mb-1">
                    {hackathon.open_positions} POSITIONS REMAINING
                  </div>
                  {showApplyForm ? (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleApply} 
                      className="flex flex-col gap-3.5"
                    >
                      {applyError && (
                        <div className="font-mono text-xs uppercase tracking-wider text-accent border border-accent p-3 mb-1">
                          {applyError}
                        </div>
                      )}
                      <input 
                        type="text" required
                        placeholder="ROLE YOU WANT (E.G. FRONTEND)"
                        value={applyRole} onChange={e=>setApplyRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-mono text-xs sm:text-sm uppercase"
                      />
                      <input 
                        type="text" required
                        placeholder="YOUR SKILLS (COMMA SEPARATED)"
                        value={applySkills} onChange={e=>setApplySkills(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-mono text-xs sm:text-sm uppercase"
                      />
                      <select 
                        required
                        value={applyExp} onChange={e=>setApplyExp(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-mono text-xs sm:text-sm uppercase appearance-none"
                      >
                        <option value="Beginner">BEGINNER</option>
                        <option value="Intermediate">INTERMEDIATE</option>
                        <option value="Advanced">ADVANCED</option>
                      </select>
                      <input 
                        type="email" required
                        placeholder="ENTER YOUR EMAIL ADDRESS"
                        value={applyEmail} onChange={e=>setApplyEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-mono text-xs sm:text-sm uppercase"
                      />
                      <input 
                        type="tel" required
                        placeholder="ENTER YOUR PHONE NUMBER"
                        value={applyPhone} onChange={e=>setApplyPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-mono text-xs sm:text-sm uppercase"
                      />
                      <textarea 
                        required rows={3}
                        placeholder="WHY SHOULD WE CHOOSE YOU?"
                        value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border font-sans text-xs sm:text-sm resize-none"
                      />
                      <button 
                        type="submit" disabled={submitting}
                        className="w-full py-3.5 bg-accent text-accent-foreground font-mono font-bold text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[48px]"
                      >
                        {submitting ? 'SENDING...' : 'CONFIRM APPLICATION'}
                      </button>
                      <button 
                        type="button" onClick={() => setShowApplyForm(false)}
                        className="w-full py-2 font-mono text-xs text-muted-foreground uppercase hover:text-foreground"
                      >
                        CANCEL
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
                      className="w-full py-3.5 px-6 bg-foreground text-background font-mono font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                      APPLY TO JOIN
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
