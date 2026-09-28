"use client";

import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { StudentAppShell } from "@/components/layout/StudentAppShell";
import { TeacherAppShell } from "@/components/layout/TeacherAppShell";
import { ProgramHeadAppShell } from "@/components/layout/ProgramHeadAppShell";
import { DeanAppShell } from "@/components/layout/DeanAppShell";
import { VpaaAppShell } from "@/components/layout/VpaaAppShell";
import { RoleGate } from "@/components/auth/RoleGate";
import LoginPageView from "@/features/auth/login/LoginPageView";
import RegisterPageView from "@/features/auth/register/RegisterPageView";

// Feature imports
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { StudentDashboardView } from "@/components/student-profile/StudentDashboardView";
import { ProgramHeadDashboardView } from "@/features/program-head/ProgramHeadDashboardView";
import { DeanDashboardView } from "@/features/dean/DeanDashboardView";
import { VpaaDashboardView } from "@/features/vpaa/VpaaDashboardView";

// Teacher imports
import { MySchedulePage } from "@/features/teacher-profile/MySchedulePage";
import AvailabilityView from "@/features/availability/AvailabilityView";
import TeacherProfileView from "@/features/teacher-profile/TeacherProfileView";
import ExpertiseManagementView from "@/features/teacher-profile/ExpertiseManagementView";
import WeeklyScheduleView from "@/features/timetables/WeeklyScheduleView";
import DepartmentScheduleView from "@/features/department-schedule/DepartmentScheduleView";
import TeacherWelcome from "@/components/TeacherWelcome";

// Layout Wrapper Route elements for nested routing
function AdminLayout() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <AppShell>
        <AdminDashboardView />
      </AppShell>
    </RoleGate>
  );
}

function ProgramHeadLayout() {
  return (
    <RoleGate allowedRoles={['program_head']}>
      <ProgramHeadAppShell>
        <Routes>
          <Route path="/" element={<ProgramHeadDashboardView />} />
          <Route path="/faculty" element={<ProgramHeadDashboardView />} />
          <Route path="/rooms" element={<ProgramHeadDashboardView />} />
          <Route path="/subjects" element={<ProgramHeadDashboardView />} />
        </Routes>
      </ProgramHeadAppShell>
    </RoleGate>
  );
}

function DeanLayout() {
  return (
    <RoleGate allowedRoles={['dean']}>
      <DeanAppShell>
        <Routes>
          <Route path="/" element={<DeanDashboardView />} />
          <Route path="/schedules" element={<DeanDashboardView />} />
          <Route path="/overloads" element={<DeanDashboardView />} />
          <Route path="/approvals" element={<DeanDashboardView />} />
        </Routes>
      </DeanAppShell>
    </RoleGate>
  );
}

function VpaaLayout() {
  return (
    <RoleGate allowedRoles={['vpaa']}>
      <VpaaAppShell>
        <Routes>
          <Route path="/" element={<VpaaDashboardView />} />
          <Route path="/review" element={<VpaaDashboardView />} />
          <Route path="/policy" element={<VpaaDashboardView />} />
          <Route path="/approval" element={<VpaaDashboardView />} />
          <Route path="/revisions" element={<VpaaDashboardView />} />
        </Routes>
      </VpaaAppShell>
    </RoleGate>
  );
}

function StudentLayout() {
  return (
    <RoleGate allowedRoles={['student']}>
      <StudentAppShell>
        <StudentDashboardView />
      </StudentAppShell>
    </RoleGate>
  );
}

function TeacherLayout() {
  return (
    <RoleGate allowedRoles={['teacher']}>
      <TeacherAppShell>
        <Routes>
          <Route path="/" element={<TeacherWelcome />} />
          <Route path="/schedule" element={<MySchedulePage />} />
          <Route path="/weekly-schedule" element={
            <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-2xl" />}>
              <WeeklyScheduleView />
            </React.Suspense>
          } />
          <Route path="/availability" element={
            <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-2xl" />}>
              <AvailabilityView />
            </React.Suspense>
          } />
          <Route path="/department-schedule" element={
            <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-2xl" />}>
              <DepartmentScheduleView />
            </React.Suspense>
          } />
          <Route path="/expertise" element={
            <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-2xl" />}>
              <ExpertiseManagementView />
            </React.Suspense>
          } />
          <Route path="/settings" element={
            <React.Suspense fallback={<div className="animate-pulse h-[600px] bg-surface-alt rounded-2xl" />}>
              <TeacherProfileView />
            </React.Suspense>
          } />
        </Routes>
      </TeacherAppShell>
    </RoleGate>
  );
}

import { ToastProvider } from "@/components/ui/Toast";
import PublicScheduleSearchView from "@/components/public/PublicScheduleSearchView";
import ActivateAccountView from "@/components/auth/ActivateAccountView";
import { SystemProvider } from "@/lib/context/SystemContext";

export default function App() {
  return (
    <ToastProvider>
      <SystemProvider>
        <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPageView />} />
          <Route path="/register" element={<RegisterPageView />} />
          <Route path="/search" element={<PublicScheduleSearchView />} />
          <Route path="/activate" element={<ActivateAccountView />} />

          {/* Dashboard admin routing */}
          <Route path="/dashboard/*" element={<AdminLayout />} />
          <Route path="/timetables" element={<Navigate to="/dashboard?tab=timetables" replace />} />
          <Route path="/faculty-load" element={<Navigate to="/dashboard?tab=faculty-load" replace />} />
          <Route path="/faculty-loading" element={<Navigate to="/dashboard?tab=faculty-loading" replace />} />
          <Route path="/weekly-schedule" element={<Navigate to="/dashboard?tab=weekly-schedule" replace />} />
          <Route path="/courses" element={<Navigate to="/dashboard?tab=courses" replace />} />
          <Route path="/offerings" element={<Navigate to="/dashboard?tab=offerings" replace />} />
          <Route path="/rooms" element={<Navigate to="/dashboard?tab=rooms" replace />} />
          <Route path="/room-availability" element={<Navigate to="/dashboard?tab=room-availability" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
          <Route path="/users" element={<Navigate to="/dashboard?tab=users" replace />} />
          <Route path="/audit" element={<Navigate to="/dashboard?tab=audit" replace />} />

          {/* Student portal routing */}
          <Route path="/student/*" element={<StudentLayout />} />

          {/* Teacher portal routing */}
          <Route path="/teacher/*" element={<TeacherLayout />} />

          {/* Program Head portal routing */}
          <Route path="/program-head/*" element={<ProgramHeadLayout />} />

          {/* Dean portal routing */}
          <Route path="/dean/*" element={<DeanLayout />} />

          {/* VPAA portal routing */}
          <Route path="/vpaa/*" element={<VpaaLayout />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SystemProvider>
    </ToastProvider>
  );
}
