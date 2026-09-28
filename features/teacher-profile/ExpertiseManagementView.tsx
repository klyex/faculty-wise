"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  Check,
  GraduationCap,
  Plus,
  Save,
  Sparkles,
  X,
  AlertTriangle,
  Award,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface TeacherDetail {
  specialization: string;
  major: string;
  certifications: string[];
  skills: string[];
  eligibleSubjects: string[];
}

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  units: number;
}

export default function ExpertiseManagementView() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherDetail>({
    specialization: "",
    major: "",
    certifications: [],
    skills: [],
    eligibleSubjects: [],
  });
  const [allCourses, setAllCourses] = useState<CourseInfo[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  useEffect(() => {
    if (!profile) return;

    const db = getDb();
    if (!db) return;

    const unsubTeacher = onSnapshot(
      query(collection(db, "teachers"), where("uid", "==", profile.id)),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setTeacherData({
            specialization: data.specialization || "",
            major: data.major || "",
            certifications: data.certifications || [],
            skills: data.skills || [],
            eligibleSubjects: data.eligibleSubjects || [],
          });
        }
        setLoading(false);
      }
    );

    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setAllCourses(
        snap.docs.map((d) => {
          const c = d.data();
          return {
            id: d.id,
            code: c.code || d.id,
            name: c.name || d.id,
            units: c.units || 3,
          };
        })
      );
    });

    return () => {
      unsubTeacher();
      unsubCourses();
    };
  }, [profile]);

  const toggleEligibleSubject = (courseId: string) => {
    setTeacherData((prev) => ({
      ...prev,
      eligibleSubjects: prev.eligibleSubjects.includes(courseId)
        ? prev.eligibleSubjects.filter((id) => id !== courseId)
        : [...prev.eligibleSubjects, courseId],
    }));
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !teacherData.skills.includes(trimmed)) {
      setTeacherData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setTeacherData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addCertification = () => {
    const trimmed = newCert.trim();
    if (trimmed && !teacherData.certifications.includes(trimmed)) {
      setTeacherData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, trimmed],
      }));
    }
    setNewCert("");
  };

  const removeCertification = (cert: string) => {
    setTeacherData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      await facultyLoadService.updateTeacherProfile(profile.id, {
        specialization: teacherData.specialization,
        major: teacherData.major,
        certifications: teacherData.certifications,
        skills: teacherData.skills,
        eligibleSubjects: teacherData.eligibleSubjects,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-xl border border-amber-100">
        <p className="text-amber-600 font-medium">Please log in to manage your expertise.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-surface-alt rounded-xl" />
        <div className="h-[400px] bg-surface-alt rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif flex items-center gap-3">
            <Sparkles className="w-9 h-9 text-accent" />
            Faculty Expertise
          </h1>
          <p className="text-text-muted mt-1">
            Define your areas of expertise, skills, and preferred subjects. This helps the AI scheduler recommend the best faculty for each course.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent hover:bg-accent/90 text-white h-10 gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Expertise"}
        </Button>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <Check className="w-5 h-5 shrink-0" />
          Expertise saved successfully. The AI scheduler will use this data for faculty recommendations.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Core expertise */}
        <div className="lg:col-span-2 space-y-6">
          {/* Area of Expertise & Specialization */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-text flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Area of Expertise & Specialization
                <Badge variant="outline" className="text-[10px] ml-1">
                  Primary factor in recommendations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">
                  Area of Expertise
                </label>
                <input
                  type="text"
                  value={teacherData.specialization}
                  onChange={(e) =>
                    setTeacherData((prev) => ({ ...prev, specialization: e.target.value }))
                  }
                  placeholder="e.g. Artificial Intelligence, Machine Learning, Data Structures"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-text-muted mt-1">
                  Comma-separated list of your main areas of academic expertise.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">
                  Major Discipline
                </label>
                <input
                  type="text"
                  value={teacherData.major}
                  onChange={(e) =>
                    setTeacherData((prev) => ({ ...prev, major: e.target.value }))
                  }
                  placeholder="e.g. Computer Science, Mathematics"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Competencies */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-text flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Skills & Competencies
                <Badge variant="outline" className="text-[10px] ml-1">
                  Used for expertise matching
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                {teacherData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium group"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 text-accent/50 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {teacherData.skills.length === 0 && (
                  <span className="text-sm text-text-muted italic">
                    No skills added yet. Type a skill below and press Add.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="e.g. Python, Data Analysis, Curriculum Design"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  onClick={addSkill}
                  disabled={!newSkill.trim()}
                  className="bg-accent hover:bg-accent/90 text-white h-10 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-text flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Professional Certifications
                <Badge variant="outline" className="text-[10px] ml-1">
                  Optional
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                {teacherData.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-sm font-medium group"
                  >
                    {cert}
                    <button
                      onClick={() => removeCertification(cert)}
                      className="ml-0.5 text-purple-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {teacherData.certifications.length === 0 && (
                  <span className="text-sm text-text-muted italic">
                    No certifications added yet.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCertification();
                    }
                  }}
                  placeholder="e.g. AWS Certified ML Specialist, Google Educator"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  onClick={addCertification}
                  disabled={!newCert.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-10 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Preferred Subjects */}
        <div className="space-y-6">
          <Card className="border border-border shadow-sm lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-text flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Preferred Subjects
                <Badge variant="outline" className="text-[10px] ml-1">
                  2nd highest weight
                </Badge>
              </CardTitle>
              <p className="text-xs text-text-muted mt-1">
                Select the subjects you are qualified and prefer to teach. Toggle each course on or off.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {allCourses.map((course) => {
                  const selected = teacherData.eligibleSubjects.includes(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => toggleEligibleSubject(course.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                        selected
                          ? "bg-emerald-50 border-emerald-300"
                          : "border-border hover:bg-surface-alt"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-text-muted"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                            {course.code}
                          </span>
                          <span className="text-sm font-medium text-text truncate">
                            {course.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted">{course.units} units</span>
                      </div>
                    </button>
                  );
                })}
                {allCourses.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-8">
                    No courses available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How this data is used */}
          <Card className="border border-accent/20 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-text mb-1">
                    How Expertise Affects Scheduling
                  </h3>
                  <ul className="text-xs text-text-muted space-y-1">
                    <li className="flex items-center gap-1.5">
                      <Award className="w-3 h-3 text-accent" />
                      <strong>Expertise (30%)</strong> — keyword match between your expertise/skills and course content
                    </li>
                    <li className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-emerald-600" />
                      <strong>Preferred Subjects (25%)</strong> — courses you mark as eligible get priority
                    </li>
                    <li className="flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-blue-600" />
                      <strong>History (20%)</strong> — subjects you have taught before
                    </li>
                    <li className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <strong>Workload (15%)</strong> — balanced distribution across faculty
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
