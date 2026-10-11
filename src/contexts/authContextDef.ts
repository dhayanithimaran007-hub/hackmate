import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  clearError: () => {},
});
