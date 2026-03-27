import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Firestore Error: ${parsed.error} (Operation: ${parsed.operationType})`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#1a1c2e] border border-[#303456] rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl">
            <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto animate-pulse">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                Something <span className="text-rose-500">Went Wrong</span>
              </h1>
              <div className="p-4 bg-black/20 rounded-2xl border border-[#303456]/50">
                <p className="text-slate-400 text-sm font-mono break-words leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-pink-500/20 uppercase tracking-widest text-[10px]"
              >
                <RefreshCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-[#252841] hover:bg-[#2d3150] text-white font-black py-4 rounded-2xl transition-all border border-[#303456] uppercase tracking-widest text-[10px]"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>

            {isFirestoreError && (
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                Our team has been notified of this database error.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
