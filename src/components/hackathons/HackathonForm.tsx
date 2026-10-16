import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hackathonService } from '../../services/hackathonService';
import { useAuth } from '../../hooks/useAuth';
import type { Hackathon } from '../../types/database';
import { profileService } from '../../services/profileService';
import { formatExternalUrl, formatDateForInput } from '../../utils/formatters';
import { Mail, Phone } from 'lucide-react';

const MODES = ['Online', 'Offline', 'Hybrid'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

interface HackathonFormProps {
  initialData?: Hackathon;
  isEditing?: boolean;
}

export function HackathonForm({ initialData, isEditing = false }: HackathonFormProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [organizerName, setOrganizerName] = useState<string>((initialData as any)?.profiles?.full_name || profile?.full_name || '');
  const [organizerCollege, setOrganizerCollege] = useState<string>((initialData as any)?.profiles?.college || profile?.college || '');
  const [contactEmail, setContactEmail] = useState<string>(initialData?.contact_email || user?.email || user?.user_metadata?.contact_email || '');
  const [contactPhone, setContactPhone] = useState<string>(initialData?.contact_phone || user?.user_metadata?.contact_phone || '');

  const [mode, setMode] = useState<Hackathon['mode']>(initialData?.mode || 'Online');
  const [description, setDescription] = useState(initialData?.description || '');
  const [maxTeamSize, setMaxTeamSize] = useState(initialData?.max_team_size?.toString() || '');
  const [openPositions, setOpenPositions] = useState(initialData?.open_positions?.toString() || '');
  const [hackathonUrl, setHackathonUrl] = useState(initialData?.hackathon_url || '');
  const [state, setState] = useState(initialData?.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(initialData?.district || '');
  const [hostingCollege, setHostingCollege] = useState(initialData?.hosting_college || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [experienceLevel, setExperienceLevel] = useState(initialData?.experience_level || '');
  const [eventDate, setEventDate] = useState(initialData?.event_date ? formatDateForInput(initialData.event_date) : '');
  const [registrationDeadline, setRegistrationDeadline] = useState(initialData?.registration_deadline ? formatDateForInput(initialData.registration_deadline) : '');
  
  const [skillsStr, setSkillsStr] = useState(initialData?.skills?.join(', ') || '');
  const [rolesStr, setRolesStr] = useState(initialData?.required_roles?.join(', ') || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    
    if (title.length < 5) return setError('Hackathon name must be at least 5 characters');
    if (!mode) return setError('Please select a mode');
    if (!experienceLevel) return setError('Please select an experience level');
    if (description.length < 20) return setError('Description must be at least 20 characters');
    
    const numMaxTeamSize = Number(maxTeamSize);
    if (isNaN(numMaxTeamSize) || numMaxTeamSize <= 0) return setError('Please enter a valid max team size');
    
    const numOpenPositions = Number(openPositions);
    if (isNaN(numOpenPositions) || numOpenPositions < 0 || numOpenPositions > numMaxTeamSize) return setError('Please enter valid open positions (cannot exceed max team size)');

    if (!eventDate) return setError('Please select an event date');
    const todayStr = new Date().toISOString().split('T')[0];
    if (eventDate < todayStr) return setError('Event date cannot be in the past');

    if (!registrationDeadline) return setError('Please select a registration deadline');
    if (registrationDeadline > eventDate) return setError('Registration deadline must be before or on the event date');

    setLoading(true);
    
    try {
      if (organizerName !== profile?.full_name || organizerCollege !== profile?.college) {
        await profileService.updateProfile(user.id, {
          full_name: organizerName,
          college: organizerCollege
        });
      }

      const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const roles = rolesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const payload = {
        title,
        mode,
        description,
        max_team_size: numMaxTeamSize,
        open_positions: numOpenPositions,
        team_size: Math.max(1, numMaxTeamSize - numOpenPositions),
        hackathon_url: formatExternalUrl(hackathonUrl) || null,
        state: mode !== 'Online' ? state : null,
        district: mode !== 'Online' ? district : null,
        hosting_college: mode !== 'Online' ? hostingCollege : null,
        city: mode !== 'Online' ? city : null,
        venue: mode !== 'Online' ? venue : null,
        experience_level: experienceLevel,
        event_date: new Date(`${eventDate}T00:00:00Z`).toISOString(),
        registration_deadline: new Date(`${registrationDeadline}T23:59:59Z`).toISOString(),
        skills: skills.length > 0 ? skills : null,
        required_roles: roles.length > 0 ? roles : null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
      };

      if (isEditing && initialData) {
        await hackathonService.updateHackathon(initialData.id, payload);
        navigate(`/hackathons/${initialData.id}`);
      } else {
        const newHack = await hackathonService.createHackathon({
          ...payload,
          organizer_id: user.id
        });
        navigate(`/hackathons/${newHack.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8 w-full max-w-4xl mx-auto paper-panel p-6 md:p-12">
      
      {error && (
        <div className="font-mono text-xs uppercase tracking-wider text-accent border border-accent p-3.5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-2 border-b border-border pb-6 md:pb-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">ORGANIZER NAME</label>
          <input
            type="text"
            required
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-sans text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">ORGANIZER COLLEGE</label>
          <input
            type="text"
            value={organizerCollege}
            onChange={(e) => setOrganizerCollege(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-sans text-sm"
            placeholder="Not specified in profile"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">CONTACT EMAIL (PUBLIC)</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 pl-11 focus:outline-none focus:border-foreground transition-colors font-sans text-sm"
              placeholder="hello@example.com"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">CONTACT PHONE (PUBLIC)</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 pl-11 focus:outline-none focus:border-foreground transition-colors font-sans text-sm"
              placeholder="+1234567890"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">HACKATHON NAME</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-display text-xl sm:text-2xl uppercase"
          placeholder="E.G. AI INNOVATORS 2026"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">DETAILED DESCRIPTION</label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-background border border-border p-4 focus:outline-none focus:border-foreground transition-colors font-sans text-sm resize-y leading-relaxed"
          placeholder="Describe the hackathon, the problem statement, and what you want to build..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">MODE</label>
          <select
            required
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase tracking-wider appearance-none text-sm"
          >
            {MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {mode !== 'Online' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-2">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">STATE</label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">DISTRICT *</label>
            <input
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
              placeholder="E.G. CHENNAI"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">HOSTING COLLEGE / INSTITUTION *</label>
            <input
              type="text"
              required
              value={hostingCollege}
              onChange={(e) => setHostingCollege(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
              placeholder="E.G. RAJALAKSHMI ENGINEERING COLLEGE"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">CITY / TOWN</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
              placeholder="OPTIONAL"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">VENUE / ADDRESS</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
              placeholder="COLLEGE AUDITORIUM, MAIN BLOCK"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-2">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">EVENT DATE</label>
          <input
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">REGISTRATION DEADLINE</label>
          <input
            type="date"
            required
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">MAXIMUM TEAM SIZE</label>
          <input
            type="number"
            required
            min="1"
            value={maxTeamSize}
            onChange={(e) => setMaxTeamSize(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold text-sm"
            placeholder="4"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">OPEN POSITIONS</label>
          <input
            type="number"
            required
            min="0"
            value={openPositions}
            onChange={(e) => setOpenPositions(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold text-sm"
            placeholder="2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">PREFERRED ROLES (COMMA SEPARATED)</label>
          <input
            type="text"
            value={rolesStr}
            onChange={(e) => setRolesStr(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
            placeholder="FRONTEND DEVELOPER, AI ENGINEER"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">REQUIRED SKILLS (COMMA SEPARATED)</label>
          <input
            type="text"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase text-sm"
            placeholder="REACT, PYTHON, TENSORFLOW"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">EXPERIENCE LEVEL</label>
          <select
            required
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-mono font-bold uppercase tracking-wider appearance-none text-sm"
          >
            <option value="" disabled>SELECT LEVEL</option>
            {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-muted-foreground">HACKATHON WEBSITE URL (OPTIONAL)</label>
          <input
            type="url"
            value={hackathonUrl}
            onChange={(e) => setHackathonUrl(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-foreground transition-colors font-sans text-sm"
            placeholder="https://example.com/hackathon"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3.5 px-6 font-mono text-sm sm:text-base font-bold uppercase tracking-wider bg-foreground text-background hover:bg-accent hover:text-white transition-colors disabled:opacity-50 min-h-[50px] flex items-center justify-center"
      >
        {loading ? 'PROCESSING...' : isEditing ? 'UPDATE HACKATHON' : 'POST HACKATHON'}
      </button>
    </form>
  );
}
