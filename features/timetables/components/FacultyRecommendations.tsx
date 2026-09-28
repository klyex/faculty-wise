"use client";

import React, { useState, useMemo } from "react";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { getRecommendationsForCourses } from "@/lib/faculty-recommendation";
import { buildTeacherHistory } from "@/lib/teaching-history";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Award, TrendingUp, Users, Clock } from "lucide-react";

interface Props {
  courses: { id: string; code: string; name: string; department: string }[];
  facultyList: FacultyMember[];
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-red-100 text-red-800 border-red-300",
};

function ScoreBar({ label, value, maxWidth }: { label: string; value: number; maxWidth: number }) {
  const pct = Math.min(value * 100, 100);
  const color =
    value >= 0.7 ? "bg-emerald-500" : value >= 0.4 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-text-muted shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden" style={{ maxWidth }}>
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-text-muted">{Math.round(pct)}%</span>
    </div>
  );
}

export default function FacultyRecommendations({ courses, facultyList }: Props) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(
    () => getRecommendationsForCourses(courses, facultyList),
    [courses, facultyList]
  );

  if (results.length === 0 || facultyList.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text">
            Faculty Recommendations
          </h3>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {facultyList.length} faculty
          </Badge>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-accent font-medium hover:underline"
        >
          {showAll ? "Show Top 3" : "Show All"}
        </button>
      </div>

      <div className="space-y-3">
        {results.map((result) => {
          const top = showAll
            ? result.recommendations
            : result.recommendations.slice(0, 3);
          const isExpanded = expandedCourse === result.courseId;

          return (
            <Card key={result.courseId} className="border border-border overflow-hidden">
              <button
                onClick={() =>
                  setExpandedCourse(isExpanded ? null : result.courseId)
                }
                className="w-full flex items-center justify-between p-3 hover:bg-surface-alt/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {result.courseCode}
                  </span>
                  <span className="text-sm font-medium text-text truncate max-w-[200px]">
                    {result.courseName}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      result.recommendations[0]?.confidence
                        ? CONFIDENCE_COLORS[result.recommendations[0].confidence]
                        : ""
                    }`}
                  >
                    Best: {(result.recommendations[0]?.overallScore * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Users className="w-3 h-3" />
                  <span>{result.recommendations.length} ranked</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {top.map((rec, i) => (
                    <div
                      key={rec.faculty.id}
                      className={`rounded-xl p-3 ${
                        i === 0
                          ? "bg-accent/5 border border-accent/20"
                          : "bg-surface-alt/30 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Award className="w-4 h-4 text-accent" />}
                          <span className="text-sm font-semibold text-text">
                            {rec.faculty.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              CONFIDENCE_COLORS[rec.confidence]
                            }`}
                          >
                            {rec.confidence}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-accent" />
                          <span className="text-sm font-bold text-accent">
                            {(rec.overallScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <ScoreBar
                          label="Expertise"
                          value={rec.breakdown.expertiseMatch}
                          maxWidth={240}
                        />
                        <ScoreBar
                          label="Eligibility"
                          value={rec.breakdown.eligibilityMatch}
                          maxWidth={240}
                        />
                        <ScoreBar
                          label="Historical"
                          value={rec.breakdown.historicalMatch}
                          maxWidth={240}
                        />
                        <ScoreBar
                          label="Department"
                          value={rec.breakdown.departmentMatch}
                          maxWidth={240}
                        />
                        <ScoreBar
                          label="Workload"
                          value={rec.breakdown.workloadScore}
                          maxWidth={240}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rec.faculty.skills &&
                          rec.faculty.skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-primary/5 text-primary rounded text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        {rec.faculty.specialization && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
                            {rec.faculty.specialization}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 mt-1.5 text-[10px] text-text-muted flex-wrap">
                        <span>
                          Load: {rec.faculty.totalUnits}/{rec.faculty.targetUnits} units
                        </span>
                        {rec.faculty.employmentType && (
                          <span>{rec.faculty.employmentType}</span>
                        )}
                        {(() => {
                          const courseCode = result.courseCode;
                          const hist = buildTeacherHistory(rec.faculty);
                          const summary = hist.courseSummary[courseCode];
                          if (summary && summary.totalSemesters > 0) {
                            const lastRec = summary.records[summary.records.length - 1];
                            const lastSem = lastRec.academicYear ? `${lastRec.academicYear} ${lastRec.semester}` : lastRec.semester;
                            return (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-text-muted" />
                                {summary.totalSemesters} sem(s), last: {lastSem}
                              </span>
                            );
                          }
                          return <span className="text-text-muted italic">No history</span>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
