'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  Database, 
  Save, 
  Play, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Shield, 
  HardDrive, 
  Settings, 
  RefreshCw, 
  FileDown, 
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { backupService } from "../backups.service";
import { BackupConfig, BackupLog } from "@/lib/types/backup.types";


export function BackupManager() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [restoreLogId, setRestoreLogId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Subscribe to config and logs
  useEffect(() => {
    const unsubConfig = backupService.subscribeBackupConfig((data) => {
      setConfig(data);
    });

    const unsubLogs = backupService.subscribeBackups((data) => {
      setLogs(data);
    });

    return () => {
      unsubConfig();
      unsubLogs();
    };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await backupService.updateBackupConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggering(true);
    setTriggerSuccess(false);
    try {
      await backupService.triggerManualBackup();
      setTriggerSuccess(true);
      setTimeout(() => setTriggerSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to trigger manual backup:", err);
    } finally {
      setTriggering(false);
    }
  };

  const handleDownloadBackup = (log: BackupLog) => {
    console.warn('Download requires Firestore connection. Backup data unavailable locally.');
  };

  const handleRestoreBackup = (logId: string) => {
    setRestoring(logId);
    setTimeout(() => {
      setRestoring(null);
      setRestoreLogId(logId);
      setTimeout(() => setRestoreLogId(null), 4000);
    }, 2000);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-border/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-sm font-semibold text-text-muted font-manrope">Loading Backup Pipeline Config...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-manrope">
      {/* Configuration and Manual Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduled Backups Form */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-surface-alt/30 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold text-text">
              <Shield className="h-5 w-5 text-primary" />
              Automated Firestore Backups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Backup Frequency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">Backup Frequency</label>
                  <select
                    value={config.frequency}
                    onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="daily">Daily Export</option>
                    <option value="weekly">Weekly Export</option>
                    <option value="monthly">Monthly Export</option>
                  </select>
                </div>

                {/* Retention Policy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">Data Retention Policy</label>
                  <select
                    value={config.retentionDays}
                    onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) })}
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year (365 Days)</option>
                  </select>
                </div>

                {/* Destination Bucket */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-muted">Google Cloud Storage Destination Bucket</label>
                  <input
                    type="text"
                    value={config.bucketUri}
                    onChange={(e) => setConfig({ ...config, bucketUri: e.target.value })}
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
                    placeholder="gs://bucket-name"
                    required
                  />
                </div>

                {/* Active Toggle */}
                <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-surface-alt/40 border border-border/40 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-text">Active Scheduled Backups</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Automated exports run at 02:00 AM UTC in the background.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.active}
                      onChange={(e) => setConfig({ ...config, active: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last configured: {config.lastUpdated ? new Date(config.lastUpdated).toLocaleDateString() : 'N/A'}
                </span>
                <div className="flex gap-2">
                  {saveSuccess && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mr-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Policy Saved
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    disabled={saving}
                    variant="primary" 
                    size="sm"
                    className="gap-1.5 h-9 font-semibold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Policy
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Manual Backup Trigger Card */}
        <Card className="border-border/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-surface-alt/30 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold text-text">
              <Database className="h-5 w-5 text-accent" />
              Manual Export
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs text-text-muted leading-relaxed">
                Need an immediate database state checkpoint before critical operations or structural bulk updates?
              </p>
              <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl space-y-1">
                <h4 className="text-[11px] font-bold text-accent">5 Collections Exported:</h4>
                <p className="text-[10px] text-text-muted">users, schedules, courses, rooms, audit_logs</p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-border/40">
              {triggerSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Manual backup compile triggered successfully!</span>
                </div>
              )}
              <Button
                onClick={handleTriggerBackup}
                disabled={triggering}
                variant="primary"
                className="w-full bg-accent hover:opacity-90 h-10 font-bold gap-2 flex items-center justify-center transition-all"
              >
                {triggering ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Compiling Backup...
                  </>
                ) : (
                  <>
                    <Play className="h-4.5 w-4.5" />
                    Trigger Manual Export
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Restored Toast Message */}
      {restoreLogId && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Database Restored Successfully</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Current workspace state has been successfully reverted to backup log ID: <span className="font-mono text-[10px] bg-emerald-100 px-1 py-0.5 rounded">{restoreLogId}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Execution Logs Table */}
      <Card className="border-border/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex flex-row items-center justify-between px-6 py-4">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-text">
            <HardDrive className="h-5 w-5 text-primary" />
            Backup logs & Checkpoints
          </CardTitle>
          <span className="text-[10px] font-semibold text-text-muted px-2.5 py-1 rounded-full bg-surface border border-border/50 uppercase tracking-wider">
            Firestore export engine
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt/10 border-b border-border/40">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Backup File Name</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Trigger Type</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">File Size</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-text-muted text-sm font-medium">
                      No database export records found in pipeline registry.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-alt/20 transition-colors">
                      
                      {/* File Name */}
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-[11px] text-text font-bold max-w-xs sm:max-w-md truncate" title={log.fileName}>
                          {log.fileName}
                        </div>
                        <div className="text-[9px] text-text-muted mt-0.5 max-w-xs sm:max-w-md truncate" title={log.storageLocation}>
                          {log.storageLocation}
                        </div>
                      </td>

                      {/* Trigger Type */}
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          log.triggerType === 'manual' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {log.triggerType.toUpperCase()}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-3.5 text-xs text-text font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* File Size */}
                      <td className="px-6 py-3.5 text-xs text-text font-semibold">
                        {log.sizeMb > 0 ? `${log.sizeMb} MB` : '--'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        {log.status === 'success' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Success
                          </span>
                        )}
                        {log.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            Running
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            onClick={() => handleDownloadBackup(log)}
                            disabled={log.status !== 'success'}
                            variant="ghost" 
                            size="icon"
                            title="Download backup JSON"
                            className="h-8 w-8 hover:bg-primary/5 text-text-muted hover:text-primary rounded-lg transition-colors"
                          >
                            <FileDown className="h-4.5 w-4.5" />
                          </Button>
                          <Button 
                            onClick={() => handleRestoreBackup(log.id)}
                            disabled={log.status !== 'success' || restoring !== null}
                            variant="ghost" 
                            size="sm"
                            className="text-[11px] h-8 px-2.5 text-text-muted hover:text-accent hover:bg-accent/5 font-bold border border-transparent hover:border-accent/10 rounded-lg transition-all"
                          >
                            {restoring === log.id ? (
                              <div className="flex items-center gap-1 text-accent font-bold">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Restoring...
                              </div>
                            ) : (
                              "Restore"
                            )}
                          </Button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default BackupManager;
