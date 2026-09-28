"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherData: any;
  profile: any;
  onSuccess: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  teacherData,
  profile,
  onSuccess,
}: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [major, setMajor] = useState("");
  const [certificationsText, setCertificationsText] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [teachingExperience, setTeachingExperience] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [targetUnits, setTargetUnits] = useState(18);
  const [eligibleSubjects, setEligibleSubjects] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedInit, setHasLoadedInit] = useState(false);

  // Reset loading flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedInit(false);
    }
  }, [isOpen]);

  // Load initial values only once when opened
  useEffect(() => {
    if (isOpen && !hasLoadedInit && (profile || teacherData)) {
      if (profile) {
        setName(profile.displayName || "");
      }
      if (teacherData) {
        setDesignation(teacherData.designation || "Assistant Professor");
        setSpecialization(teacherData.specialization || "");
        setMajor(teacherData.major || "");
        setCertificationsText(
          teacherData.certifications ? teacherData.certifications.join(", ") : ""
        );
        setSkillsText(teacherData.skills ? teacherData.skills.join(", ") : "");
        setTeachingExperience(teacherData.teachingExperience || "");
        setOfficeLocation(teacherData.officeLocation || "");
        setTargetUnits(teacherData.targetUnits || 18);
        setEligibleSubjects(teacherData.eligibleSubjects || []);
      }
      setHasLoadedInit(true);
    }
  }, [isOpen, hasLoadedInit, profile, teacherData]);

  // Fetch all courses for eligibility selection
  useEffect(() => {
    async function loadCourses() {
      try {
        setFetchingCourses(true);
        const data = await facultyLoadService.getCourses();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses for selection:", err);
      } finally {
        setFetchingCourses(false);
      }
    }
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSubject = (courseId: string) => {
    if (eligibleSubjects.includes(courseId)) {
      setEligibleSubjects(eligibleSubjects.filter((id) => id !== courseId));
    } else {
      setEligibleSubjects([...eligibleSubjects, courseId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Convert comma separated string to arrays
    const certifications = certificationsText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
      
    const skills = skillsText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    try {
      await facultyLoadService.updateTeacherProfile(profile.id, {
        name,
        designation,
        specialization,
        major,
        certifications,
        skills,
        teachingExperience,
        officeLocation,
        targetUnits: Number(targetUnits),
        eligibleSubjects,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface-alt/30">
          <div>
            <h3 className="text-xl font-bold text-text">Edit Professional Profile</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Update credentials and eligible courses for schedule matching.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full hover:bg-stone-200 transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. John Smith"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Designation / Title
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Associate Professor"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Specialization */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Academic Specialization
              </label>
              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Artificial Intelligence, Cryptography"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Major */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Major Discipline
              </label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Teaching Experience
              </label>
              <input
                type="text"
                required
                value={teachingExperience}
                onChange={(e) => setTeachingExperience(e.target.value)}
                placeholder="e.g. 8 Years"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Office Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Office Location
              </label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. Tech Hall, Room 402"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>

            {/* Target Units */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Target Workload Units
              </label>
              <input
                type="number"
                min="3"
                max="30"
                required
                value={targetUnits}
                onChange={(e) => setTargetUnits(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">
              Professional Certifications (Comma-separated)
            </label>
            <textarea
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect, Cisco CCNA"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text resize-none"
            />
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">
              Skills & Competencies (Comma-separated)
            </label>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. Python, Machine Learning, UI/UX Design, React"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text resize-none"
            />
          </div>

          {/* Eligible Subjects Multi-select */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Eligible Subjects
              </label>
            </div>
            {fetchingCourses ? (
              <div className="flex items-center gap-2 text-sm text-text-muted py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <p className="text-xs text-text-muted italic">No courses found in database.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 max-h-[160px] overflow-y-auto pr-1">
                {courses.map((course) => {
                  const isSelected = eligibleSubjects.includes(course.id);
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleToggleSubject(course.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                          : "border-border hover:bg-surface-alt text-text"
                      }`}
                    >
                      <div className="flex flex-col pr-2">
                        <span className="font-semibold">{course.code || course.id}</span>
                        <span className="text-[10px] text-text-muted mt-0.5 truncate max-w-[200px]">
                          {course.name}
                        </span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-border bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-surface-alt/30">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary-strong text-white gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
