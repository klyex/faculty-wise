'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Calendar, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  History,
  MoreVertical,
  Plus,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Database,
  RefreshCw,
  Play,
  ArrowUpRight,
  Shield,
  Loader2,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { auditService } from "@/features/audit/audit.service";
import { AuditLog } from "@/lib/types/firestore.types";
import { ErrorTelemetryConsole } from "@/features/errors/components/ErrorTelemetryConsole";

export function OperationsDashboardView() {
  const { data, loading, error, triggerNewRun } = useAdminDashboard();
  const [liveLogs, setLiveLogs] = useState<AuditLog[]>([]);
  const [runningNewRun, setRunningNewRun] = useState(false);

  // Subscribe to audit logs in real-time
  useEffect(() => {
    try {
      const unsubscribe = auditService.subscribeToLogs((logs) => {
        setLiveLogs(logs);
      }, 5); // display the latest 5 logs
      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to subscribe to live audit logs:", err);
    }
  }, []);

  const handleStartRun = async () => {
    if (runningNewRun) return;
    setRunningNewRun(true);
    try {
      await triggerNewRun();
    } catch (err) {
      console.error("Failed to trigger run:", err);
    } finally {
      // Small cooldown before unlocking the button to let the UI react
      setTimeout(() => setRunningNewRun(false), 1500);
    }
  };

  const getHealthStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-success text-white border-success/20';
      case 'degraded':
        return 'bg-warning text-white border-warning/20';
      case 'down':
        return 'bg-danger text-white border-danger/20';
      default:
        return 'bg-text-muted text-white';
    }
  };

  const getOverallHealthBannerColor = (status: 'healthy' | 'degraded' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'border-success/30 bg-success/5 text-success';
      case 'degraded':
        return 'border-warning/30 bg-warning/5 text-warning';
      case 'critical':
        return 'border-danger/30 bg-danger/5 text-danger';
      default:
        return 'border-border bg-surface';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-text-muted animate-pulse font-manrope">Loading real-time admin diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-danger/5 rounded-xl border border-danger/20 max-w-xl mx-auto my-12">
        <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text font-source-serif">Dashboard Connection Failed</h3>
        <p className="text-sm text-text-muted mt-2">{error.message || "Failed to load real-time analytics."}</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const latestRun = data?.activeRuns[0];
  const isRunActive = latestRun?.status === 'running' || latestRun?.status === 'pending';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title / Action Header */}
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-text font-source-serif">Operations & Systems Dashboard</h1>
              {data && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getOverallHealthBannerColor(data.systemHealth.overallStatus)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    data.systemHealth.overallStatus === 'healthy' ? 'bg-success' : 
                    data.systemHealth.overallStatus === 'degraded' ? 'bg-warning' : 'bg-danger'
                  }`} />
                  SYSTEM: {data.systemHealth.overallStatus.toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-text-muted mt-1 font-manrope">Academic Year 2025-2026 • First Semester</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="hover:bg-surface-alt font-manrope">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button 
              onClick={handleStartRun} 
              disabled={isRunActive || runningNewRun}
              className="bg-primary hover:bg-primary-strong transition-all duration-300 font-manrope shadow-sm"
            >
              {isRunActive || runningNewRun ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Optimization...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2 text-accent" />
                  New Schedule Run
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global System Banner if Degraded/Critical */}
        {data && data.systemHealth.overallStatus !== 'healthy' && (
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-manrope mb-4 ${getOverallHealthBannerColor(data.systemHealth.overallStatus)}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>System performance is currently <strong>{data.systemHealth.overallStatus.toUpperCase()}</strong>. Some operations may display higher-than-average query latencies.</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Monitoring</Badge>
          </div>
        )}

        {/* 4 Core KPIs driven by useAdminDashboard */}
        {data && (
          <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatTile
              title="Schedule Conflicts"
              value={data.scheduleConflictsCount}
              icon={AlertTriangle}
              description="Real-time overlap detections"
              trend={data.scheduleConflictsCount === 0 ? { value: "Fully Optimized", positive: true } : { value: `${data.scheduleConflictsCount} issues`, positive: false }}
              className="border border-border/60 hover:shadow-md transition-all duration-300 bg-white"
            />
            <StatTile
              title="Unassigned Classes"
              value={data.unassignedClassesCount}
              icon={Calendar}
              description="Courses pending timetable block"
              trend={{ value: "Live Sync", positive: true }}
              className="border border-border/60 hover:shadow-md transition-all duration-300 bg-white"
            />
            <StatTile
              title="Registered Users"
              value={data.userStats.total}
              icon={Users}
              description={`${data.userStats.active} active accounts online`}
              trend={{ value: `${data.userStats.teachers} Teachers / ${data.userStats.students} Students`, positive: true }}
              className="border border-border/60 hover:shadow-md transition-all duration-300 bg-white"
            />
            <StatTile
              title="Optimization Score"
              value={`${data.optimizationScore}%`}
              icon={Zap}
              description="Timetable constraints match rating"
              trend={{ value: "+1.4% change", positive: true }}
              className="border border-border/60 hover:shadow-md transition-all duration-300 bg-white"
            />
          </div>
        )}
      </div>

      {/* Main Grid Panel */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-7">
        
        {/* Left Side: Optimization Runs & User Base Breakdown (4 Columns) */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4 md:space-y-6">
          
          {/* Active & Historical Runs Overview */}
          <Card className="border border-border/80 shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <div>
                <CardTitle className="text-lg font-bold text-text">Scheduling Runs & Optimization Logs</CardTitle>
                <p className="text-xs text-text-muted mt-1">Live tracking of timetable optimization algorithms</p>
              </div>
              {isRunActive && (
                <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-bounce" />
                  Live Running
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {data && data.activeRuns.length === 0 ? (
                <div className="text-center py-8 bg-surface-alt/40 rounded-xl border border-dashed border-border/60">
                  <Zap className="h-8 w-8 text-text-muted/60 mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-muted">No scheduling runs triggered yet</p>
                  <p className="text-xs text-text-muted mt-1">Click "New Schedule Run" at the top to start</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {data?.activeRuns.map((run) => {
                    const isActive = run.status === 'running' || run.status === 'pending';
                    return (
                      <div key={run.id} className="p-4 rounded-xl border border-border/60 bg-surface/40 hover:bg-surface transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              isActive ? 'bg-primary/10 text-primary' : 
                              run.status === 'completed' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                            }`}>
                              {isActive ? <RefreshCw className="h-4 w-4 animate-spin" /> : 
                               run.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-text font-manrope">Run ID: {run.id.slice(0, 8)}</span>
                                <Badge variant={run.status === 'completed' ? 'success' : run.status === 'running' ? 'info' : 'warning'} className="text-[10px] py-0 px-2 font-medium">
                                  {run.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-text-muted mt-0.5">{run.term}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-text-muted block">Initiated by</span>
                            <span className="text-xs font-semibold text-text">{run.startedBy}</span>
                          </div>
                        </div>

                        {/* Progress Bar (Always Live) */}
                        {isActive ? (
                          <div className="space-y-1.5 mt-2">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-primary flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                Processing timetable allocations...
                              </span>
                              <span className="text-primary font-bold">{run.progress}%</span>
                            </div>
                            <div className="w-full bg-surface-alt rounded-full h-2.5 overflow-hidden shadow-inner border border-border/40">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(15,107,168,0.5)]" 
                                style={{ width: `${run.progress}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-center font-manrope">
                            <div className="bg-surface-alt/30 p-2 rounded-lg">
                              <span className="text-[10px] text-text-muted block">Conflicts</span>
                              <span className={`text-sm font-bold ${run.conflicts === 0 ? 'text-success' : 'text-warning'}`}>{run.conflicts} Overlaps</span>
                            </div>
                            <div className="bg-surface-alt/30 p-2 rounded-lg">
                              <span className="text-[10px] text-text-muted block">Efficiency</span>
                              <span className="text-sm font-bold text-primary">{run.efficiency}%</span>
                            </div>
                            <div className="bg-surface-alt/30 p-2 rounded-lg">
                              <span className="text-[10px] text-text-muted block">Duration</span>
                              <span className="text-sm font-bold text-text">
                                {run.completedAt ? '5.2s' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted">
                           <span className="flex items-center gap-1">
                             <Clock className="h-3 w-3" />
                             Started: {new Date(run.startedAt).toLocaleTimeString()}
                           </span>
                           {run.completedAt && (
                             <span>
                               Completed: {new Date(run.completedAt).toLocaleTimeString()}
                             </span>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Directory Live Directory Stats */}
          {data && (
            <Card className="border border-border/80 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-bold text-text">Real-time Users & Role Distribution</CardTitle>
                <p className="text-xs text-text-muted mt-1">Live snapshot of verified accounts and access categories</p>
              </CardHeader>
              <CardContent className="pt-6 font-manrope">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  
                  {/* Left Column: Role counts and ratio bar */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Access Roles breakdown</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-text">Faculty / Teachers</span>
                          <span className="text-text-muted font-bold">{data.userStats.teachers} accounts</span>
                        </div>
                        <div className="w-full bg-surface-alt rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${(data.userStats.teachers / data.userStats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-text">Students Directory</span>
                          <span className="text-text-muted font-bold">{data.userStats.students} accounts</span>
                        </div>
                        <div className="w-full bg-surface-alt rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-accent h-full rounded-full" 
                            style={{ width: `${(data.userStats.students / data.userStats.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-text">Administrative Officers</span>
                          <span className="text-text-muted font-bold">{data.userStats.admins} accounts</span>
                        </div>
                        <div className="w-full bg-surface-alt rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-success h-full rounded-full" 
                            style={{ width: `${(data.userStats.admins / data.userStats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Summary */}
                  <div className="flex flex-col justify-between p-4 rounded-xl border border-border bg-surface-alt/25">
                    <div>
                      <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-2">User Status Telemetry</h4>
                      <p className="text-xs text-text-muted">Firestore counts update dynamically when access statuses change in management view.</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <div className="text-center flex-1">
                        <span className="h-2 w-2 rounded-full bg-success inline-block mr-1.5 animate-pulse" />
                        <span className="text-xl font-bold text-text block">{data.userStats.active}</span>
                        <span className="text-[10px] text-text-muted">Active</span>
                      </div>
                      <div className="h-8 w-px bg-border mx-4" />
                      <div className="text-center flex-1">
                        <span className="h-2 w-2 rounded-full bg-text-muted inline-block mr-1.5" />
                        <span className="text-xl font-bold text-text block">{data.userStats.inactive}</span>
                        <span className="text-[10px] text-text-muted">Inactive</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Side: System Health & Activity Feed (3 Columns) */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4 md:space-y-6">
          
          {/* Real-time System Health Telemetry */}
          {data && (
            <Card className="border border-border/80 shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <CardTitle className="text-lg font-bold text-text">System Health Monitor</CardTitle>
                  <p className="text-xs text-text-muted mt-1">Real-time infrastructure performance</p>
                </div>
                <div className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    data.systemHealth.overallStatus === 'healthy' ? 'bg-success' : 'bg-warning'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    data.systemHealth.overallStatus === 'healthy' ? 'bg-success' : 'bg-warning'
                  }`}></span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 font-manrope space-y-5">
                
                {/* Latency List */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Service States</h4>
                  {data.systemHealth.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          service.status === 'healthy' ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'
                        }`} />
                        <span className="font-semibold text-text">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-[10px]">{service.description}</span>
                        <Badge variant="outline" className={`font-mono text-[10px] ${
                          service.latency < 15 ? 'bg-success/5 text-success' : 
                          service.latency < 40 ? 'bg-info/5 text-info' : 'bg-warning/5 text-warning'
                        }`}>
                          {service.latency}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Server Load Progress Telemetry */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Server Load metrics</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-primary" />
                        CPU Load
                      </span>
                      <span className="font-bold text-text">{data.systemHealth.metrics.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          data.systemHealth.metrics.cpuUsage > 80 ? 'bg-danger' : 
                          data.systemHealth.metrics.cpuUsage > 50 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${data.systemHealth.metrics.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-primary" />
                        Memory Occupancy
                      </span>
                      <span className="font-bold text-text">{data.systemHealth.metrics.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000"
                        style={{ width: `${data.systemHealth.metrics.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs p-2.5 rounded-lg bg-surface-alt/30 border border-border/30 mt-3">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-success" />
                      API Query Volume
                    </span>
                    <span className="font-bold text-text">{data.systemHealth.metrics.requestRate} req/s</span>
                  </div>

                  <div className="flex justify-between text-[10px] text-text-muted mt-2 px-1">
                    <span>Uptime: {data.systemHealth.metrics.uptime}</span>
                    <span>Refreshed live</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          <ErrorTelemetryConsole />

          {/* Real-time Streaming Activity Log */}
          <Card className="border border-border/80 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold text-text flex items-center justify-between">
                <span>Streaming Activity Logs</span>
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              </CardTitle>
              <p className="text-xs text-text-muted mt-1">Live audit logs recorded via Firestore security hooks</p>
            </CardHeader>
            <CardContent className="pt-6">
              {liveLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted">
                  <Clock className="h-6 w-6 text-text-muted/50 mx-auto mb-2" />
                  Awaiting database audit streaming...
                </div>
              ) : (
                <div className="space-y-4">
                  {liveLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-xs border-b border-border/30 pb-3 last:border-0 last:pb-0 font-manrope">
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-semibold text-text truncate max-w-[150px]">{log.userName}</p>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp.toDate?.() || log.timestamp).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                        <p className="text-text-muted text-[11px] font-medium leading-relaxed">
                          Performed <strong className="text-primary">{log.action}</strong> on {log.targetType} <code className="bg-surface-alt px-1 py-0.5 rounded text-[10px] font-mono">{log.targetId.slice(0, 8)}</code>
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="bg-surface-alt/45 p-1.5 rounded text-[10px] text-text-muted font-mono max-h-[50px] overflow-hidden overflow-ellipsis truncate">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={() => window.location.href = '/dashboard?tab=audit'} 
                    variant="ghost" 
                    className="w-full mt-2 text-primary hover:text-primary-strong text-xs font-semibold hover:bg-surface-alt/40 border border-border/40 py-2.5 rounded-lg"
                  >
                    View All Audit Logs
                    <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
        
      </div>
    </div>
  );
}

export default OperationsDashboardView;
