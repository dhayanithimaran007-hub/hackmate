import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          INITIALIZING SESSION...
        </span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const authData = await authService.register(email, password, fullName);
      if (authData?.session) {
        setSuccess('Account created and verified! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setSuccess('Registration successful! Please check your email to confirm your account if required, then log in. Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
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
        
        <div className="paper-panel p-6 sm:p-10 w-full max-w-xl">
          <h1 className="heading-page uppercase leading-none mb-2">
            JOIN THE SYSTEM
          </h1>
          <p className="font-mono text-xs tracking-wider uppercase text-muted-foreground mb-6">
            CREATE AN ACCOUNT TO FIND OR BUILD HACKATHON TEAMS.
          </p>
          
          {error && (
            <div className="font-mono text-xs uppercase tracking-wider text-accent border border-accent p-3.5 mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="font-mono text-xs uppercase tracking-wider text-foreground border border-foreground p-3.5 mb-6">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground" htmlFor="fullName">FULL NAME</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 min-h-[46px] focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="JOHN DOE"
              />
            </div>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground" htmlFor="password">PASSWORD</label>
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
              
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold tracking-wider uppercase text-muted-foreground" htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-card border border-border px-4 py-3 min-h-[46px] focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 min-h-[48px] mt-2 font-mono text-sm font-bold uppercase tracking-wider bg-foreground text-background hover:bg-accent hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'CREATING RECORD...' : 'INITIALIZE ACCOUNT'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center">
            <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground mr-2">
              ALREADY HAVE AN ACCOUNT?
            </span>
            <Link to="/login" className="font-mono text-xs font-bold tracking-wider uppercase border-b border-foreground hover:text-accent hover:border-accent transition-colors pb-0.5">
              LOG IN INSTEAD
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
