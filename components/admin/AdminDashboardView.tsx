"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { OperationsDashboardView } from "@/components/admin/OperationsDashboardView";
import AuditLogsView from "@/features/audit/AuditLogsView";
import CoursesView from "@/features/courses/CoursesView";
import FacultyLoadView from "@/features/faculty-load/FacultyLoadView";
import FacultyLoadingView from "@/features/faculty-load/FacultyLoadingView";
import WeeklyScheduleView from "@/features/timetables/WeeklyScheduleView";
import CourseOfferingsView from "@/features/course-offerings/CourseOfferingsView";
import RoomsView from "@/features/rooms/RoomsView";
import SettingsView from "@/features/settings/SettingsView";
import TimetableView from "@/features/timetables/TimetableView";
import { DepartmentsView } from "@/features/departments/DepartmentsView";
import { SectionsView } from "@/features/sections/SectionsView";
import UserManagementView from "@/features/user-management/UserManagementView";
import AiSchedulesView from "@/features/ai-schedules/AiSchedulesView";
import RoomAvailabilityView from "@/features/room-availability/RoomAvailabilityView";
import TermManagementView from "@/features/settings/components/TermManagementView";
import CurriculumManagementView from "@/features/curriculum/CurriculumManagementView";
import CurriculumViewer from "@/features/curriculum/CurriculumViewer";
import { useAuth } from "@/lib/context/AuthContext";

export function AdminDashboardView() {
  const { profile } = useAuth();
  const role = profile?.role;
  const [searchParamsHook] = useSearchParams();
  const tab = searchParamsHook.get("tab") || "dashboard";

  const renderAccessRestricted = () => (
    <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200 shadow-sm animate-in fade-in duration-300 max-w-lg mx-auto mt-20">
      <p className="text-red-700 font-bold text-lg mb-1">Access Restricted</p>
      <p className="text-red-600 text-sm">You do not have permission to view this tab page.</p>
    </div>
  );

  switch (tab) {
    case "departments":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Departments</h1>
              <p className="text-text-muted mt-1">Configure academic departments, assign chairs, and manage programs.</p>
            </div>
            <DepartmentsView />
          </div>
        </Suspense>
      );
    case "sections":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Sections & Terms</h1>
              <p className="text-text-muted mt-1">Configure sections, student counts, and manage academic terms.</p>
            </div>
            <SectionsView />
          </div>
        </Suspense>
      );
    case "terms":
      if (role !== "admin") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Term Management</h1>
              <p className="text-text-muted mt-1">Manage academic terms, semesters, and school years. Set the current active term.</p>
            </div>
            <TermManagementView />
          </div>
        </Suspense>
      );
    case "curriculum":
      if (role !== "admin") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Curriculum Management</h1>
              <p className="text-text-muted mt-1">Define program curricula — map courses to year levels and semesters.</p>
            </div>
            <CurriculumManagementView />
          </div>
        </Suspense>
      );
    case "curriculum-viewer":
      if (role !== "admin") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Curriculum Viewer</h1>
              <p className="text-text-muted mt-1">Browse course offerings by academic term.</p>
            </div>
            <CurriculumViewer />
          </div>
        </Suspense>
      );
    case "timetables":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <TimetableView 
            title="Institutional Timetables" 
            subtitle="Manage and view department-wide schedules and academic planning."
          />
        </Suspense>
      );
    case "ai-schedules":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <AiSchedulesView />
        </Suspense>
      );
    case "faculty-load":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <FacultyLoadView />
        </Suspense>
      );
    case "faculty-loading":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <FacultyLoadingView />
        </Suspense>
      );
    case "weekly-schedule":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <WeeklyScheduleView />
        </Suspense>
      );
    case "courses":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse bg-surface-alt rounded-2xl" />
            ))}
          </div>
        }>
          <CoursesView />
        </Suspense>
      );
    case "offerings":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={
          <div className="space-y-6">
            <div className="h-20 animate-pulse bg-surface-alt rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-surface-alt rounded-2xl" />
              ))}
            </div>
            <div className="h-96 animate-pulse bg-surface-alt rounded-2xl" />
          </div>
        }>
          <CourseOfferingsView />
        </Suspense>
      );
    case "rooms":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse bg-surface-alt rounded-2xl" />
            ))}
          </div>
        }>
          <RoomsView />
        </Suspense>
      );
    case "room-availability":
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <RoomAvailabilityView />
        </Suspense>
      );
    case "users":
      if (role !== "admin") return renderAccessRestricted();
      return <UserManagementView />;
    case "audit":
      if (role !== "admin") return renderAccessRestricted();
      return <AuditLogsView />;
    case "settings":
      if (role === "dean") return renderAccessRestricted();
      return (
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-xl" />}>
          <SettingsView />
        </Suspense>
      );
    case "dashboard":
    default:
      return <OperationsDashboardView />;
  }
}

export default AdminDashboardView;
