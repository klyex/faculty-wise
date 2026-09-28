"use client";

import * as React from "react";
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 md:px-8 sticky top-0 z-30 gap-4">
      {/* Hamburger menu for mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-1 hover:bg-surface-alt rounded-md transition-colors text-text-muted hover:text-text flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search bar */}
      <div className="flex flex-1 items-center min-w-0">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-border bg-surface py-2 pl-10 pr-3 text-sm placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <NotificationBell />
        
        <div className="h-8 w-[1px] bg-border hidden sm:block"></div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end leading-tight hidden lg:flex mr-1">
            <span className="text-sm font-bold text-text">{profile?.displayName || "Loading..."}</span>
            <span className="text-[10px] text-text-muted text-right">
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "University Member"}
              {profile?.departmentId ? ` • ${profile.departmentId}` : ""}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-primary/10 overflow-hidden flex-shrink-0">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>
        
        <div className="h-8 w-[1px] bg-border hidden sm:block"></div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="text-text-muted hover:text-danger hover:bg-danger/5 gap-2 font-semibold text-xs sm:text-sm flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
