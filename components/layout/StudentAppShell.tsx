"use client";

import * as React from "react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";
import { AiChatDrawer } from "../ai/AiChatDrawer";

interface StudentAppShellProps {
  children: React.ReactNode;
}

export function StudentAppShell({ children }: StudentAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-manrope relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <StudentHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <AiChatDrawer />
    </div>
  );
}
