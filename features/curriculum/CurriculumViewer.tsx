"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BookOpen, Calendar, Star, GraduationCap } from "lucide-react";
import { Curriculum } from "@/lib/types/curriculum.types";
import { Term } from "@/lib/types/section-term.types";
import { Course } from "@/lib/types/firestore.types";
import { termsService } from "@/features/sections/sections.service";
import { curriculumService } from "./curriculum.service";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

function subscribeCourses(onUpdate: (courses: Course[]) => void): () => void {
  const db = getDb();
  const ref = collection(db, "courses");
  const q = query(ref, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
    onUpdate(courses);
  });
}

const semesterOrder: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  Summer: 3,
};

export function CurriculumViewer() {
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [allCurricula, setAllCurricula] = useState<Curriculum[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track which data sources have emitted at least once
  const [loadedTerms, setLoadedTerms] = useState(false);
  const [loadedCurricula, setLoadedCurricula] = useState(false);
  const [loadedCourses, setLoadedCourses] = useState(false);

  // Subscribe to terms
  useEffect(() => {
    const unsub = termsService.subscribeAll((data) => {
      setAllTerms(data);
      setLoadedTerms(true);
    });
    return unsub;
  }, []);

  // Subscribe to curricula
  useEffect(() => {
    const unsub = curriculumService.subscribeAll((data) => {
      setAllCurricula(data);
      setLoadedCurricula(true);
    });
    return unsub;
  }, []);

  // Subscribe to courses (same pattern as CurriculumManagementView)
  useEffect(() => {
    const unsub = subscribeCourses((data) => {
      setAllCourses(data);
      setLoadedCourses(true);
    });
    return unsub;
  }, []);

  // Set loading false once all three sources have fired
  useEffect(() => {
    if (loadedTerms && loadedCurricula && loadedCourses) {
      setLoading(false);
    }
  }, [loadedTerms, loadedCurricula, loadedCourses]);

  // Default selected term: current term, or first term if none is current
  useEffect(() => {
    if (!loadedTerms || selectedTermId !== null) return;
    const current = allTerms.find((t) => t.isCurrent);
    setSelectedTermId(current ? current.id : allTerms[0]?.id ?? null);
  }, [loadedTerms, allTerms, selectedTermId]);

  // Derived data
  const selectedTerm = allTerms.find((t) => t.id === selectedTermId);
  const matchingCurriculum = selectedTerm
    ? allCurricula.find((c) => c.academicYear === selectedTerm.academicYear)
    : null;

  const courseMap = new Map(allCourses.map((c) => [c.id, c]));

  // Group courses for the selected term's semester by year level
  const yearLevelGroups: {
    yearLevel: number;
    entries: { courseId: string; isCore: boolean; courseData: Course | undefined }[];
  }[] = [];

  if (matchingCurriculum && selectedTerm) {
    const filtered = matchingCurriculum.courses.filter(
      (cc) => cc.semester === selectedTerm.semester
    );

    const groupMap = new Map<number, (typeof filtered[0])[]>();
    for (const cc of filtered) {
      const existing = groupMap.get(cc.yearLevel) || [];
      existing.push(cc);
      groupMap.set(cc.yearLevel, existing);
    }

    for (const [yearLevel, entries] of groupMap) {
      yearLevelGroups.push({
        yearLevel,
        entries: entries.map((cc) => ({
          courseId: cc.courseId,
          isCore: cc.isCore,
          courseData: courseMap.get(cc.courseId),
        })),
      });
    }

    yearLevelGroups.sort((a, b) => a.yearLevel - b.yearLevel);
  }

  const formatTermLabel = (term: Term) =>
    `${term.semester} Semester • AY ${term.academicYear}`;

  // Terms already come sorted by academicYear desc from the service,
  // but we sort again to guarantee semester order within the same year
  const sortedTerms = [...allTerms].sort((a, b) => {
    const yearCmp = b.academicYear.localeCompare(a.academicYear);
    if (yearCmp !== 0) return yearCmp;
    return (semesterOrder[a.semester] || 0) - (semesterOrder[b.semester] || 0);
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Curriculum Viewer
            </CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Browse course offerings by academic term
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Term Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-muted flex items-center gap-1.5 mb-2">
              <Calendar className="h-4 w-4" />
              Select Term
            </label>
            <select
              value={selectedTermId ?? ""}
              onChange={(e) => setSelectedTermId(e.target.value || null)}
              className="w-full max-w-md h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              {!loadedTerms && (
                <option value="">Loading terms...</option>
              )}
              {loadedTerms && sortedTerms.length === 0 && (
                <option value="">No terms available</option>
              )}
              {sortedTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {formatTermLabel(term)}
                  {term.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Content States */}
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 w-64 rounded-lg bg-surface-alt/50 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-alt/50 animate-pulse" />
              ))}
            </div>
          ) : !selectedTerm ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <Calendar className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted">No terms found.</p>
              <p className="text-text-muted/60 text-sm mt-1">
                Create a term first in the Term Management section.
              </p>
            </div>
          ) : !matchingCurriculum ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <BookOpen className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted">
                No curriculum found for academic year{" "}
                <span className="font-semibold">{selectedTerm.academicYear}</span>.
              </p>
              <p className="text-text-muted/60 text-sm mt-1">
                Create a curriculum for this academic year in Curriculum Management.
              </p>
            </div>
          ) : yearLevelGroups.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <GraduationCap className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted">
                No courses assigned for{" "}
                <span className="font-semibold">
                  {selectedTerm.semester} Semester
                </span>{" "}
                in the{" "}
                <span className="font-semibold">{matchingCurriculum.name}</span>{" "}
                curriculum.
              </p>
              <p className="text-text-muted/60 text-sm mt-1">
                Assign courses to this semester in Curriculum Management.
              </p>
            </div>
          ) : (
            <div>
              {/* Curriculum Info */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {matchingCurriculum.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedTerm.semester} Semester • AY{" "}
                  {selectedTerm.academicYear}
                </p>
              </div>

              {/* Year Level Grid */}
              <div className="overflow-x-auto border border-border/30 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-alt/40 border-b border-border/30">
                      <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider w-24">
                        Year Level
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">
                        Courses
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearLevelGroups.map((group) => (
                      <tr
                        key={group.yearLevel}
                        className="border-b border-border/20 last:border-b-0"
                      >
                        <td className="py-3 px-4 font-semibold text-text align-top whitespace-nowrap">
                          Year {group.yearLevel}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            {group.entries.map((entry) => {
                              const course = entry.courseData;
                              const code = course?.code || entry.courseId;
                              return (
                                <div
                                  key={entry.courseId}
                                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface/50"
                                >
                                  <span className="font-bold text-sm text-text">
                                    {code}
                                  </span>
                                  <span className="text-text-muted text-sm">
                                    {course?.name || "Unknown Course"}
                                  </span>
                                  {course?.units != null && (
                                    <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold ml-auto shrink-0">
                                      {course.units}{" "}
                                      {course.units === 1 ? "unit" : "units"}
                                    </span>
                                  )}
                                  {entry.isCore && (
                                    <Star
                                      className="h-3.5 w-3.5 text-amber-500 shrink-0"
                                      fill="currentColor"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CurriculumViewer;
