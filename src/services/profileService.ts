import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { sanitizeUsername } from '../utils/formatters';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile:', error.message || error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.warn('Unexpected error in profileService.getProfile:', err);
      return null;
    }
  },

  async getProfileByUsername(identifier: string, profileIdHint?: string): Promise<Profile | null> {
    try {
      if (!identifier && !profileIdHint) return null;

      // 0. If a valid profile ID hint is provided, prioritize direct ID lookup
      if (profileIdHint) {
        const byHint = await this.getProfile(profileIdHint);
        if (byHint) return byHint;
      }

      const raw = (identifier || '').trim();
      const cleanId = raw.startsWith('@') ? raw.slice(1).trim() : raw;
      if (!cleanId) return null;

      // 1. If identifier is a valid UUID, lookup by profile ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) {
        const byId = await this.getProfile(cleanId);
        if (byId) return byId;
      }

      // 2. Exact match on username
      const { data: exactMatch, error: exactErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanId)
        .maybeSingle();
        
      if (exactErr && exactErr.code !== 'PGRST116') {
        throw exactErr;
      }
      if (exactMatch) return exactMatch;

      // 3. Fallback: case-insensitive match on username
      const { data: ilikeMatch, error: ilikeErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanId)
        .maybeSingle();

      if (ilikeErr && ilikeErr.code !== 'PGRST116') {
        throw ilikeErr;
      }
      if (ilikeMatch) return ilikeMatch;

      // 4. Fallback: case-insensitive match on full_name
      const { data: nameMatch, error: nameErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', cleanId)
        .maybeSingle();

      if (nameErr && nameErr.code !== 'PGRST116') {
        throw nameErr;
      }
      if (nameMatch) return nameMatch;

      // 5. Normalized / sanitized full_name & prefix matching
      // When a user has not explicitly set a username, the directory displays sanitizeUsername(full_name).
      // E.g. "Manisha " -> "manisha", "Dharun Kumar" -> "dharunkumar" or "dharun-kumar".
      const targetNormalized = sanitizeUsername(cleanId);
      const cleanLower = cleanId.toLowerCase().replace(/[-_]/g, '');

      const { data: allProfiles, error: allErr } = await supabase
        .from('profiles')
        .select('*');

      if (allErr) throw allErr;

      if (allProfiles && allProfiles.length > 0) {
        const matched = allProfiles.find(p => {
          if (p.username) {
            const pUserNorm = sanitizeUsername(p.username);
            if (pUserNorm === targetNormalized || pUserNorm.replace(/[-_]/g, '') === cleanLower) {
              return true;
            }
          }
          if (p.full_name) {
            const pNameNorm = sanitizeUsername(p.full_name);
            const pNameClean = p.full_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (
              pNameNorm === targetNormalized || 
              pNameClean === cleanLower || 
              p.full_name.trim().toLowerCase() === cleanId.toLowerCase()
            ) {
              return true;
            }
          }
          if (p.id) {
            const pIdLower = p.id.toLowerCase();
            if (pIdLower.startsWith(cleanId.toLowerCase()) || pIdLower.replace(/-/g, '').startsWith(cleanLower)) {
              return true;
            }
          }
          return false;
        });

        if (matched) return matched;
      }

      return null;
    } catch (err) {
      console.error('Error in profileService.getProfileByUsername:', err);
      throw err;
    }
  },

  async ensureProfile(user: { id: string; email?: string | null; user_metadata?: any }): Promise<Profile | null> {
    try {
      const existing = await this.getProfile(user.id);
      if (existing) {
        // If existing profile has no username, assign a clean unique default username
        if (!existing.username) {
          const fallbackName = existing.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'dev';
          const cleanName = sanitizeUsername(fallbackName) || 'dev';
          const generatedUsername = `${cleanName}_${user.id.slice(0, 4)}`.toLowerCase();
          
          const { data: updated } = await supabase
            .from('profiles')
            .update({ username: generatedUsername })
            .eq('id', user.id)
            .select()
            .maybeSingle();

          if (updated) return updated;
        }
        return existing;
      }

      const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Builder';
      const cleanName = sanitizeUsername(fallbackName) || 'dev';
      const defaultUsername = `${cleanName}_${user.id.slice(0, 4)}`.toLowerCase();

      const initialProfile = {
        id: user.id,
        full_name: fallbackName,
        username: defaultUsername,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(initialProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Could not auto-create profile:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Error in ensureProfile:', err);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const payload = {
      id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
      
    if (error) {
      // If contact columns don't exist yet in the database schema, fallback gracefully
      if (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('schema cache') || error.message?.includes('column')) {
        console.warn('Database schema missing contact columns. Saving base profile columns:', error.message);
        const { 
          email: _email, 
          phone: _phone, 
          is_email_public: _isEmailPublic, 
          is_phone_public: _isPhonePublic, 
          ...safeUpdates 
        } = payload;
        const { error: fallbackError } = await supabase
          .from('profiles')
          .upsert(safeUpdates, { onConflict: 'id' });
        if (fallbackError) throw fallbackError;
        return;
      }
      throw error;
    }
  },

  async updateContactInfo(phone: string, email: string, isPhonePublic: boolean = true, isEmailPublic: boolean = true) {
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        contact_phone: phone, 
        contact_email: email,
        is_phone_public: isPhonePublic,
        is_email_public: isEmailPublic
      }
    });
    if (error) throw error;
    return data;
  },

  async getContactInfo(userId: string): Promise<{email?: string, phone?: string} | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_contact_info', {
        p_user_id: userId
      });
      
      if (error) {
        return null;
      }
      return data as {email?: string, phone?: string} | null;
    } catch {
      return null;
    }
  },

  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getHackathonExperience(userId: string) {
    const { data, error } = await supabase
      .from('hackathon_experience')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createHackathonExperience(exp: any) {
    const { data, error } = await supabase
      .from('hackathon_experience')
      .insert([exp])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHackathonExperience(id: string, updates: any) {
    const { data, error } = await supabase
      .from('hackathon_experience')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteHackathonExperience(id: string) {
    const { error } = await supabase
      .from('hackathon_experience')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getAllProfiles(filters?: { role?: string, skill?: string }) {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Simplistic filtering, can be advanced later
    if (filters?.role) {
      query = query.contains('preferred_roles', [filters.role]);
    }
    if (filters?.skill) {
      query = query.contains('skills', [filters.skill]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
