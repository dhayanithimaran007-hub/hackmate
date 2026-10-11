import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  },

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile by username:', error);
      return null;
    }
    
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (error) throw error;
  },

  async updateContactInfo(phone: string, email: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: { contact_phone: phone, contact_email: email }
    });
    if (error) throw error;
    return data;
  },

  async getContactInfo(userId: string): Promise<{email?: string, phone?: string} | null> {
    const { data, error } = await supabase.rpc('get_user_contact_info', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error fetching contact info:', error);
      return null;
    }
    return data as {email?: string, phone?: string} | null;
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
    let query = supabase.from('profiles').select('*');
    
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
