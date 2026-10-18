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

  async withdrawApplication(id: string, hackathonId?: string, applicantId?: string) {
    // 1. Try server-side transactional RPC first
    const { error: rpcError } = await supabase.rpc('withdraw_application', {
      p_application_id: id
    });

    if (!rpcError) {
      return;
    }

    // Check if error is specifically missing RPC
    const isMissingRpc = 
      rpcError.code === 'PGRST202' || 
      rpcError.code === '42883' ||
      rpcError.message?.toLowerCase().includes('could not find the function') ||
      rpcError.message?.toLowerCase().includes('does not exist');

    if (!isMissingRpc) {
      // Real database error from the RPC (e.g. 'Not authorized', 'Application is already rejected or withdrawn')
      throw rpcError;
    }

    // 2. Fallback to client-side multi-table update protected by Supabase RLS policies
    const { data: appData, error: fetchErr } = await supabase
      .from('applications')
      .select('hackathon_id, applicant_id, status')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!appData) throw new Error('Application not found');

    const hId = hackathonId || appData.hackathon_id;
    const aId = applicantId || appData.applicant_id;
    const currentStatus = appData.status;

    if (currentStatus === 'rejected') {
      throw new Error('Application is already rejected or withdrawn');
    }

    if (currentStatus === 'accepted') {
      // Remove membership record
      const { error: memberDelErr } = await supabase
        .from('hackathon_members')
        .delete()
        .eq('hackathon_id', hId)
        .eq('user_id', aId);

      if (memberDelErr) {
        console.warn('hackathon_members deletion warning:', memberDelErr);
      }

      // Update application status to rejected
      const { error: appUpdateErr } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (appUpdateErr) throw appUpdateErr;

      // Update hackathon counters
      const { data: hackathon, error: hackFetchErr } = await supabase
        .from('hackathons')
        .select('open_positions, team_size, max_team_size')
        .eq('id', hId)
        .single();

      if (!hackFetchErr && hackathon) {
        const newOpenPositions = Math.min(hackathon.max_team_size, (hackathon.open_positions ?? 0) + 1);
        const newTeamSize = Math.max(1, (hackathon.team_size ?? 1) - 1);
        await supabase
          .from('hackathons')
          .update({
            open_positions: newOpenPositions,
            team_size: newTeamSize,
            updated_at: new Date().toISOString()
          })
          .eq('id', hId);
      }
    } else {
      // Pending status: simply update to rejected
      const { error: appUpdateErr } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (appUpdateErr) throw appUpdateErr;
    }
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
