"use client";

import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  Building2,
  Settings,
  GraduationCap,
  History as HistoryIcon,
  ListChecks,
  School,
  X,
  Shield,
  UserCheck,
  BrainCircuit,
  Layers,
  ClipboardList,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface NavItem {
  name: string;
  tab: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", tab: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Schedule Management",
    items: [
      { name: "Timetables", tab: "timetables", href: "/dashboard?tab=timetables", icon: CalendarDays },
      { name: "AI Schedules", tab: "ai-schedules", href: "/dashboard?tab=ai-schedules", icon: BrainCircuit },
      { name: "Weekly Schedule", tab: "weekly-schedule", href: "/dashboard?tab=weekly-schedule", icon: CalendarDays },
      { name: "Room Availability", tab: "room-availability", href: "/dashboard?tab=room-availability", icon: Clock },
    ],
  },
  {
    title: "Faculty Management",
    items: [
      { name: "Faculty Load", tab: "faculty-load", href: "/dashboard?tab=faculty-load", icon: Users },
      { name: "Faculty Loading", tab: "faculty-loading", href: "/dashboard?tab=faculty-loading", icon: ClipboardList },
    ],
  },
  {
    title: "Academic Structure",
    items: [
      { name: "Courses", tab: "courses", href: "/dashboard?tab=courses", icon: BookOpen },
      { name: "Course Offerings", tab: "offerings", href: "/dashboard?tab=offerings", icon: ListChecks },
      { name: "Departments", tab: "departments", href: "/dashboard?tab=departments", icon: Building2 },
      { name: "Sections", tab: "sections", href: "/dashboard?tab=sections", icon: Layers },
      { name: "Terms", tab: "terms", href: "/dashboard?tab=terms", icon: CalendarDays },
      { name: "Curriculum", tab: "curriculum", href: "/dashboard?tab=curriculum", icon: BookOpen },
      { name: "Curriculum Viewer", tab: "curriculum-viewer", href: "/dashboard?tab=curriculum-viewer", icon: GraduationCap },
      { name: "Rooms & Labs", tab: "rooms", href: "/dashboard?tab=rooms", icon: School },
    ],
  },
  {
    title: "User Management",
    items: [
      { name: "Administrators", tab: "users-admin", href: "/dashboard?tab=users&sub=admin", icon: Shield },
      { name: "Faculty", tab: "users-teacher", href: "/dashboard?tab=users&sub=teacher", icon: UserCheck },
      { name: "Students", tab: "users-student", href: "/dashboard?tab=users&sub=student", icon: GraduationCap },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Audit Logs", tab: "audit", href: "/dashboard?tab=audit", icon: HistoryIcon },
      { name: "Settings", tab: "settings", href: "/dashboard?tab=settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  // Admin sees everything
  const displayGroups = profile?.role === "admin" ? navGroups : [];

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  // Get initials for the avatar placeholder
  const initials = profile?.displayName
    ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : "FW";

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface md:relative md:z-auto md:translate-x-0 transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/dashboard" className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold font-source-serif text-text tracking-tight hidden sm:inline">
            Faculty_Wise
          </span>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1 hover:bg-surface-alt rounded-md transition-colors text-text-muted hover:text-text"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex flex-1 flex-col gap-1">
          {displayGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.title);
            return (
              <div key={group.title} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors"
                >
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    isCollapsed && "-rotate-90"
                  )} />
                  {group.title}
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const currentSub = searchParams.get("sub") || "all";
                      const isActive = item.tab.startsWith("users-")
                        ? activeTab === "users" && item.tab === `users-${currentSub}`
                        : activeTab === item.tab;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-white"
                              : "text-text-muted hover:bg-surface-alt hover:text-text"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-colors",
                              isActive ? "text-white" : "text-text-muted group-hover:text-text"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-border p-4">
        <div className="rounded-md bg-surface-alt p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
              ) : initials}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-text truncate max-w-[120px]">
                {profile?.displayName || "System User"}
              </span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">
                {profile?.role || "Staff"} {profile?.departmentId ? `• ${profile.departmentId}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
