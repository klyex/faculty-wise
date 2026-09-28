"use client";

import React from "react";
import { Loader2, BookOpen, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import type { TeacherStats } from "@/lib/types/teacher-dashboard.types";

interface RealtimeStatsProps {
  stats: TeacherStats | null;
  loading: boolean;
}

export function RealtimeTeacherStats({ stats, loading }: RealtimeStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-surface-alt rounded-lg animate-pulse flex items-center justify-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getScheduleStatusTrend = () => {
    if (stats.scheduleStatus === "finalized") {
      return { value: "Active", positive: true };
    }
    return { value: stats.scheduleStatus, positive: false };
  };

  const getAvailabilityDescription = () => {
    const lastUpdate = new Date(stats.lastAvailabilityUpdate);
    const daysDiff = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return "Updated today";
    if (daysDiff === 1) return "Updated 1 day ago";
    return `Updated ${daysDiff} days ago`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatTile
        title="Total Assigned Units"
        value={stats.totalAssignedUnits.toString()}
        icon={BookOpen}
        description={`Target load: ${stats.targetUnits} units`}
        trend={{
          value: stats.totalAssignedUnits === stats.targetUnits ? "Target met" : 
                 stats.totalAssignedUnits > stats.targetUnits ? "Over target" : "Under target",
          positive: stats.totalAssignedUnits <= stats.targetUnits,
        }}
      />
      <StatTile
        title="Pending Availability"
        value={stats.availabilityStatus.charAt(0).toUpperCase() + stats.availabilityStatus.slice(1)}
        icon={Clock}
        description={getAvailabilityDescription()}
      />
      <StatTile
        title="Teaching Hours"
        value={`${stats.teachingHoursPerWeek}h`}
        icon={Calendar}
        description="Per week"
      />
      <StatTile
        title="Schedule Status"
        value={stats.scheduleStatus.charAt(0).toUpperCase() + stats.scheduleStatus.slice(1)}
        icon={CheckCircle2}
        description="Published by Dean"
        trend={getScheduleStatusTrend()}
      />
    </div>
  );
}
