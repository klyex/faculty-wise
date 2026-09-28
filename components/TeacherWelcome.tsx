"use client";

import { useSystemInfo } from "@/lib/context/SystemContext";
import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RealtimeTeacherDashboard } from "@/features/teacher-profile/RealtimeTeacherDashboard";

export default function TeacherWelcome() {
  const { currentTerm, academicYear, loading } = useSystemInfo();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const subtitle = currentTerm?.semester
    ? `${currentTerm.semester} Semester • AY ${currentTerm.academicYear || academicYear || ""}`
    : "Loading...";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text font-source-serif">Welcome</h1>
            <p className="text-text-muted mt-1">{subtitle}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">
              Download Schedule (PDF)
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700">
              Update Availability
            </Button>
          </div>
        </div>
      </div>
      <RealtimeTeacherDashboard />
    </div>
  );
}
