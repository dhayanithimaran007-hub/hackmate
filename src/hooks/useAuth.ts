import { useContext } from 'react';
import { AuthContext } from '../contexts/authContextDef';

export const useAuth = () => useContext(AuthContext);
