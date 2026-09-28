"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CalendarCheck, AlertTriangle, CheckSquare, Check, X, Eye, FileText } from "lucide-react";
import { FacultyMember } from "@/lib/types/faculty-load.types";
import { facultyLoadService } from "@/features/faculty-load/faculty-load.service";
import { appRoutes } from "@/lib/constants/routes.constants";

type SubTab = "overview" | "schedules" | "overloads" | "approvals";

interface PendingSchedule {
  id: string;
  courseName: string;
  courseCode: string;
  faculty: string;
  section: string;
  status: "pending" | "approved" | "rejected";
}

export function DeanDashboardView() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split("/");
  const rawTab = pathSegments[pathSegments.length - 1] as SubTab;
  const subTab: SubTab = ["overview", "schedules", "overloads", "approvals"].includes(rawTab) ? rawTab : "overview";

  useEffect(() => {
    if (!["overview", "schedules", "overloads", "approvals"].includes(rawTab)) {
      navigate(appRoutes.deanDashboard, { replace: true });
    }
  }, []);

  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>([
    { id: "1", courseName: "Data Structures", courseCode: "CS202", faculty: "Dr. Maria Santos", section: "BSCS-2A", status: "pending" },
    { id: "2", courseName: "Software Engineering", courseCode: "CS401", faculty: "Prof. Juan Cruz", section: "BSCS-3A", status: "pending" },
    { id: "3", courseName: "Calculus II", courseCode: "MATH102", faculty: "Dr. Ana Reyes", section: "BSME-1A", status: "pending" },
    { id: "4", courseName: "Discrete Mathematics", courseCode: "CS201", faculty: "Dr. Maria Santos", section: "BSCS-2A", status: "approved" },
    { id: "5", courseName: "Physics Lab", courseCode: "PHY101L", faculty: "Prof. John Lim", section: "BSCS-1A", status: "rejected" },
  ]);

  const [approvalState, setApprovalState] = useState<Record<string, "approved" | "rejected">>({});

  useEffect(() => {
    const unsub = facultyLoadService.subscribeFacultyLoad((data) => {
      setFaculty(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const tabs = [
    { key: "overview", label: "Overview", icon: CalendarCheck },
    { key: "schedules", label: "Review Schedules", icon: Eye },
    { key: "overloads", label: "Check Overloads", icon: AlertTriangle },
    { key: "approvals", label: "Approve Schedules", icon: CheckSquare },
  ];

  const overloadedFaculty = faculty.filter(f => f.status === "excess_load");
  const pendingCount = pendingSchedules.filter(s => s.status === "pending").length;
  const totalApproved = pendingSchedules.filter(s => s.status === "approved" || approvalState[s.id] === "approved").length;

  const handleApprove = (id: string) => {
    setApprovalState(prev => ({ ...prev, [id]: "approved" }));
    setPendingSchedules(prev =>
      prev.map(s => s.id === id ? { ...s, status: "approved" as const } : s)
    );
  };

  const handleReject = (id: string) => {
    setApprovalState(prev => ({ ...prev, [id]: "rejected" }));
    setPendingSchedules(prev =>
      prev.map(s => s.id === id ? { ...s, status: "rejected" as const } : s)
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">Dean</h1>
        <p className="text-text-muted mt-1">Review schedules, check faculty overloads, and approve academic plans</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`${appRoutes.deanDashboard}/${tab.key}`)}
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
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-50">
                    <CalendarCheck className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Pending Reviews</p>
                    <p className="text-2xl font-bold text-text">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-rose-50">
                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Excess Load Faculty</p>
                    <p className="text-2xl font-bold text-text">{overloadedFaculty.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <CheckSquare className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Approved</p>
                    <p className="text-2xl font-bold text-text">{totalApproved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
              <CardTitle className="text-lg">Recent Faculty Overloads</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {overloadedFaculty.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <p>No faculty with excess load.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {overloadedFaculty.slice(0, 5).map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-semibold text-text">{f.name}</p>
                        <p className="text-xs text-text-muted">{f.department}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-text-muted">{f.totalUnits} / {f.targetUnits} units</span>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Excess Load</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {subTab === "schedules" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Proposed Schedules for Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Faculty</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingSchedules.map((s) => {
                    const finalStatus = approvalState[s.id] || s.status;
                    return (
                      <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{s.courseName}</p>
                          <p className="text-xs text-text-muted">{s.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{s.faculty}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{s.section}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            finalStatus === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            finalStatus === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }>
                            {finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" className="h-8 gap-1">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                            {s.status === "pending" && (
                              <>`
                                <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(s.id)}>
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button size="sm" variant="secondary" className="h-8 gap-1 text-rose-600 hover:bg-rose-50" onClick={() => handleReject(s.id)}>
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {subTab === "overloads" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Faculty Load Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                      <th className="px-6 py-4">Faculty</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Load</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {faculty.map((f) => (
                      <tr key={f.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{f.name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{f.department}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text">{f.totalUnits}</span>
                            <span className="text-text-muted">/ {f.targetUnits}</span>
                            <div className="w-24 h-1.5 bg-surface-alt rounded-full overflow-hidden ml-2">
                              <div
                                className={`h-full rounded-full ${
                                  f.status === "excess_load" ? "bg-rose-500" :
                                  f.status === "underloaded" ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, (f.totalUnits / f.targetUnits) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            f.status === "excess_load" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            f.status === "underloaded" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }>
                            {f.status === "excess_load" ? "Excess Load" :
                             f.status === "underloaded" ? "Underloaded" : "Normal"}
                          </Badge>
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

      {subTab === "approvals" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Schedule Approvals</CardTitle>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500">{pendingCount} Pending</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Faculty</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">Decision</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingSchedules.filter(s => s.status === "pending").length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        <p>All schedules have been reviewed. No pending approvals.</p>
                      </td>
                    </tr>
                  ) : (
                    pendingSchedules.filter(s => s.status === "pending").map((s) => (
                      <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{s.courseName}</p>
                          <p className="text-xs text-text-muted">{s.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{s.faculty}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{s.section}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(s.id)}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 gap-1 text-rose-600 hover:bg-rose-50" onClick={() => handleReject(s.id)}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DeanDashboardView;
