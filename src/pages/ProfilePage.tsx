import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import type { Profile, Project, HackathonExperience } from '../types/database';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Code2, Briefcase, Plus, Trash2, Globe, Check, ExternalLink, X, Mail, Phone, ShieldCheck } from 'lucide-react';
import { formatExternalUrl, sanitizeUsername } from '../utils/formatters';
import EarthBackground from '../components/ui/EarthBackground';

const ROLES = [
  "Frontend Developer", "Backend Developer", "Full-Stack Developer", 
  "AI/ML Engineer", "Data Scientist", "Cybersecurity Researcher", 
  "UI/UX Designer", "Mobile App Developer", "Cloud/DevOps Engineer", 
  "Hardware/IoT Engineer", "Product Manager", "Other"
];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Node.js", "Python", "C++", "Java", "Next.js", "Tailwind CSS",
  "PostgreSQL", "MongoDB", "Supabase", "Figma", "Docker", "AWS", "Machine Learning"
];

const getInitials = (name?: string | null) => {
  if (!name || !name.trim()) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ProfilePage() {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'projects' | 'hackathons'>('basic');
  
  // Profile state
  const [profileData, setProfileData] = useState<Partial<Profile>>({});
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isEmailPublic, setIsEmailPublic] = useState(true);
  const [isPhonePublic, setIsPhonePublic] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<HackathonExperience[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Form states for tabs
  const [newSkill, setNewSkill] = useState('');
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({});
  const [isSavingProject, setIsSavingProject] = useState(false);

  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExp, setNewExp] = useState<Partial<HackathonExperience>>({});
  const [isSavingExp, setIsSavingExp] = useState(false);
  
  // Fetch full data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [profData, projData, expData] = await Promise.all([
          profileService.getProfile(user.id),
          profileService.getProjects(user.id),
          profileService.getHackathonExperience(user.id)
        ]);
        
        if (profData) {
          setProfileData(profData);
          setContactEmail(profData.email || user.user_metadata?.contact_email || user.email || '');
          setContactPhone(profData.phone || user.user_metadata?.contact_phone || '');
          setIsEmailPublic(profData.is_email_public ?? (user.user_metadata?.is_email_public ?? true));
          setIsPhonePublic(profData.is_phone_public ?? (user.user_metadata?.is_phone_public ?? true));
        } else {
          setContactEmail(user.user_metadata?.contact_email || user.email || '');
          setContactPhone(user.user_metadata?.contact_phone || '');
          setIsEmailPublic(user.user_metadata?.is_email_public ?? true);
          setIsPhonePublic(user.user_metadata?.is_phone_public ?? true);
        }
        if (projData) setProjects(projData);
        if (expData) setExperiences(expData);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [user]);

  const handleChange = (field: keyof Profile, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const calculateCompletion = () => {
    let score = 0;
    let total = 5;
    if (profileData.full_name && profileData.username) score++;
    if (profileData.headline || profileData.bio) score++;
    if (profileData.skills && profileData.skills.length > 0) score++;
    if (profileData.preferred_roles && profileData.preferred_roles.length > 0) score++;
    if (projects.length > 0 || (profileData.github_url || profileData.linkedin_url)) score++;
    return Math.round((score / total) * 100);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      // Username sanitization and uniqueness check
      const cleanUsername = profileData.username?.trim() ? sanitizeUsername(profileData.username) : null;
      if (cleanUsername && cleanUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (cleanUsername && !/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
        throw new Error('Username can only contain letters, numbers, underscores, and dashes');
      }
      if (cleanUsername && cleanUsername !== authProfile?.username) {
        const { data } = await supabase.from('profiles').select('id').eq('username', cleanUsername).maybeSingle();
        if (data && data.id !== user.id) {
          throw new Error('Username is already taken');
        }
      }

      const cleanEmail = contactEmail.trim();
      const cleanPhone = contactPhone.trim();

      const updatedPayload: Partial<Profile> = {
        ...profileData,
        email: isEmailPublic ? (cleanEmail || null) : null,
        phone: isPhonePublic ? (cleanPhone || null) : null,
        is_email_public: isEmailPublic,
        is_phone_public: isPhonePublic,
        username: cleanUsername,
        github_url: formatExternalUrl(profileData.github_url) || null,
        linkedin_url: formatExternalUrl(profileData.linkedin_url) || null,
        portfolio_url: formatExternalUrl(profileData.portfolio_url) || null,
        leetcode_url: formatExternalUrl(profileData.leetcode_url) || null,
      };

      await profileService.updateProfile(user.id, updatedPayload);
      await profileService.updateContactInfo(cleanPhone, cleanEmail, isPhonePublic, isEmailPublic);
      await refreshProfile();
      // Force refresh the session to get updated user_metadata
      await supabase.auth.refreshSession();
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  // Basic Details Section
  const renderBasicDetails = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
        <div 
          className="w-20 h-20 md:w-24 md:h-24 border-2 border-foreground bg-card flex items-center justify-center shrink-0 select-none shadow-sm relative overflow-hidden"
          title={profileData.full_name || 'User Avatar'}
        >
          {profileData.avatar_url ? (
            <img 
              src={profileData.avatar_url} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.profile-avatar-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`profile-avatar-fallback w-full h-full items-center justify-center ${profileData.avatar_url ? 'hidden' : 'flex'}`}>
            {getInitials(profileData.full_name) ? (
              <span className="font-sans font-bold text-2xl md:text-3xl text-foreground tracking-wide">
                {getInitials(profileData.full_name)}
              </span>
            ) : (
              <User className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Full Name *</label>
              <input type="text" value={profileData.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
            </div>
            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Username *</label>
              <input type="text" value={profileData.username || ''} onChange={e => handleChange('username', e.target.value)} placeholder="e.g. hackercat" className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-mono text-sm lowercase" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Avatar Image URL (Optional)</label>
            <input type="url" value={profileData.avatar_url || ''} onChange={e => handleChange('avatar_url', e.target.value)} placeholder="https://example.com/avatar.jpg" className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Headline / Title</label>
          <input type="text" value={profileData.headline || ''} onChange={e => handleChange('headline', e.target.value)} placeholder="e.g. Full-Stack Developer | AI Enthusiast" className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
        </div>
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Bio</label>
          <textarea rows={4} value={profileData.bio || ''} onChange={e => handleChange('bio', e.target.value)} className="w-full p-3 bg-background border border-border focus:border-accent outline-none font-sans text-sm resize-y" />
        </div>
      </div>

      {/* Contact Details & Public Visibility Settings */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
          <div>
            <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" /> CONTACT INFO & VISIBILITY SETTINGS
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground uppercase mt-0.5">
              Choose which contact methods are publicly displayed on your developer profile
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase bg-accent/10 border border-accent/20 text-accent self-start sm:self-auto">
            <span>PRIVACY GUARD ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Card */}
          <div className="p-4 bg-background border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Mail size={14} className="text-accent" /> Email Address
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase font-bold ${
                  isEmailPublic 
                    ? 'border-accent text-accent bg-accent/10' 
                    : 'border-muted-foreground/40 text-muted-foreground bg-muted/30'
                }`}>
                  {isEmailPublic ? 'PUBLIC ON PROFILE' : 'PRIVATE / HIDDEN'}
                </span>
              </div>
              <input 
                type="email" 
                value={contactEmail} 
                onChange={e => setContactEmail(e.target.value)} 
                placeholder="dev@hackmate.io" 
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-card border border-border focus:border-accent outline-none font-sans text-sm" 
              />
            </div>
            
            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-border/40 select-none">
              <input 
                type="checkbox" 
                checked={isEmailPublic} 
                onChange={e => setIsEmailPublic(e.target.checked)} 
                className="mt-1 h-4 w-4 rounded-none accent-accent cursor-pointer" 
              />
              <div className="flex-1 text-[11px] font-mono leading-tight">
                <span className="text-foreground uppercase font-semibold block">Share email publicly</span>
                <span className="text-muted-foreground">Visitors can contact you directly via clickable mailto: link</span>
              </div>
            </label>
          </div>

          {/* Phone Card */}
          <div className="p-4 bg-background border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Phone size={14} className="text-accent" /> Phone Number
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase font-bold ${
                  isPhonePublic 
                    ? 'border-accent text-accent bg-accent/10' 
                    : 'border-muted-foreground/40 text-muted-foreground bg-muted/30'
                }`}>
                  {isPhonePublic ? 'PUBLIC ON PROFILE' : 'PRIVATE / HIDDEN'}
                </span>
              </div>
              <input 
                type="tel" 
                value={contactPhone} 
                onChange={e => setContactPhone(e.target.value)} 
                placeholder="+1 (555) 019-2834" 
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-card border border-border focus:border-accent outline-none font-sans text-sm" 
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-border/40 select-none">
              <input 
                type="checkbox" 
                checked={isPhonePublic} 
                onChange={e => setIsPhonePublic(e.target.checked)} 
                className="mt-1 h-4 w-4 rounded-none accent-accent cursor-pointer" 
              />
              <div className="flex-1 text-[11px] font-mono leading-tight">
                <span className="text-foreground uppercase font-semibold block">Share phone publicly</span>
                <span className="text-muted-foreground">Visitors can call or message you directly via clickable tel: link</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">College / University</label>
          <input type="text" value={profileData.college || ''} onChange={e => handleChange('college', e.target.value)} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
        </div>
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Department & Degree</label>
          <input type="text" value={profileData.department || ''} onChange={e => handleChange('department', e.target.value)} placeholder="e.g. B.Tech Computer Science" className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
        </div>
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Year of Study</label>
          <select value={profileData.study_year || ''} onChange={e => handleChange('study_year', e.target.value)} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm">
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Location</label>
          <input type="text" value={profileData.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="City, Country" className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Availability Status</label>
        <div className="flex flex-wrap gap-4">
          {['Looking for a team', 'Open to opportunities', 'Not available'].map(status => (
            <label key={status} className={`flex items-center gap-2 cursor-pointer p-3 border font-mono text-xs uppercase transition-colors ${profileData.availability_status === status ? 'border-accent bg-accent/10 text-accent font-bold' : 'border-border bg-background text-foreground/70 hover:border-foreground'}`}>
              <input type="radio" name="availability" value={status} checked={profileData.availability_status === status} onChange={e => handleChange('availability_status', e.target.value)} className="hidden" />
              <div className={`w-2 h-2 rounded-full ${status === 'Looking for a team' ? 'bg-green-500' : status === 'Open to opportunities' ? 'bg-accent' : 'bg-red-500'}`} />
              {status}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Skills & Links Section
  const renderSkillsLinks = () => {
    const addSkill = (e: React.KeyboardEvent | React.MouseEvent, skillToAdd?: string) => {
      const s = skillToAdd || newSkill;
      if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
      if (e.type === 'keydown') e.preventDefault();
      
      if (s.trim() && !(profileData.skills || []).includes(s.trim())) {
        handleChange('skills', [...(profileData.skills || []), s.trim()]);
        setNewSkill('');
      }
    };
    
    const removeSkill = (skill: string) => {
      handleChange('skills', (profileData.skills || []).filter(s => s !== skill));
    };

    const toggleRole = (role: string) => {
      const current = profileData.preferred_roles || [];
      if (current.includes(role)) {
        handleChange('preferred_roles', current.filter(r => r !== role));
      } else {
        handleChange('preferred_roles', [...current, role]);
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Technical Skills</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {(profileData.skills || []).map((skill) => (
              <span key={skill} className="px-3 py-1.5 text-xs font-mono border border-accent bg-accent/10 text-accent uppercase flex items-center gap-2">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-foreground"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={addSkill}
              placeholder="e.g. React, Python, Figma (Press Enter)" 
              className="flex-1 px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-mono text-sm" 
            />
            <button type="button" onClick={(e) => addSkill(e)} className="px-6 min-h-[44px] bg-border hover:bg-foreground hover:text-background font-mono text-xs uppercase font-bold tracking-wider transition-colors">Add</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.filter(s => !(profileData.skills || []).includes(s)).slice(0, 8).map(s => (
              <button type="button" key={s} onClick={(e) => addSkill(e, s)} className="text-xs font-mono border border-border px-2.5 py-1 uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Preferred Roles</label>
          <div className="flex flex-wrap gap-3">
            {ROLES.map(role => {
              const isSelected = (profileData.preferred_roles || []).includes(role);
              return (
                <button 
                  type="button" key={role} onClick={() => toggleRole(role)}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${isSelected ? 'border-foreground bg-foreground text-background font-bold' : 'border-border bg-background hover:border-accent hover:text-accent'}`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">Professional Links</h4>
          </div>
          <div className="flex items-center relative">
            <ExternalLink className="absolute left-3 text-muted-foreground" size={18} />
            <input type="url" value={profileData.github_url || ''} onChange={e => handleChange('github_url', e.target.value)} placeholder="GitHub URL" className="w-full px-3.5 py-2.5 pl-10 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
          </div>
          <div className="flex items-center relative">
            <ExternalLink className="absolute left-3 text-muted-foreground" size={18} />
            <input type="url" value={profileData.linkedin_url || ''} onChange={e => handleChange('linkedin_url', e.target.value)} placeholder="LinkedIn URL" className="w-full px-3.5 py-2.5 pl-10 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
          </div>
          <div className="flex items-center relative">
            <Globe className="absolute left-3 text-muted-foreground" size={18} />
            <input type="url" value={profileData.portfolio_url || ''} onChange={e => handleChange('portfolio_url', e.target.value)} placeholder="Portfolio URL" className="w-full px-3.5 py-2.5 pl-10 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
          </div>
          <div className="flex items-center relative">
            <Code2 className="absolute left-3 text-muted-foreground" size={18} />
            <input type="url" value={profileData.leetcode_url || ''} onChange={e => handleChange('leetcode_url', e.target.value)} placeholder="LeetCode / Codeforces URL" className="w-full px-3.5 py-2.5 pl-10 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
          </div>
        </div>
      </div>
    );
  };

  // Projects Section
  const renderProjects = () => {
    const handleSaveProject = async () => {
      if (!user || !newProject.title) return;
      setIsSavingProject(true);
      try {
        const saved = await profileService.createProject({
          ...newProject,
          user_id: user.id,
          repository_url: formatExternalUrl(newProject.repository_url) || null,
          demo_url: formatExternalUrl(newProject.demo_url) || null,
        });
        setProjects([saved, ...projects]);
        setIsAddingProject(false);
        setNewProject({});
      } catch (err) {
        console.error('Failed to save project', err);
      } finally {
        setIsSavingProject(false);
      }
    };

    const handleDeleteProject = async (id: string) => {
      try {
        await profileService.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Projects</h3>
          {!isAddingProject && (
            <button type="button" onClick={() => setIsAddingProject(true)} className="flex items-center gap-2 font-mono text-xs uppercase bg-accent text-accent-foreground px-4 py-2 min-h-[38px] font-bold tracking-wider hover:bg-accent/80 transition-colors">
              <Plus size={14} /> Add Project
            </button>
          )}
        </div>
        
        {isAddingProject && (
          <div className="border border-border p-6 bg-card mb-8">
            <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">New Project</h4>
            <div className="space-y-4">
              <input type="text" placeholder="Project Title *" value={newProject.title || ''} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              <textarea placeholder="Short description" rows={3} value={newProject.description || ''} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full p-3 bg-background border border-border focus:border-accent outline-none font-sans text-sm resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="GitHub URL" value={newProject.repository_url || ''} onChange={e => setNewProject({...newProject, repository_url: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
                <input type="text" placeholder="Live Demo URL" value={newProject.demo_url || ''} onChange={e => setNewProject({...newProject, demo_url: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              </div>
              <input type="text" placeholder="Technologies (comma separated)" value={newProject.technologies?.join(', ') || ''} onChange={e => setNewProject({...newProject, technologies: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm uppercase font-mono" />
              
              <div className="flex gap-4 pt-4 border-t border-border">
                <button type="button" onClick={handleSaveProject} disabled={isSavingProject || !newProject.title} className="bg-foreground text-background font-mono text-xs uppercase font-bold tracking-wider px-6 py-2.5 min-h-[40px] disabled:opacity-50">Save Project</button>
                <button type="button" onClick={() => setIsAddingProject(false)} className="text-muted-foreground font-mono text-xs uppercase font-bold tracking-wider px-6 py-2.5 min-h-[40px] border border-border hover:border-foreground">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 && !isAddingProject ? (
          <div className="border border-dashed border-border p-12 text-center flex flex-col items-center">
            <Briefcase className="text-muted-foreground mb-4" size={32} />
            <p className="font-mono text-sm uppercase text-muted-foreground">No projects added yet.</p>
            <p className="font-sans text-sm text-foreground/60 mt-2 max-w-sm">Showcase your best work, hackathon submissions, or personal projects.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(p => (
              <div key={p.id} className="border border-border p-4 bg-background relative group flex flex-col">
                <h4 className="heading-card uppercase pr-8 mb-1">{p.title}</h4>
                {p.description && <p className="text-sm font-sans mt-2 line-clamp-2 text-foreground/80 leading-relaxed">{p.description}</p>}
                
                <div className="flex gap-3 mt-4 pt-4 border-t border-border/50">
                  {p.repository_url && <a href={p.repository_url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono uppercase text-muted-foreground hover:text-accent flex items-center gap-1"><ExternalLink size={12}/> Repo</a>}
                  {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono uppercase text-muted-foreground hover:text-accent flex items-center gap-1"><Globe size={12}/> Live</a>}
                </div>

                <button type="button" onClick={() => handleDeleteProject(p.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-card rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Hackathons Section
  const renderHackathons = () => {
    const handleSaveExp = async () => {
      if (!user || !newExp.hackathon_name) return;
      setIsSavingExp(true);
      try {
        const saved = await profileService.createHackathonExperience({ ...newExp, user_id: user.id });
        setExperiences([saved, ...experiences]);
        setIsAddingExp(false);
        setNewExp({});
      } catch (err) {
        console.error('Failed to save experience', err);
      } finally {
        setIsSavingExp(false);
      }
    };

    const handleDeleteExp = async (id: string) => {
      try {
        await profileService.deleteHackathonExperience(id);
        setExperiences(experiences.filter(e => e.id !== id));
      } catch (err) {
        console.error('Failed to delete experience', err);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Hackathon Experience</h3>
          {!isAddingExp && (
            <button type="button" onClick={() => setIsAddingExp(true)} className="flex items-center gap-2 font-mono text-xs uppercase bg-accent text-accent-foreground px-4 py-2 min-h-[38px] font-bold tracking-wider hover:bg-accent/80 transition-colors">
              <Plus size={14} /> Add Experience
            </button>
          )}
        </div>
        
        {isAddingExp && (
          <div className="border border-border p-6 bg-card mb-8">
            <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">New Hackathon Experience</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Hackathon Name *" value={newExp.hackathon_name || ''} onChange={e => setNewExp({...newExp, hackathon_name: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
                <input type="text" placeholder="Event Date (e.g. Oct 2025)" value={newExp.event_date || ''} onChange={e => setNewExp({...newExp, event_date: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Project Title" value={newExp.project_title || ''} onChange={e => setNewExp({...newExp, project_title: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
                <input type="text" placeholder="Your Role (e.g. Lead Frontend)" value={newExp.role || ''} onChange={e => setNewExp({...newExp, role: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              </div>
              <input type="text" placeholder="Achievement (e.g. Winner, Top 10, Finalist)" value={newExp.achievement || ''} onChange={e => setNewExp({...newExp, achievement: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              <input type="text" placeholder="Project URL" value={newExp.project_url || ''} onChange={e => setNewExp({...newExp, project_url: e.target.value})} className="w-full px-3.5 py-2.5 min-h-[44px] bg-background border border-border focus:border-accent outline-none font-sans text-sm" />
              
              <div className="flex gap-4 pt-4 border-t border-border">
                <button type="button" onClick={handleSaveExp} disabled={isSavingExp || !newExp.hackathon_name} className="bg-foreground text-background font-mono text-xs uppercase font-bold tracking-wider px-6 py-2.5 min-h-[40px] disabled:opacity-50">Save Experience</button>
                <button type="button" onClick={() => setIsAddingExp(false)} className="text-muted-foreground font-mono text-xs uppercase font-bold tracking-wider px-6 py-2.5 min-h-[40px] border border-border hover:border-foreground">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {experiences.length === 0 && !isAddingExp ? (
          <div className="border border-dashed border-border p-12 text-center flex flex-col items-center">
            <User className="text-muted-foreground mb-4" size={32} />
            <p className="font-mono text-sm uppercase text-muted-foreground">No hackathon experience added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map(e => (
              <div key={e.id} className="border border-border p-4 bg-background relative group flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h4 className="heading-card uppercase pr-8 mb-1">{e.hackathon_name}</h4>
                  <p className="font-mono text-xs text-muted-foreground mt-1 uppercase">
                    {e.project_title} {e.role ? `• ${e.role}` : ''} {e.event_date ? `• ${e.event_date}` : ''}
                  </p>
                </div>
                {e.achievement && (
                  <span className="mt-2 md:mt-0 font-mono text-xs uppercase border border-accent text-accent px-2.5 py-1 flex-shrink-0 font-bold">
                    {e.achievement}
                  </span>
                )}
                <button type="button" onClick={() => handleDeleteExp(e.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-card rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // X is now defined outside to prevent remounting

  return (
    <div className="flex-1 w-full bg-background min-h-screen text-foreground relative overflow-hidden">
      {/* Subtle orbital curves */}
      <EarthBackground variant="minimal" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8 py-8 md:py-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
              EDIT <span className="text-accent">PROFILE.</span>
            </h1>
            <p className="font-sans text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              Manage your developer identity, technical stack, and showcase projects
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-sm">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase font-bold text-muted-foreground">Profile Completion</span>
              <span className="font-mono font-bold text-accent text-sm">{calculateCompletion()}%</span>
            </div>
            <div className="w-24 h-2 bg-[#101216] border border-border rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-700" style={{ width: `${calculateCompletion()}%` }} />
            </div>
          </div>
        </div>

        {profileData.username && (
          <div className="mb-6">
            <Link 
              to={`/profile/${profileData.username}`} 
              className="inline-flex items-center gap-2 font-mono text-xs uppercase font-semibold tracking-wider border border-border px-3.5 py-2 rounded-sm hover:border-accent hover:text-accent transition-colors bg-card"
            >
              <Globe size={13} />
              <span>VIEW PUBLIC PROFILE</span>
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Nav */}
          <div className="w-full lg:w-60 flex flex-col gap-1.5 shrink-0">
            <button 
              onClick={() => setActiveTab('basic')} 
              className={`text-left px-3.5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'basic' 
                  ? 'border-accent bg-card text-foreground font-bold shadow-sm' 
                  : 'border-transparent text-text-secondary hover:bg-card hover:text-foreground'
              }`}
            >
              Basic Details
            </button>
            <button 
              onClick={() => setActiveTab('skills')} 
              className={`text-left px-3.5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'skills' 
                  ? 'border-accent bg-card text-foreground font-bold shadow-sm' 
                  : 'border-transparent text-text-secondary hover:bg-card hover:text-foreground'
              }`}
            >
              Skills & Links
            </button>
            <button 
              onClick={() => setActiveTab('projects')} 
              className={`text-left px-3.5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'projects' 
                  ? 'border-accent bg-card text-foreground font-bold shadow-sm' 
                  : 'border-transparent text-text-secondary hover:bg-card hover:text-foreground'
              }`}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveTab('hackathons')} 
              className={`text-left px-3.5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'hackathons' 
                  ? 'border-accent bg-card text-foreground font-bold shadow-sm' 
                  : 'border-transparent text-text-secondary hover:bg-card hover:text-foreground'
              }`}
            >
              Hackathon History
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 md:p-8 border border-border bg-card rounded-sm relative">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute top-0 left-0 right-0 p-3 font-mono text-xs uppercase font-bold text-center border-b rounded-t-sm ${
                    message.type === 'success' 
                      ? 'bg-success/10 text-success border-success/30' 
                      : 'bg-accent/10 text-accent border-accent/30'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={message ? 'mt-6' : ''}>
              {activeTab === 'basic' && renderBasicDetails()}
              {activeTab === 'skills' && renderSkillsLinks()}
              {activeTab === 'projects' && renderProjects()}
              {activeTab === 'hackathons' && renderHackathons()}
            </div>

            <div className="mt-10 pt-5 border-t border-border flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="h-10 px-6 rounded-sm bg-accent hover:bg-hover-red text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? 'SAVING CHANGES...' : <><Check size={14} /> SAVE PROFILE</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
