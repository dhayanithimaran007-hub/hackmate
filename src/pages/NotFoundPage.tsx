import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal } from 'lucide-react';
import EarthBackground from '../components/ui/EarthBackground';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-[calc(100vh-80px)] text-center relative overflow-hidden bg-background text-foreground">
      {/* Decorative Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-pattern" />

      {/* Earth visual */}
      <EarthBackground variant="center-auth" opacity={0.4} />

      <div className="max-w-md w-full border border-border p-8 md:p-10 bg-card rounded-sm flex flex-col items-center relative z-10 shadow-2xl">
        <div className="p-3 bg-accent/10 text-accent border border-accent/30 rounded-sm mb-5">
          <Terminal size={28} />
        </div>
        <span className="font-mono text-xs text-accent uppercase tracking-widest mb-1.5 font-semibold">
          ERROR 404 // ORBIT DRIFT
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-3 leading-tight">
          PAGE NOT FOUND
        </h1>
        <p className="font-sans text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
          The requested coordinate or hackathon does not exist, has expired, or is temporarily out of range.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-accent hover:bg-hover-red text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>RETURN HOME</span>
          </Link>
          <Link
            to="/discover"
            className="flex-1 inline-flex items-center justify-center h-10 px-4 border border-border bg-surface-elevated hover:bg-[#16191E] font-sans text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-foreground rounded-sm transition-colors"
          >
            DISCOVER TEAMS
          </Link>
        </div>
      </div>
    </div>
  );
}
