import React, { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import type { Profile } from '../types/database';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    let mounted = true;
    let authRequestId = 0;

    async function syncAuth(currentSession: Session | null) {
      const currentId = ++authRequestId;

      if (!mounted) return;

      // Update session and user immediately so guards/routes get current auth state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (!currentSession?.user) {
        setProfile(null);
        if (mounted && currentId === authRequestId) {
          setLoading(false);
        }
        return;
      }

      // Fetch profile safely without throwing
      try {
        const userProfile = await authService.getProfile(currentSession.user.id);
        if (mounted && currentId === authRequestId) {
          setProfile(userProfile);
        }
      } catch (profError: any) {
        if (import.meta.env.DEV) {
          console.warn('[HackMate Auth] Could not fetch profile for user:', profError);
        }
        if (mounted && currentId === authRequestId) {
          setProfile(null);
        }
      } finally {
        if (mounted && currentId === authRequestId) {
          setLoading(false);
        }
      }
    }

    // 1. Initial session bootstrap
    async function initializeSession() {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[HackMate Auth] Initial session check warning:', sessionError.message);
        }
        if (mounted) {
          await syncAuth(initialSession);
        }
      } catch (err: any) {
        console.error('[HackMate Auth] Initial session check error:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    initializeSession();

    // 2. Realtime listener for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (import.meta.env.DEV) {
        console.log(`[HackMate Auth] Event: ${event}`);
      }

      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        authRequestId++;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Sync updated session
      await syncAuth(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login(email, password);

      if (data?.session) {
        // Immediately sync state so ProtectedRoute has non-null user before navigating
        setSession(data.session);
        setUser(data.session.user);

        // Fetch profile without throwing or blocking
        try {
          const userProfile = await authService.getProfile(data.session.user.id);
          setProfile(userProfile);
        } catch (profErr) {
          console.warn('[HackMate Auth] Profile load deferred after login:', profErr);
        }
      }

      return data;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err: any) {
      console.warn('[HackMate Auth] Logout error (clearing local state anyway):', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);
      } catch (err) {
        console.warn('[HackMate Auth] Failed to refresh profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, error, login, logout, refreshProfile, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
