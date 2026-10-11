import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[HackMate ErrorBoundary caught an exception]:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error || new Error('Unknown Error'), this.resetErrorBoundary);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground">
          <div className="w-full max-w-xl border border-accent/40 bg-card p-6 sm:p-10 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/30 text-accent">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs text-accent uppercase tracking-widest font-bold">
                RUNTIME EXCEPTION // FAULT RECOVERED
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight mb-3">
              SOMETHING WENT WRONG
            </h1>

            <p className="font-mono text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-6">
              HackMate prevented an unhandled UI crash from displaying a blank screen. You can retry the operation or return to a safe page.
            </p>

            {this.state.error && (
              <div className="bg-background border border-border p-4 mb-6 overflow-x-auto">
                <p className="font-mono text-xs text-accent font-semibold break-words">
                  {this.state.error.message || 'Unknown system error'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.resetErrorBoundary}
                className="flex-1 py-3 px-5 bg-foreground text-background font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-2 min-h-[46px]"
              >
                <RotateCcw className="w-4 h-4" />
                TRY AGAIN
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-5 bg-background border border-border font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:border-foreground transition-colors flex items-center justify-center gap-2 min-h-[46px]"
              >
                RELOAD APP
              </button>

              <a
                href="/"
                className="py-3 px-5 bg-background border border-border font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:border-foreground transition-colors flex items-center justify-center gap-2 min-h-[46px]"
              >
                <Home className="w-4 h-4" />
                HOME
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
