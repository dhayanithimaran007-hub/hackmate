import { supabase } from '../lib/supabase';
import type { Application } from '../types/database';

export const applicationService = {
  async getApplicationsForHackathon(hackathonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:applicant_id (
          full_name,
          username,
          avatar_url,
          bio,
          skills
        )
      `)
      .eq('hackathon_id', hackathonId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMyApplications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        hackathons:hackathon_id (
          title,
          status,
          organizer_id,
          mode
        )
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async submitApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...application,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateApplicationStatus(id: string, status: 'accepted' | 'rejected') {
    if (status === 'accepted') {
       // use rpc for transaction
       const { error } = await supabase.rpc('accept_application', {
         p_application_id: id
       });
       if (error) throw error;
       return;
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getApplication(hackathonId: string, userId: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .eq('applicant_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  }
};
