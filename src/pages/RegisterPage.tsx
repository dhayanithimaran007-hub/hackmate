import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ArrowRight } from 'lucide-react';
import EarthBackground from '../components/ui/EarthBackground';

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
        <Loader2 className="w-7 h-7 animate-spin text-accent" />
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
        setSuccess('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setSuccess('Registration successful! Please check your email if confirmation is required, then sign in.');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      {/* Decorative Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern" />

      {/* Signature Red Wireframe Earth Background */}
      <EarthBackground variant="center-auth" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative z-10">
        
        <Link to="/" className="mb-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm">
          <span className="font-bold text-2xl sm:text-3xl tracking-tight uppercase">
            HACK<span className="text-accent">MATE</span>
          </span>
        </Link>
        
        <div className="p-6 sm:p-8 w-full max-w-lg bg-card border border-border rounded-sm shadow-2xl relative">
          <div className="mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground leading-tight mb-2">
              CREATE ACCOUNT
            </h1>
            <p className="font-sans text-xs text-text-secondary leading-relaxed">
              Join the developer platform to find teammates and organize hackathon teams.
            </p>
          </div>
          
          {error && (
            <div className="font-mono text-xs text-accent border border-accent/40 bg-accent/10 p-3 mb-5 rounded-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="font-mono text-xs text-success border border-success/40 bg-success/10 p-3 mb-5 rounded-sm">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="fullName">
                FULL NAME
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground transition-colors"
                placeholder="Developer Name"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground transition-colors"
                placeholder="developer@domain.com"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="password">
                  PASSWORD
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground transition-colors"
                  placeholder="At least 6 chars"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-semibold tracking-wider uppercase text-text-secondary" htmlFor="confirmPassword">
                  CONFIRM PASSWORD
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#101216] border border-border focus:border-accent px-3.5 py-2.5 rounded-sm outline-none font-sans text-xs sm:text-sm text-foreground transition-colors"
                  placeholder="Repeat password"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-3 font-sans text-xs font-semibold uppercase tracking-wider bg-accent text-white hover:bg-hover-red transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>CREATING PROFILE...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <span className="font-sans text-xs text-text-secondary mr-2">
              Already have an account?
            </span>
            <Link 
              to="/login" 
              className="font-sans text-xs font-semibold uppercase tracking-wider text-foreground hover:text-accent transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
