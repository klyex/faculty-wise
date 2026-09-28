"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { TeacherCourse } from "@/lib/types/teacher-dashboard.types";

interface RealtimeTeachingLoadProps {
  courses: TeacherCourse[];
  loading: boolean;
  availabilityWindowOpen?: boolean;
}

export function RealtimeTeachingLoadSummary({
  courses,
  loading,
  availabilityWindowOpen = true,
}: RealtimeTeachingLoadProps) {
  const [displayCourses, setDisplayCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => {
    // Show up to 3 courses, sorted by status
    const sorted = [...courses]
      .sort((a, b) => {
        const statusOrder = { active: 0, pending: 1, completed: 2 };
        return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
      })
      .slice(0, 3);
    setDisplayCourses(sorted);
  }, [courses]);

  if (loading) {
    return (
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Teaching Load Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        </CardContent>
      </Card>
    );
  }

  const courseInitial = (courseName: string) => {
    return courseName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Teaching Load Summary</CardTitle>
          {courses.length > 3 && (
            <Button variant="ghost" className="text-teal-600 text-xs">
              View Full Details ({courses.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayCourses.length > 0 ? (
            displayCourses.map((course, idx) => (
              <div
                key={course.id}
                className={`p-4 rounded-lg border border-border bg-surface-alt/50 flex justify-between items-center ${
                  course.status === "completed" ? "opacity-70" : ""
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center font-bold text-teal-600 text-sm">
                    {courseInitial(course.code)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{course.name}</p>
                    <p className="text-xs text-text-muted">
                      {course.units} Units • {course.sections} Section{course.sections !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{course.sessionDays.join("/")}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">No courses assigned yet.</p>
            </div>
          )}
        </div>

        {availabilityWindowOpen && (
          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Next semester&apos;s availability window is currently <strong>open</strong>. Please submit
              your preferences before Oct 30.
            </p>
            <ArrowRight className="h-4 w-4 text-amber-600 ml-auto" />
          </div>
        )}

        {!availabilityWindowOpen && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800">
              Your schedule is being generated. You&apos;ll receive updates soon.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
