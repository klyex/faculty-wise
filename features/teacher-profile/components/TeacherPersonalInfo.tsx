"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Mail, MapPin, Camera, Pencil, Briefcase, Award, GraduationCap, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useTeacherDashboard } from "@/lib/hooks/useTeacherDashboard";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { EditProfileModal } from "./EditProfileModal";
import { Badge } from "@/components/ui/Badge";

export function TeacherPersonalInfo() {
  const { profile } = useAuth();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  
  const { dashboardData } = useTeacherDashboard();
  const totalAssignedUnits = dashboardData?.stats?.totalAssignedUnits ?? 0;

  useEffect(() => {
    // Load courses for eligible subject listing
    facultyLoadService.getCourses().then(setAllCourses).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profile || !profile.id) return;

    const db = getDb();
    if (!db) return;

    const teachersRef = collection(db, "teachers");
    const q = query(teachersRef, where("uid", "==", profile.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setTeacherData(snapshot.docs[0].data());
        } else {
          setTeacherData(null);
        }
      },
      (err) => {
        console.error("Error subscribing to teacher data in real-time:", err);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  if (!profile) return null;

  const getJoiningDate = () => {
    if (!profile.createdAt) return "N/A";
    const date = profile.createdAt.toDate
      ? profile.createdAt.toDate()
      : new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt);
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 hover:bg-primary/5 hover:text-primary transition-all border border-border/40 rounded-lg px-3"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" /> Edit Profile
        </Button>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        {/* Load Status Calculation */}
        {(() => {
const targetUnits = teacherData?.targetUnits ?? 18;
          let loadStatus: "underloaded" | "normal" | "excess_load" = "normal";
          if (totalAssignedUnits > targetUnits + 3) {
            loadStatus = "excess_load";
          } else if (totalAssignedUnits < targetUnits - 3) {
            loadStatus = "underloaded";
          }

          const statusBadgeStyle = 
            loadStatus === "excess_load" 
              ? "bg-rose-100 text-rose-700 border-rose-200" 
              : loadStatus === "underloaded"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200";

          return (
            <>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-3xl bg-primary/10 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-16 w-16 text-primary/30" />
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-strong transition-all scale-0 group-hover:scale-100 duration-200">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                    <h2 className="text-3xl font-bold text-text font-source-serif">{profile.displayName}</h2>
                    <Badge variant="outline" className={`${statusBadgeStyle} self-center text-xs font-semibold`}>
                      {loadStatus.charAt(0).toUpperCase() + loadStatus.slice(1)} Load
                    </Badge>
                  </div>
                  <p className="text-primary font-semibold">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}{teacherData?.designation ? ` • ${teacherData.designation}` : ""}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-alt/50 px-3 py-1.5 rounded-full border border-border/50">
                      <Mail className="h-3.5 w-3.5" /> {profile.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-alt/50 px-3 py-1.5 rounded-full border border-border/50">
                      <MapPin className="h-3.5 w-3.5" /> {profile.status === 'active' ? "Active" : "Inactive"}
                    </div>
                    {teacherData?.officeLocation && (
                      <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-alt/50 px-3 py-1.5 rounded-full border border-border/50">
                        <Briefcase className="h-3.5 w-3.5" /> {teacherData.officeLocation}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Credentials Details */}
              <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Specialization</p>
                  <p className="text-sm font-semibold text-text">{teacherData?.specialization || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Major</p>
                  <p className="text-sm font-semibold text-text">{teacherData?.major || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Teaching Experience</p>
                  <p className="text-sm font-semibold text-text">{teacherData?.teachingExperience || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Workload Target & Load</p>
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-text">
                      <span>{totalAssignedUnits} Assigned Units</span>
                      <span className="text-text-muted">/ {targetUnits} Target Units</span>
                    </div>
                    {/* Visual Workload Slider */}
                    <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          loadStatus === "excess_load" 
                            ? "bg-rose-500" 
                            : loadStatus === "underloaded" 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (totalAssignedUnits / targetUnits) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Employment Type</p>
                  <p className="text-sm font-semibold text-text">{teacherData?.employmentType || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Employee ID</p>
                  <p className="text-sm font-semibold text-text">{teacherData?.employeeNo || "Not specified"}</p>
                </div>
              </div>

              {/* Skills & Certifications section */}
              <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-border/50">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" /> Certifications
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacherData?.certifications && teacherData.certifications.length > 0 ? (
                      teacherData.certifications.map((cert: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-surface-alt text-text text-[11px] border border-border/40 font-medium rounded-lg">
                          {cert}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">No certifications added.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Skills & Competencies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacherData?.skills && teacherData.skills.length > 0 ? (
                      teacherData.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary text-[11px] border border-primary/10 font-bold rounded-lg">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">No skills specified.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Eligible Subjects section */}
              <div className="pt-6 border-t border-border/50 space-y-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" /> Eligible Courses
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teacherData?.eligibleSubjects && teacherData.eligibleSubjects.length > 0 ? (
                    teacherData.eligibleSubjects.map((subjectId: string) => {
                      const matchedCourse = allCourses.find((c) => c.id === subjectId);
                      return (
                        <div key={subjectId} className="flex items-center gap-3 p-3 bg-surface-alt/40 border border-border/40 rounded-2xl transition-all hover:bg-surface-alt/60">
                          <div className="h-9 w-9 rounded-xl bg-white border border-border flex items-center justify-center text-xs font-bold text-primary shadow-sm shrink-0">
                            {matchedCourse?.code || subjectId}
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-bold text-text truncate">
                              {matchedCourse?.name || subjectId}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {matchedCourse?.units || matchedCourse?.credits || 3} Units • {matchedCourse?.isActive !== false ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-text-muted italic col-span-3">No eligible subjects configured.</span>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </CardContent>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        teacherData={teacherData}
        profile={profile}
        onSuccess={() => {
          // Relies on real-time subscription update
        }}
      />
    </Card>
  );
}
