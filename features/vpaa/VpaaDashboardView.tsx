"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CalendarCheck, Scale, Stamp, RefreshCw, Check, X, Eye, FileText, AlertCircle } from "lucide-react";
import { appRoutes } from "@/lib/constants/routes.constants";

type SubTab = "overview" | "review" | "policy" | "approval" | "revisions";

interface TimetableEntry {
  id: string;
  courseName: string;
  courseCode: string;
  faculty: string;
  section: string;
  status: "pending" | "approved" | "needs_revision";
  policyIssues?: string[];
}

export function VpaaDashboardView() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split("/");
  const rawTab = pathSegments[pathSegments.length - 1] as SubTab;
  const subTab: SubTab = ["overview", "review", "policy", "approval", "revisions"].includes(rawTab) ? rawTab : "overview";

  useEffect(() => {
    if (!["overview", "review", "policy", "approval", "revisions"].includes(rawTab)) {
      navigate(appRoutes.vpaaDashboard, { replace: true });
    }
  }, []);

  const [entries, setEntries] = useState<TimetableEntry[]>([
    { id: "1", courseName: "Data Structures", courseCode: "CS202", faculty: "Dr. Maria Santos", section: "BSCS-2A", status: "pending" },
    { id: "2", courseName: "Software Engineering", courseCode: "CS401", faculty: "Prof. Juan Cruz", section: "BSCS-3A", status: "pending" },
    { id: "3", courseName: "Calculus II", courseCode: "MATH102", faculty: "Dr. Ana Reyes", section: "BSME-1A", status: "pending", policyIssues: ["Room capacity insufficient for section size"] },
    { id: "4", courseName: "Physics Lab", courseCode: "PHY101L", faculty: "Prof. John Lim", section: "BSCS-1A", status: "approved" },
  ]);

  const handleApprove = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "approved" as const } : e));
  };

  const handleRequestRevision = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "needs_revision" as const } : e));
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: CalendarCheck },
    { key: "review", label: "Review Timetable", icon: Eye },
    { key: "policy", label: "Policy Evaluation", icon: Scale },
    { key: "approval", label: "Final Approval", icon: Stamp },
    { key: "revisions", label: "Revision Requests", icon: RefreshCw },
  ];

  const pendingCount = entries.filter(e => e.status === "pending").length;
  const needsRevisionCount = entries.filter(e => e.status === "needs_revision").length;
  const approvedCount = entries.filter(e => e.status === "approved").length;
  const policyIssuesCount = entries.filter(e => (e.policyIssues?.length || 0) > 0).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">VPAA Dashboard</h1>
        <p className="text-text-muted mt-1">
          Vice President for Academic Affairs — Review, evaluate, and approve finalized schedules
        </p>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`${appRoutes.vpaaDashboard}/${tab.key}`)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 ${
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
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50">
                  <CalendarCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Pending Review</p>
                  <p className="text-2xl font-bold text-text">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-50">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Policy Issues</p>
                  <p className="text-2xl font-bold text-text">{policyIssuesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-50">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Needs Revision</p>
                  <p className="text-2xl font-bold text-text">{needsRevisionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/40 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <Stamp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Approved</p>
                  <p className="text-2xl font-bold text-text">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === "review" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Final Generated Timetable — Review</CardTitle>
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
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text">{e.courseName}</p>
                        <p className="text-xs text-text-muted">{e.courseCode}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-text">{e.faculty}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">{e.section}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          e.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          e.status === "needs_revision" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }>
                          {e.status === "needs_revision" ? "Needs Revision" : e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" className="h-8 gap-1">
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {subTab === "policy" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Academic Policy Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">Policy Issues</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.filter(e => (e.policyIssues?.length || 0) > 0).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        <p>All schedules pass policy checks. No issues found.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.filter(e => (e.policyIssues?.length || 0) > 0).map((e) => (
                      <tr key={e.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{e.courseName}</p>
                          <p className="text-xs text-text-muted">{e.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{e.section}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {e.policyIssues?.map((issue, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-rose-600">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Violation</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="secondary" className="h-8 gap-1">
                            <RefreshCw className="h-3.5 w-3.5" /> Request Revision
                          </Button>
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

      {subTab === "approval" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Final Approval</CardTitle>
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
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.filter(e => e.status === "pending" || e.status === "needs_revision").length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        <p>All schedules have been finalized. No pending approvals.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.filter(e => e.status === "pending" || e.status === "needs_revision").map((e) => (
                      <tr key={e.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{e.courseName}</p>
                          <p className="text-xs text-text-muted">{e.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{e.faculty}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{e.section}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            e.status === "needs_revision" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }>
                            {e.status === "needs_revision" ? "Needs Revision" : "Pending"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(e.id)}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 gap-1 text-orange-600 hover:bg-orange-50" onClick={() => handleRequestRevision(e.id)}>
                              <RefreshCw className="h-3.5 w-3.5" /> Revise
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

      {subTab === "revisions" && (
        <Card className="border-none shadow-md bg-white/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-white/50 px-6 py-4">
            <CardTitle className="text-lg">Schedules Marked for Revision</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Faculty</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.filter(e => e.status === "needs_revision").length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        <p>No revision requests at this time.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.filter(e => e.status === "needs_revision").map((e) => (
                      <tr key={e.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{e.courseName}</p>
                          <p className="text-xs text-text-muted">{e.courseCode}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{e.faculty}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{e.section}</td>
                        <td className="px-6 py-4">
                          {e.policyIssues?.length ? (
                            <div className="flex flex-col gap-1">
                              {e.policyIssues.map((issue, i) => (
                                <span key={i} className="text-xs text-rose-600">{issue}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">Policy violation — revision requested</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(e.id)}>
                              <Check className="h-3.5 w-3.5" /> Approve After Revision
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 gap-1">
                              <Eye className="h-3.5 w-3.5" /> View
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

export default VpaaDashboardView;
