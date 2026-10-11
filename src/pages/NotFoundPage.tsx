import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-[calc(100vh-80px)] text-center">
      <div className="max-w-md w-full border border-border p-8 md:p-10 bg-background flex flex-col items-center">
        <div className="p-3 bg-accent/10 text-accent border border-accent/20 mb-6">
          <Terminal size={32} />
        </div>
        <span className="font-mono text-xs text-accent uppercase tracking-widest mb-2">ERROR 404 // RESOURCE NOT FOUND</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight mb-4">
          PAGE NOT FOUND
        </h1>
        <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-8">
          The requested route or hackathon does not exist, has been removed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-foreground text-background font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} /> RETURN HOME
          </Link>
          <Link
            to="/discover"
            className="flex-1 inline-flex items-center justify-center py-3 px-4 border border-border font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-muted/30 transition-colors min-h-[44px]"
          >
            DISCOVER TEAMS
          </Link>
        </div>
      </div>
    </div>
  );
}
