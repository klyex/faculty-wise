"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import { StudentScheduleView } from "@/components/student-profile/StudentScheduleView";
import FacultyScheduleView from "@/features/faculty-schedule/FacultyScheduleView";
import DepartmentScheduleView from "@/features/department-schedule/DepartmentScheduleView";
import SettingsView from "@/features/settings/SettingsView";

export function StudentDashboardView() {
  const [searchParamsHook] = useSearchParams();
  const tab = searchParamsHook.get("tab") || "faculty-search";

  switch (tab) {
    case "schedule":
      return <StudentScheduleView />;
    case "department-schedule":
      return <DepartmentScheduleView />;
    case "settings":
      return <SettingsView />;
    case "faculty-search":
    default:
      return <FacultyScheduleView />;
  }
}

export default StudentDashboardView;
