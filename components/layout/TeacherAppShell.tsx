"use client";

import * as React from "react";
import { TeacherSidebar } from "./TeacherSidebar";
import { Header } from "./Header";
import { AiChatDrawer } from "../ai/AiChatDrawer";

interface TeacherAppShellProps {
  children: React.ReactNode;
}

export function TeacherAppShell({ children }: TeacherAppShellProps) {
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
      <TeacherSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
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
