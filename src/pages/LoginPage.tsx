import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const from = location.state?.from?.pathname || '/dashboard';

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      
      {/* Decorative Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern"></div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative z-10">
        
        <Link to="/" className="mb-10">
          <span className="font-display text-3xl sm:text-4xl tracking-tighter uppercase">
            HACK<span className="text-accent">MATE</span>
          </span>
        </Link>
        
        <div className="paper-panel p-6 sm:p-10 w-full max-w-md">
          <h1 className="heading-page uppercase leading-none mb-2">
            LOG IN
          </h1>
          <p className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-6">
            AUTHORIZE TO ACCESS HACKMATE.
          </p>
          
          {error && (
            <div className="font-mono text-xs uppercase tracking-wider text-accent border border-accent p-3.5 mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground" htmlFor="email">EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 min-h-[46px] focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="USER@DOMAIN.COM"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground" htmlFor="password">PASSWORD</label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 min-h-[46px] focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 min-h-[48px] mt-2 font-mono text-sm font-bold uppercase tracking-wider bg-foreground text-background hover:bg-accent hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'AUTHENTICATING...' : 'SECURE LOG IN'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center">
            <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mr-2">
              DON'T HAVE AN ACCOUNT?
            </span>
            <Link to="/register" className="font-mono text-xs font-bold tracking-wider uppercase border-b border-foreground hover:text-accent hover:border-accent transition-colors pb-0.5">
              REGISTER NOW
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
