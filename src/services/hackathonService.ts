import { supabase } from '../lib/supabase';
import type { Hackathon } from '../types/database';

export const hackathonService = {
  async getHackathons(filters?: { search?: string; mode?: string }): Promise<any[]> {
    let query = supabase
      .from('hackathons')
      .select('*, applications(count), profiles:organizer_id(full_name, college)')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (filters?.mode && filters.mode !== 'All') {
      query = query.eq('mode', filters.mode);
    }

    const { data, error } = await query;
      
    if (error) throw error;
    return data || [];
  },

  async getMyHackathons(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*, applications(count), profiles:organizer_id(full_name, college)')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async getHackathon(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*, profiles:organizer_id(full_name, college, avatar_url, username)')
      .eq('id', id)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  },

  async createHackathon(hackathon: Omit<Hackathon, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    const { data, error } = await supabase
      .from('hackathons')
      .insert({
        ...hackathon,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHackathon(id: string, updates: Partial<Omit<Hackathon, 'id' | 'organizer_id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('hackathons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteHackathon(id: string, userId: string) {
    // Clean up related members and applications first to avoid foreign key blocks
    try {
      await supabase.from('hackathon_members').delete().eq('hackathon_id', id);
    } catch {
      // Ignore if none or if handled by DB cascade
    }
    try {
      await supabase.from('applications').delete().eq('hackathon_id', id);
    } catch {
      // Ignore if none or if handled by DB cascade
    }

    const { error } = await supabase
      .from('hackathons')
      .delete()
      .eq('id', id)
      .eq('organizer_id', userId);

    if (error) throw error;
  }
};
