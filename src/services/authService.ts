import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export const authService = {
  async register(email: string, password: string, fullName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;

    // Supabase returns a dummy user with empty identities if account exists (to prevent enumeration)
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    return authData;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
  
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Error fetching profile:', error.message || error);
        }
        return null;
      }
      
      return data;
    } catch (err) {
      console.warn('Unexpected error in getProfile:', err);
      return null;
    }
  }
};
