"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Users, School, BookOpen, ArrowRight, Check } from "lucide-react";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { CourseOfferingWithCourse } from "@/lib/types/offering.types";
import { Room } from "@/lib/types/room.types";
import { Course } from "@/lib/types/course.types";
import { Term } from "@/lib/types/section-term.types";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { courseOfferingsService } from "@/features/course-offerings/course-offerings.service";
import { roomsService } from "@/features/rooms/rooms.service";
import { coursesService } from "@/features/courses/courses.service";
import { termsService } from "@/features/sections/sections.service";
import { appRoutes } from "@/lib/constants/routes.constants";

type SubTab = "overview" | "faculty" | "rooms" | "subjects";

export function ProgramHeadDashboardView() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split("/");
  const rawTab = pathSegments[pathSegments.length - 1] as SubTab;
  const subTab: SubTab = ["overview", "faculty", "rooms", "subjects"].includes(rawTab) ? rawTab : "overview";

  useEffect(() => {
    if (!["overview", "faculty", "rooms", "subjects"].includes(rawTab)) {
      navigate(appRoutes.programHeadDashboard, { replace: true });
    }
  }, []);

  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [offerings, setOfferings] = useState<CourseOfferingWithCourse[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTerm = terms.find(t => t.isCurrent) || terms[0];

  useEffect(() => {
    const unsubFaculty = facultyLoadService.subscribeFacultyLoad((data) => {
      setFaculty(data.filter(f => f.department === profile?.departmentId || !profile?.departmentId));
    });
    const unsubRooms = roomsService.subscribeRooms((data) => {
      setRooms(data);
    });
    const unsubCourses = coursesService.subscribeCourses((data) => {
      setCourses(data);
    });
    const unsubTerms = termsService.subscribeAll((data) => {
      setTerms(data);
    });
    return () => {
      unsubFaculty();
      unsubRooms();
      unsubCourses();
      unsubTerms();
    };
  }, [profile?.departmentId]);

  useEffect(() => {
    if (!currentTerm) return;
    const unsubOfferings = courseOfferingsService.subscribeOfferingsByTerm(currentTerm.id, (data) => {
      setOfferings(data);
      setLoading(false);
    });
    return () => unsubOfferings();
  }, [currentTerm?.id]);

  const tabs = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "faculty", label: "Faculty Assignment", icon: Users },
    { key: "rooms", label: "Room Assignment", icon: School },
    { key: "subjects", label: "Subject Assignment", icon: BookOpen },
  ];

  const deptOfferings = profile?.departmentId
    ? offerings.filter(o => courses.find(c => c.id === o.courseId)?.departmentId === profile.departmentId)
    : offerings;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Program Head</h1>
        <p className="text-text-muted mt-1">
          {profile?.departmentId || "All Departments"} — Manage faculty, rooms, and subject assignments
          {currentTerm && <span className="ml-2 text-xs">({currentTerm.semester} Sem, {currentTerm.academicYear})</span>}
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`${appRoutes.programHeadDashboard}/${tab.key}`)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              subTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text hover:border-border"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Faculty</p>
                  <p className="text-2xl font-bold text-text">{faculty.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Course Offerings</p>
                  <p className="text-2xl font-bold text-text">{deptOfferings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Rooms Available</p>
                  <p className="text-2xl font-bold text-text">{rooms.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === "faculty" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Assign Faculty to Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : deptOfferings.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <p>No course offerings available for assignment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Units</th>
                      <th className="px-6 py-4">Assigned Faculty</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deptOfferings.map((offering) => (
                      <tr key={offering.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{offering.courseName}</p>
                          <p className="text-xs text-text-muted">{offering.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{offering.sectionName || "—"}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text">{offering.assignedUnits}</td>
                        <td className="px-6 py-4">
                          <select
                            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            defaultValue=""
                          >
                            <option value="" disabled>Select faculty</option>
                            {faculty.map((f) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <Button size="sm" className="h-8 gap-1">
                            <Check className="h-3.5 w-3.5" /> Assign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === "rooms" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Assign Rooms to Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : deptOfferings.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <p>No offerings available for room assignment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Units</th>
                      <th className="px-6 py-4">Room</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deptOfferings.map((offering) => (
                      <tr key={offering.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{offering.courseName}</p>
                          <p className="text-xs text-text-muted">{offering.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{offering.sectionName || "—"}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text">{offering.assignedUnits}</td>
                        <td className="px-6 py-4">
                          <select
                            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px]"
                            defaultValue=""
                          >
                            <option value="" disabled>Select room</option>
                            {rooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name} ({r.building})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <Button size="sm" className="h-8 gap-1">
                            <Check className="h-3.5 w-3.5" /> Assign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === "subjects" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Assign Subjects to Programs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <p>No subjects configured.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Units</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-text">{course.code}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{course.name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{course.units}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="capitalize bg-surface-alt">
                            {course.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button size="sm" variant="secondary" className="h-8 gap-1">
                            <ArrowRight className="h-3.5 w-3.5" /> Assign to Program
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProgramHeadDashboardView;
