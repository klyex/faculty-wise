'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Terminal, 
  Check, 
  EyeOff, 
  RefreshCw, 
  Flame, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Bug,
  Globe,
  Settings
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { errorMonitoringService } from "../errors.service";
import { ErrorLog, ErrorSeverity } from "@/lib/types/error.types";

export function ErrorTelemetryConsole() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<'unresolved' | 'all'>('unresolved');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Subscribe to live telemetry logs
  useEffect(() => {
    const unsubscribe = errorMonitoringService.subscribeErrorLogs((data) => {
      setLogs(data);
    });
    return () => unsubscribe();
  }, []);

  // Simulates a rendering crash to test the React Error Boundary
  if (shouldCrash) {
    throw new Error("Simulated React Crash Event: Developer clicked the trigger boundary test button.");
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'unresolved') return log.status === 'unresolved';
    return true;
  });

  const unresolvedCount = logs.filter(log => log.status === 'unresolved').length;
  const criticalCount = logs.filter(log => log.status === 'unresolved' && log.severity === 'critical').length;

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await errorMonitoringService.resolveError(id);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleIgnore = async (id: string) => {
    try {
      await errorMonitoringService.ignoreError(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateBackgroundError = async () => {
    const errorTypes = [
      {
        msg: "FirebaseError: [code=permission-denied]: Missing or insufficient permissions.",
        severity: "error" as ErrorSeverity,
        comp: "AuthRulesCheck"
      },
      {
        msg: "Failed to allocate rooms: Overlapped timetable constraints on Teacher ID T-204.",
        severity: "warning" as ErrorSeverity,
        comp: "SchedulerAllocationsEngine"
      },
      {
        msg: "NetworkError: Failed to fetch http://localhost:3000/api/v1/auth/session - connection timed out.",
        severity: "critical" as ErrorSeverity,
        comp: "SessionHeartbeat"
      }
    ];

    const randomErr = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    await errorMonitoringService.captureException(
      randomErr.msg, 
      randomErr.severity, 
      randomErr.comp,
      { route: window.location.pathname, role: 'admin' }
    );
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await errorMonitoringService.clearAllErrors();
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  const getSeverityStyle = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'error':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-surface-alt text-text-muted';
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm bg-white overflow-hidden font-manrope">
      
      {/* Console Header */}
      <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between px-6 py-4 bg-surface-alt/30">
        <div>
          <CardTitle className="text-sm font-bold text-text flex items-center gap-1.5">
            <ShieldAlert className="h-5 w-5 text-danger" />
            Sentry Production Telemetry
          </CardTitle>
          <p className="text-[10px] text-text-muted mt-0.5">Real-time uncaught exception interception</p>
        </div>
        {unresolvedCount > 0 && (
          <span className="flex h-5 px-2 rounded-full bg-danger text-[10px] font-bold text-white items-center justify-center border border-surface shadow-[0_0_8px_rgba(192,57,43,0.3)] animate-pulse">
            {unresolvedCount} Active
          </span>
        )}
      </CardHeader>

      <CardContent className="p-0">
        
        {/* Controls & Simulators Row */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/40 bg-surface px-4 py-3 gap-2">
          
          {/* Tabs */}
          <div className="flex gap-1.5 bg-surface-alt/50 p-0.5 rounded-lg border border-border/50 text-[11px] font-semibold">
            <button 
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === 'unresolved' 
                  ? 'bg-white text-text font-bold shadow-xs border border-border/40' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Unresolved ({unresolvedCount})
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === 'all' 
                  ? 'bg-white text-text font-bold shadow-xs border border-border/40' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              All Logs ({logs.length})
            </button>
          </div>

          {/* Diagnostics Simulator Triggers */}
          <div className="flex gap-2">
            <Button
              onClick={handleSimulateBackgroundError}
              variant="ghost"
              size="sm"
              className="text-[10px] h-7 px-2 border border-border hover:bg-surface-alt font-bold gap-1 text-text-muted hover:text-text"
            >
              <Bug className="h-3.5 w-3.5" />
              Simulate Error
            </Button>
            <Button
              onClick={() => setShouldCrash(true)}
              variant="ghost"
              size="sm"
              className="text-[10px] h-7 px-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold gap-1"
            >
              <Flame className="h-3.5 w-3.5 animate-bounce" />
              Test Crash Boundary
            </Button>
          </div>

        </div>

        {/* Live Errors Feed */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40 bg-surface min-h-[140px]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-text-muted">
              <div className="h-10 w-10 rounded-full bg-surface-alt flex items-center justify-center text-text-muted/40 mb-2 border border-dashed border-border">
                <Terminal className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-xs font-bold text-text">No active Sentry exceptions</h4>
              <p className="text-[10px] text-text-muted/80 mt-1 max-w-[220px]">
                Production environment is running healthy with zero unresolved telemetry logs.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div 
                  key={log.id}
                  className={`flex flex-col p-4 hover:bg-surface-alt/10 transition-colors ${
                    log.status === 'unresolved' ? 'bg-danger/[0.01]' : ''
                  }`}
                >
                  <div className="flex gap-3 items-start cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                    {/* Expand Indicator */}
                    <div className="mt-1 text-text-muted/60 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>

                    {/* Content */}
                    <div className="space-y-1 flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-start gap-1 flex-wrap sm:flex-nowrap">
                        <h4 className="text-[11px] font-mono font-bold text-text truncate max-w-[200px] sm:max-w-xs break-all" title={log.message}>
                          {log.message}
                        </h4>
                        <div className="flex gap-1.5 shrink-0 items-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getSeverityStyle(log.severity)}`}>
                            {log.severity}
                          </span>
                          {log.status !== 'unresolved' && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-semibold bg-gray-50 border border-gray-200 text-gray-400 capitalize">
                              {log.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[9px] text-text-muted">
                        <span>Component: <strong className="font-mono text-[9px] text-text-muted/95">{log.componentName}</strong></span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stack & Diagnostics Drawer */}
                  {isExpanded && (
                    <div className="mt-3 ml-7 p-3 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden animate-in slide-in-from-top-1.5 duration-150 space-y-2.5">
                      
                      {/* Stack Trace */}
                      {log.stack && (
                        <div>
                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest font-mono block mb-1">
                            Error Stack Telemetry
                          </span>
                          <pre className="text-[9.5px] font-mono text-gray-300 overflow-x-auto max-h-32 leading-relaxed whitespace-pre pr-1">
                            {log.stack}
                          </pre>
                        </div>
                      )}

                      {/* Device Context */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-800 pt-2 text-[9px] font-mono text-gray-400">
                        <div className="truncate">
                          <span className="text-gray-500">URL: </span>
                          <span className="text-gray-300">{log.url}</span>
                        </div>
                        <div className="truncate" title={log.userAgent}>
                          <span className="text-gray-500">Browser: </span>
                          <span className="text-gray-300">{log.userAgent}</span>
                        </div>
                      </div>

                      {/* Diagnostic Resolution Controls */}
                      {log.status === 'unresolved' && (
                        <div className="flex gap-1.5 pt-2 border-t border-gray-800 justify-end">
                          <button
                            onClick={() => handleIgnore(log.id)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-200 px-2.5 py-1 bg-gray-800 rounded-md border border-gray-700 transition-colors"
                          >
                            Ignore Log
                          </button>
                          <button
                            onClick={() => handleResolve(log.id)}
                            disabled={resolvingId === log.id}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 bg-emerald-950 border border-emerald-900/60 rounded-md transition-colors flex items-center gap-1"
                          >
                            {resolvingId === log.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Close Issue
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Dashboard Actions Footer */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between p-3.5 border-t border-border/40 bg-surface-alt/10">
            <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Sentry ingestion active (100% telemetry coverage)
            </span>
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="text-[10px] font-bold text-danger hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              {clearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Clear Console
            </button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
export default ErrorTelemetryConsole;
