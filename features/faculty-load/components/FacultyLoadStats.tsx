"use client";

import React from "react";
import { Users, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";

interface FacultyLoadStatsProps {
  totalFaculty: number;
  totalUnits: number;
  excessLoadCount: number;
  underloadedCount: number;
}

export function FacultyLoadStats({ 
  totalFaculty, 
  totalUnits, 
  excessLoadCount, 
  underloadedCount 
}: FacultyLoadStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatTile
        title="Active Faculty"
        value={totalFaculty.toString()}
        icon={Users}
        description="Across all departments"
      />
      <StatTile
        title="Total Units Assigned"
        value={totalUnits.toString()}
        icon={BookOpen}
        description="This semester"
      />
      <StatTile
        title="Excess Load"
        value={excessLoadCount.toString()}
        icon={AlertTriangle}
        description="Needs adjustment"
        trend={{ value: "Priority", positive: false }}
      />
      <StatTile
        title="Underloaded"
        value={underloadedCount.toString()}
        icon={CheckCircle2}
        description="Available capacity"
      />
    </div>
  );
}