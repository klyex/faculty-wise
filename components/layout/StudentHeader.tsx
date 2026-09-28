"use client";

import * as React from "react";
import { Bell, Search, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";

interface StudentHeaderProps {
  onMenuClick?: () => void;
}

export function StudentHeader({ onMenuClick }: StudentHeaderProps) {
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

      {/* Left content */}
      <div className="flex flex-1 items-center min-w-0">
        <div className="flex items-center gap-2 text-text-muted italic text-xs sm:text-sm truncate">
          <Search className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Quick search available in the dashboard below</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-text-muted" />
        </Button>
        
        <div className="h-8 w-[1px] bg-border hidden sm:block"></div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end leading-tight hidden sm:flex">
            <span className="text-sm font-bold text-text">{profile?.displayName || "University Student"}</span>
            <span className="text-[10px] text-text-muted">
              {profile?.role === 'student' ? "Student Access" : "Public Access Mode"}
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
