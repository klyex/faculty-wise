"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { BookOpen, Clock, Award, Loader2, CheckCircle2 } from "lucide-react";
import { useTeacherDashboard } from "@/lib/hooks/useTeacherDashboard";

export function TeacherAcademicStats() {
  const { dashboardData, loading } = useTeacherDashboard();

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-surface-alt rounded-2xl animate-pulse flex items-center justify-center border border-border/20">
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          </div>
        ))}
      </div>
    );
  }

  const stats = dashboardData?.stats;

  const currentLoad = stats?.totalAssignedUnits ?? 0;
  const targetLoad = stats?.targetUnits ?? 18;
  const availabilityStatus = stats?.availabilityStatus
    ? stats.availabilityStatus.charAt(0).toUpperCase() + stats.availabilityStatus.slice(1)
    : "Submitted";
  const scheduleStatus = stats?.scheduleStatus
    ? stats.scheduleStatus.charAt(0).toUpperCase() + stats.scheduleStatus.slice(1)
    : "Finalized";

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Current Load</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{currentLoad}</span>
                <span className="text-xs text-text-muted">Units</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Target Load</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{targetLoad}</span>
                <span className="text-xs text-text-muted">Units</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Availability</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{availabilityStatus}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Schedule Status</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{scheduleStatus}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
