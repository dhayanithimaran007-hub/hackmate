import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-9 h-9 animate-spin text-accent" />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          VERIFYING AUTHORIZATION...
        </span>
      </div>
    );
  }

  if (!user) {
    // Avoid redirect loops by never saving login or register as the return target
    const currentPath = location.pathname + location.search;
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
    const redirectTarget = isAuthRoute ? '/dashboard' : currentPath;

    return <Navigate to="/login" state={{ from: redirectTarget }} replace />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};
