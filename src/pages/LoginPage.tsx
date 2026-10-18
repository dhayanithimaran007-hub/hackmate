import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ArrowRight } from 'lucide-react';
import EarthBackground from '../components/ui/EarthBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, login } = useAuth();
  
  // Safely resolve the return path, avoiding loops back to login/register
  const rawFrom = location.state?.from;
  const fromPath = typeof rawFrom === 'string'
    ? rawFrom
    : (rawFrom?.pathname ? (rawFrom.pathname + (rawFrom.search || '')) : '/dashboard');
  const target = (fromPath && fromPath !== '/login' && fromPath !== '/register')
    ? fromPath
    : '/dashboard';

  // If initial auth check is running, show centered spinner
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-accent" />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          INITIALIZING SESSION...
        </span>
      </div>
    );
  }

  // Declarative redirect if already authenticated
  if (user) {
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      {/* Decorative Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern" />

      {/* Signature Red Wireframe Earth as Decorative Focal Point */}
      <EarthBackground variant="center-auth" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative z-10">
        
        <Link to="/" className="mb-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm">
          <span className="font-bold text-2xl sm:text-3xl tracking-tight uppercase">
            HACK<span className="text-accent">MATE</span>
          </span>
        </Link>
        
        <div className="p-6 sm:p-8 w-full max-w-md bg-card border border-border rounded-sm shadow-2xl relative">
          <div className="mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground leading-tight mb-2">
              LOG IN
            </h1>
            <p className="font-sans text-xs text-text-secondary leading-relaxed">
              Enter your credentials to access your squads and applications.
            </p>
          </div>
          
          {error && (
            <div className="font-mono text-xs text-accent border border-accent/40 bg-accent/10 p-3 mb-5 rounded-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-mono text-xs sm:text-sm text-foreground transition-colors"
                placeholder="developer@domain.com"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="password">
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-mono text-xs sm:text-sm text-foreground transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-3 font-sans text-xs font-semibold uppercase tracking-wider bg-accent text-white hover:bg-hover-red transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <span className="font-sans text-xs text-text-secondary mr-2">
              Don't have an account?
            </span>
            <Link 
              to="/register" 
              className="font-sans text-xs font-semibold uppercase tracking-wider text-foreground hover:text-accent transition-colors"
            >
              Register now →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
