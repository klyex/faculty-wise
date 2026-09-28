"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Mail, Camera } from "lucide-react";

import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function ProfileSettings() {
  const { profile } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);

  // Load student-specific data from Firestore if available
  useEffect(() => {
    if (!profile || !profile.id || profile.role !== 'student') {
      return;
    }

    const db = getDb();
    if (!db) {
      // In demo mode, student data is already in profile
      setStudentData(profile);
      return;
    }

    // Query students collection by uid
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("uid", "==", profile.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudentData(snapshot.docs[0].data());
      } else {
        // If no student record exists, use profile data
        setStudentData(profile);
      }
    });

    return () => unsubscribe();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary/40" />
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-strong transition-all">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-text">{studentData?.displayName || profile.displayName || profile.email}</h3>
              <p className="text-xs text-text-muted">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} • Since {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).getFullYear() : "2024"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input 
                  type="text" 
                  defaultValue={studentData?.displayName || profile.displayName || ''}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder-text-muted/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input 
                  type="email" 
                  defaultValue={profile.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button size="sm" className="px-8 shadow-md">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
