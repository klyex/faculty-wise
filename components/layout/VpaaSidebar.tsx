"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Scale,
  Stamp,
  RefreshCw,
  GraduationCap,
  X
} from "lucide-react";
import { appRoutes } from "@/lib/constants/routes.constants";
import { useAuth } from "@/lib/context/AuthContext";

const navigation = [
  { name: "Dashboard", href: appRoutes.vpaaDashboard, icon: LayoutDashboard },
  { name: "Review Timetable", href: `${appRoutes.vpaaDashboard}/review`, icon: CalendarCheck },
  { name: "Policy Evaluation", href: `${appRoutes.vpaaDashboard}/policy`, icon: Scale },
  { name: "Final Approval", href: `${appRoutes.vpaaDashboard}/approval`, icon: Stamp },
  { name: "Revision Requests", href: `${appRoutes.vpaaDashboard}/revisions`, icon: RefreshCw },
];

interface VpaaSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function VpaaSidebar({ open = false, onClose }: VpaaSidebarProps) {
  const { profile } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const initials = profile?.displayName
    ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : "FW";

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface md:relative md:z-auto md:translate-x-0 transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to={appRoutes.vpaaDashboard} className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white shadow-sm">
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
        <div className="px-3 pb-3">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">VPAA</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
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
                {profile?.displayName || "VPAA"}
              </span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">
                VPAA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
