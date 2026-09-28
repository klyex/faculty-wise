"use client";

import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  User,
  GraduationCap,
  X
} from "lucide-react";

const navigation = [
  { name: "Faculty Search", tab: "faculty-search", href: "/student", icon: Calendar },
  { name: "My Class Schedule", tab: "schedule", href: "/student?tab=schedule", icon: LayoutDashboard },
  { name: "Department Schedule", tab: "department-schedule", href: "/student?tab=department-schedule", icon: Building2 },
  { name: "Settings", tab: "settings", href: "/student?tab=settings", icon: User },
];

interface StudentSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ open = false, onClose }: StudentSidebarProps) {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "faculty-search";

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface md:relative md:z-auto md:translate-x-0 transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/student" className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white shadow-sm">
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
          {navigation.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
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
        </nav>
      </div>
    </div>
  );
}

