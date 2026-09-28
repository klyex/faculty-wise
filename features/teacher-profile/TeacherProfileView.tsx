"use client";

import React, { useState } from "react";
import { TeacherPersonalInfo } from "./components/TeacherPersonalInfo";
import { TeacherAcademicStats } from "./components/TeacherAcademicStats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Shield, LogOut, ChevronRight, User, X } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function TeacherProfileView() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">My Profile</h1>
          <p className="text-text-muted mt-1">Manage your professional presence and academic configuration.</p>
        </div>
      </div>

      <TeacherAcademicStats />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <TeacherPersonalInfo />

          <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-surface-alt/30 border-b border-border/50">
              <CardTitle className="text-lg">Recent Academic Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[
                  { title: "Syllabus Uploaded", course: "CS101", date: "2 hours ago" },
                  { title: "Grades Published", course: "MATH202", date: "Yesterday" },
                  { title: "Room Changed", course: "ENG105", date: "3 days ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-surface-alt flex items-center justify-center text-primary border border-border/50">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{item.title}</p>
                        <p className="text-xs text-text-muted">{item.course} • {item.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-all" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-surface-alt/30 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start gap-3 h-11 border-border/50">
                  <Bell className="h-4 w-4" /> Notification Settings
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full justify-start gap-3 h-11 border-border/50"
                >
                  <Shield className="h-4 w-4" /> Change Password
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-danger hover:bg-danger/10 hover:text-danger">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-gradient-to-br from-primary to-primary-strong text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
              <User className="h-24 w-24" />
            </div>
            <CardContent className="p-6 relative z-10 space-y-4">
              <p className="text-sm font-semibold opacity-80">Professional Bio</p>
              <p className="text-sm leading-relaxed italic">
                &ldquo;Dedicated to fostering innovation through computer science education and research in artificial intelligence.&rdquo;
              </p>
              <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                Update Bio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Modal Overlay */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface-alt/30">
              <h3 className="text-xl font-bold text-text flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Change Password
              </h3>
              <button 
                onClick={() => setIsChangingPassword(false)}
                className="p-2 rounded-full hover:bg-stone-200 transition-colors"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6">
              <ChangePasswordForm onCancel={() => setIsChangingPassword(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
