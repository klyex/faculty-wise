"use client";

import React from "react";
import { useTeacherDashboard } from "@/lib/hooks/useTeacherDashboard";
import { RealtimeTeacherStats } from "./components/RealtimeTeacherStats";
import { RealtimeUpcomingSession } from "./components/RealtimeUpcomingSession";
import { RealtimeTeachingLoadSummary } from "./components/RealtimeTeachingLoadSummary";

export function RealtimeTeacherDashboard() {
  const { dashboardData, loading, error } = useTeacherDashboard();

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">
          Error loading dashboard data: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <RealtimeTeacherStats
        stats={dashboardData?.stats || null}
        loading={loading}
      />

      {/* Main Content - Session & Load Summary */}
      <div className="grid gap-6 lg:grid-cols-7">
        <RealtimeUpcomingSession
          session={dashboardData?.upcomingSession || null}
          loading={loading}
        />

        <RealtimeTeachingLoadSummary
          courses={dashboardData?.courses || []}
          loading={loading}
        />
      </div>

      {/* Last Updated Timestamp */}
      {dashboardData?.lastUpdated && (
        <div className="text-xs text-text-muted text-right">
          Last updated: {dashboardData.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
