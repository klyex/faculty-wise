"use client";

import React, { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  User as UserIcon, 
  Shield, 
  Calendar,
  Info,
  ChevronRight,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { auditService } from "./audit.service";
import { AuditLog, AuditAction } from "@/lib/types/firestore.types";
import { cn } from "@/lib/utils";

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auditService.subscribeToLogs((data) => {
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const userName = (log.userName || "").toLowerCase();
    const action = (log.action || "").toLowerCase();
    const targetId = (log.targetId || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return userName.includes(query) || action.includes(query) || targetId.includes(query);
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Audit Logs</h1>
          <p className="text-text-muted mt-1">Monitor sensitive system operations and administrative changes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Events" value={logs.length} icon={History} color="bg-primary" />
        <StatCard label="Security Actions" value={logs.filter(l => l.action.includes('USER')).length} icon={Shield} color="bg-amber-500" />
        <StatCard label="Last Action" value={logs[0] ? new Date(logs[0].timestamp?.toDate?.() || Date.now()).toLocaleTimeString() : 'N/A'} icon={Clock} color="bg-blue-500" />
      </div>

      <Card className="border-none shadow-xl bg-white/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-border bg-white/50 px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> System Activity
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-64"
                />
              </div>
              <Button variant="secondary" size="icon" className="rounded-xl h-11 w-11">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-alt/50">
                  <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">Timestamp</th>
                  <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">Details</th>
                  <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-right text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 h-16 md:h-20 bg-surface/30" />
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 md:py-20 text-center text-sm md:text-base text-text-muted">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-surface-alt/30 transition-colors">
                      <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-medium text-text">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Today'}
                          </span>
                          <span className="text-[9px] sm:text-xs text-text-muted">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center text-primary border border-border flex-shrink-0">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-text truncate">{log.userName}</span>
                            <span className="text-[9px] sm:text-[10px] text-text-muted lowercase truncate">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
                        <div className="flex items-center gap-2 text-[9px] md:text-xs text-text-muted bg-surface/50 rounded-lg px-3 py-1.5 border border-border/50 max-w-xs truncate">
                          <Info className="h-3 w-3 shrink-0" />
                          {Object.entries(log.details || {}).map(([key, val]) => (
                            <span key={key} className="truncate">{key}: {String(val)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-[9px] sm:text-xs font-mono text-text-muted flex-wrap">
                          <span className="bg-surface px-2 py-1 rounded border border-border text-[8px] sm:text-[9px]">{log.targetType}</span>
                          <ChevronRight className="h-3 w-3 hidden sm:inline" />
                          <span className="bg-surface px-2 py-1 rounded border border-border truncate max-w-[60px] sm:max-w-[100px] text-[8px] sm:text-[9px]">{log.targetId}</span>
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

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md rounded-2xl p-6 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-muted">{label}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
    </Card>
  );
}

function ActionBadge({ action }: { action: AuditAction }) {
  const styles: Record<string, string> = {
    USER_CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    USER_DELETE: "bg-rose-100 text-rose-700 border-rose-200",
    USER_ROLE_CHANGE: "bg-amber-100 text-amber-700 border-amber-200",
    USER_STATUS_CHANGE: "bg-blue-100 text-blue-700 border-blue-200",
    SCHEDULE_PUBLISH: "bg-indigo-100 text-indigo-700 border-indigo-200",
    DATA_IMPORT: "bg-purple-100 text-purple-700 border-purple-200",
    SETTINGS_UPDATE: "bg-stone-100 text-stone-700 border-stone-200",
  };
  
  return (
    <Badge className={cn("capitalize px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider", styles[action] || "bg-stone-100 text-stone-700 border-stone-200")}>
      {action.replace(/_/g, ' ')}
    </Badge>
  );
}
