'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, DownloadCloud, ChevronRight, ChevronDown } from 'lucide-react';
import { errorMonitoringService } from '@/features/errors/errors.service';
import { Button } from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log exception to our Sentry / Firestore telemetry backend automatically
    errorMonitoringService.captureException(error, 'critical', 'ErrorBoundary', {
      route: typeof window !== 'undefined' ? window.location.pathname : 'server-render',
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleDownloadLog = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const crashData = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(crashData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `facultywise_crash_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-alt/20 p-6 font-manrope">
          <div className="w-full max-w-2xl bg-white border border-danger/25 rounded-2xl p-8 shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header Red Accent Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-danger" />

            <div className="flex gap-4 items-start">
              <div className="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-danger uppercase tracking-wider px-2 py-0.5 bg-danger/10 rounded-full">
                  System Telemetry Intercepted
                </span>
                <h1 className="text-xl font-bold text-text mt-1">Application Runtime Error</h1>
                <p className="text-sm text-text-muted leading-relaxed">
                  An uncaught React exception was caught by FacultyWise’s Sentry Telemetry engine. The error was safely logged to our administrator error monitoring console.
                </p>
              </div>
            </div>

            {/* Error Message Card */}
            <div className="mt-6 p-4 rounded-xl bg-danger/[0.03] border border-danger/10 text-danger text-sm font-semibold flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-danger mt-1.5 shrink-0" />
              <div className="break-all">{this.state.error?.message || 'Unknown runtime error'}</div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 items-center justify-between border-t border-border pt-6">
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReset}
                  variant="primary" 
                  className="gap-2 h-10 bg-danger hover:bg-red-700 font-bold"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                  Reload Application
                </Button>
                <Button 
                  onClick={this.handleDownloadLog}
                  variant="ghost" 
                  className="gap-2 h-10 border border-border/80 text-text-muted hover:text-text hover:bg-surface-alt/50 font-bold"
                >
                  <DownloadCloud className="h-4.5 w-4.5" />
                  Download Crash Log
                </Button>
              </div>
              
              <button 
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-xs font-bold text-text-muted hover:text-text flex items-center gap-1 transition-colors"
              >
                {this.state.showDetails ? (
                  <>
                    Hide Stack Trace <ChevronDown className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Stack Trace <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Stack Trace Details */}
            {this.state.showDetails && (
              <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">
                  Stack Telemetry Log
                </h4>
                <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto max-h-48 leading-relaxed whitespace-pre pr-2">
                  {this.state.error?.stack || 'No stack trace captured.'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
