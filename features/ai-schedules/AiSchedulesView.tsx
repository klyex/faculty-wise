"use client";

import React, { useEffect, useState, useMemo } from "react";
import { aiSchedulesService, AiProposal, ProposalStatus } from "./ai-schedules.service";
import { TimetableGrid } from "@/features/timetables/components/TimetableGrid";
import { TimetableEntry, DayOfWeek } from "@/lib/types/timetable.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { getDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import {
  BrainCircuit,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  CalendarCheck2,
  CalendarPlus,
  Clock,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Columns2,
} from "lucide-react";

const STATUS_BADGE: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "text-amber-700 border-amber-300 bg-amber-50" },
  applied: { label: "Applied", className: "text-emerald-700 border-emerald-300 bg-emerald-50" },
  accepted: { label: "Accepted", className: "text-blue-700 border-blue-300 bg-blue-50" },
  rejected: { label: "Rejected", className: "text-red-700 border-red-300 bg-red-50" },
};

export default function AiSchedulesView() {
  const { profile } = useAuth();
  const role = profile?.role;
  const isAdmin = role === "admin";
  const isDean = role === "dean";
  const isProgramHead = role === "program_head";
  
  const canRenameOrDelete = isAdmin || isProgramHead;
  const canApproveOrReject = isAdmin || isDean;
  const canApply = isAdmin;

  const [proposals, setProposals] = useState<AiProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Sorting, Searching, and Pagination States
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Reset to first page on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await aiSchedulesService.listProposals();
      setProposals(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [proposals, searchQuery, statusFilter]);

  const sortedProposals = useMemo(() => {
    return [...filteredProposals].sort((a: any, b: any) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "totalScheduled" || sortField === "conflictsAvoided" || sortField === "totalSkipped") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc"
          ? (valA > valB ? 1 : -1)
          : (valB > valA ? 1 : -1);
      }
    });
  }, [filteredProposals, sortField, sortOrder]);

  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProposals.slice(start, start + pageSize);
  }, [sortedProposals, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedProposals.length / pageSize);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setActionError(null);
    try {
      await aiSchedulesService.deleteProposal(id);
      setProposals((prev) => prev.filter((p) => p.id !== id));
      if (expandedId === id) setExpandedId(null);
      if (previewId === id) setPreviewId(null);
      setSelectedForCompare(prev => prev.filter(s => s !== id));
      flash("Proposal deleted.");
    } catch {
      setActionError("Failed to delete proposal.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await aiSchedulesService.renameProposal(id, editName.trim());
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: editName.trim() } : p))
      );
      setEditingId(null);
      flash("Proposal renamed.");
    } catch {
      setActionError("Failed to rename proposal.");
    }
  };

  const handleStatusChange = async (id: string, status: ProposalStatus) => {
    setActionError(null);
    try {
      await aiSchedulesService.markStatus(id, status);
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      flash(`Proposal marked as "${status}".`);
    } catch {
      setActionError("Failed to update proposal status.");
    }
  };

  const handleApply = async (proposal: AiProposal, mode: "replace" | "append") => {
    setApplyingId(proposal.id);
    setActionError(null);
    try {
      const db = getDb();
      if (mode === "replace") {
        const snap = await getDocs(collection(db, "schedules"));
        const batchDel = writeBatch(db);
        snap.docs.forEach((d) => batchDel.delete(d.ref));
        await batchDel.commit();
      }
      const batchAdd = writeBatch(db);
      for (const sched of proposal.data.schedules) {
        const ref = doc(collection(db, "schedules"));
        batchAdd.set(ref, sched);
      }
      await batchAdd.commit();
      await aiSchedulesService.markApplied(proposal.id);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: "applied" } : p))
      );
      flash(
        mode === "replace"
          ? "Active timetable replaced with this proposal."
          : "Proposal appended to active timetable."
      );
    } catch (err: any) {
      setActionError("Failed to apply proposal: " + (err?.message ?? "unknown error"));
    } finally {
      setApplyingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getPreviewEntries = (proposal: AiProposal): TimetableEntry[] => {
    return (proposal.data.entries ?? []).map((e: any) => ({
      ...e,
      day: e.day as DayOfWeek,
    }));
  };

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const openComparison = () => {
    setShowComparison(true);
  };

  if (!profile || !['admin', 'program_head', 'dean'].includes(profile.role)) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-xl border border-amber-100 max-w-lg mx-auto mt-20">
        <p className="text-amber-600 font-medium">Access restricted to authorized personnel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif flex items-center gap-3">
            <BrainCircuit className="w-9 h-9 text-accent" />
            AI Schedule Proposals
          </h1>
          <p className="text-text-muted mt-1">
            Manage, preview, rename, or apply AI-generated timetable proposals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!compareMode ? (
            <Button
              onClick={() => setCompareMode(true)}
              variant="secondary"
              className="gap-2 h-10 border border-border"
              disabled={proposals.length < 2}
            >
              <Columns2 className="w-4 h-4" />
              Compare
            </Button>
          ) : (
            <>
              <Button
                onClick={() => { setCompareMode(false); setSelectedForCompare([]); setShowComparison(false); }}
                variant="secondary"
                className="gap-2 h-10 border border-border"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={openComparison}
                disabled={selectedForCompare.length < 2}
                className="bg-accent hover:bg-accent/90 text-white h-10 gap-2"
              >
                <Columns2 className="w-4 h-4" />
                Compare ({selectedForCompare.length})
              </Button>
            </>
          )}
          <Button
            onClick={load}
            variant="secondary"
            className="gap-2 h-10 border border-border"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Layout Toggles */}
      <Card className="border-none shadow-md bg-white/40 backdrop-blur-md no-print">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proposal name..."
              className="px-3 py-2 w-52 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="accepted">Accepted</option>
              <option value="applied">Applied</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-surface-alt/50 rounded-xl border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm border border-border font-bold text-primary" : "text-text-muted"}`}
            >
              Grid Cards
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === "table" ? "bg-white shadow-sm border border-border font-bold text-primary" : "text-text-muted"}`}
            >
              List Table
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast / feedback */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <Check className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Compare mode hint */}
      {compareMode && !showComparison && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <Columns2 className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            Select 2 or more proposals to compare side by side.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedProposals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-white rounded-3xl border border-border/60">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-text font-source-serif">No Proposals Found</h2>
          <p className="text-text-muted max-w-sm">
            Generate an AI timetable from the{" "}
            <strong>Timetables</strong> section. Proposals will be saved here for
            review, editing, and applying.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-alt rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Proposals list */}
      {!loading && sortedProposals.length > 0 && viewMode === "grid" && (
        <div className="space-y-4">
          {paginatedProposals.map((proposal) => {
            const isExpanded = expandedId === proposal.id;
            const isPreviewing = previewId === proposal.id;
            const isApplying = applyingId === proposal.id;
            const isDeleting = deletingId === proposal.id;
            const isEditing = editingId === proposal.id;
            const isCompareSelected = selectedForCompare.includes(proposal.id);

            const statusStyle = STATUS_BADGE[proposal.status] || STATUS_BADGE.draft;

            return (
              <Card
              key={proposal.id}
              className={`border transition-all duration-300 overflow-hidden ${
                proposal.status === "applied"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : proposal.status === "accepted"
                  ? "border-blue-200 bg-blue-50/30"
                  : proposal.status === "rejected"
                  ? "border-red-200 bg-red-50/30 opacity-70"
                  : compareMode && isCompareSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-white"
              }`}
            >
              {/* Card header row */}
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Compare checkbox */}
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={isCompareSelected}
                        onChange={() => toggleCompareSelect(proposal.id)}
                        className="mt-1.5 rounded text-accent focus:ring-accent shrink-0"
                      />
                    )}
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        proposal.status === "applied"
                          ? "bg-emerald-100 text-emerald-700"
                          : proposal.status === "accepted"
                          ? "bg-blue-100 text-blue-700"
                          : proposal.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Name / edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(proposal.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="text-base font-bold border border-accent rounded-md px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <button
                            onClick={() => handleRename(proposal.id)}
                            className="p-1.5 bg-accent text-white rounded-md hover:bg-accent/90"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-surface-alt rounded-md hover:bg-surface-alt/80 text-text-muted"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-text truncate">
                            {proposal.name}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${statusStyle.className}`}>
                            {statusStyle.label}
                          </Badge>
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(proposal.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarCheck2 className="w-3 h-3 text-emerald-600" />
                          <strong className="text-emerald-700">{proposal.totalScheduled}</strong>&nbsp;scheduled
                        </span>
                        {proposal.totalSkipped > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <strong className="text-amber-600">{proposal.totalSkipped}</strong>&nbsp;skipped
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          ⚡ <strong>{proposal.conflictsAvoided}</strong>&nbsp;conflicts avoided
                        </span>
                      </div>

                      {/* Dept tags */}
                      {proposal.filteredDepts?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proposal.filteredDepts.map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-semibold uppercase tracking-wider"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Rename */}
                    {!isEditing && canRenameOrDelete && (
                      <button
                        onClick={() => {
                          setEditingId(proposal.id);
                          setEditName(proposal.name);
                        }}
                        title="Rename"
                        className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Accept */}
                    {proposal.status !== "accepted" && canApproveOrReject && (
                      <button
                        onClick={() => handleStatusChange(proposal.id, "accepted")}
                        title="Accept"
                        className="p-2 rounded-lg border border-emerald-200 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                    )}

                    {/* Reject */}
                    {proposal.status !== "rejected" && canApproveOrReject && (
                      <button
                        onClick={() => handleStatusChange(proposal.id, "rejected")}
                        title="Reject"
                        className="p-2 rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    )}

                    {/* Preview toggle */}
                    <button
                      onClick={() =>
                        setPreviewId(isPreviewing ? null : proposal.id)
                      }
                      title={isPreviewing ? "Hide Preview" : "Preview Grid"}
                      className={`p-2 rounded-lg border transition-colors ${
                        isPreviewing
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-muted hover:text-text hover:bg-surface-alt"
                      }`}
                    >
                      {isPreviewing ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    {/* Report toggle */}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : proposal.id)
                      }
                      title="View AI Report"
                      className={`p-2 rounded-lg border transition-colors ${
                        isExpanded
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-text-muted hover:text-text hover:bg-surface-alt"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Apply: Append */}
                    {canApply && (
                      <Button
                        onClick={() => handleApply(proposal, "append")}
                        disabled={isApplying}
                        className="bg-accent hover:bg-accent/90 text-white h-9 text-xs gap-1.5 px-3"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        {isApplying ? "Applying…" : "Append"}
                      </Button>
                    )}

                    {/* Apply: Replace */}
                    {canApply && (
                      <Button
                        onClick={() => handleApply(proposal, "replace")}
                        disabled={isApplying}
                        className="bg-red-600 hover:bg-red-700 text-white h-9 text-xs gap-1.5 px-3"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        Replace
                      </Button>
                    )}

                    {/* Delete */}
                    {canRenameOrDelete && (
                      <button
                        onClick={() => handleDelete(proposal.id)}
                        disabled={isDeleting}
                        title="Delete proposal"
                        className="p-2 rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Timetable preview grid */}
              {isPreviewing && (
                <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-surface-alt/30">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Timetable Preview — {proposal.totalScheduled} classes
                    </p>
                    <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-white">
                      <TimetableGrid entries={getPreviewEntries(proposal)} />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Report accordion */}
              {isExpanded && proposal.report && (
                <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-5 space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-700">
                          {proposal.report.totalScheduled}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">Scheduled</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-amber-700">
                          {proposal.report.conflictsAvoided}
                        </div>
                        <div className="text-xs text-amber-600 font-medium">Conflicts Avoided</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-red-700">
                          {proposal.report.totalSkipped}
                        </div>
                        <div className="text-xs text-red-600 font-medium">Skipped</div>
                      </div>
                    </div>

                    {/* Skipped courses */}
                    {proposal.report.skippedCourses?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ Could Not Schedule</h3>
                        {proposal.report.skippedCourses.map((s, i) => (
                          <p key={i} className="text-sm text-red-700">
                            <strong>{s.name}:</strong> {s.reason}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Faculty load */}
                    {Object.keys(proposal.report.teacherLoadSummary ?? {}).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Faculty Load Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(proposal.report.teacherLoadSummary)
                            .sort(([, a], [, b]) => b - a)
                            .map(([name, count]) => (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-sm text-gray-700 w-40 truncate" title={name}>{name}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(
                                        (count /
                                          Math.max(
                                            ...Object.values(proposal.report.teacherLoadSummary)
                                          )) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-600 w-12 text-right">{count} cls</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Room usage */}
                    {Object.keys(proposal.report.roomUsageSummary ?? {}).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Room Usage</h3>
                        <div className="space-y-2">
                          {Object.entries(proposal.report.roomUsageSummary)
                            .sort(([, a], [, b]) => b - a)
                            .map(([name, count]) => (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-sm text-gray-700 w-40 truncate" title={name}>{name}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(
                                        (count /
                                          Math.max(
                                            ...Object.values(proposal.report.roomUsageSummary)
                                          )) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-600 w-12 text-right">{count} cls</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    )}

      {/* Proposals Table View */}
      {!loading && sortedProposals.length > 0 && viewMode === "table" && (
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/30">
                    {compareMode && <th className="px-6 py-3 w-10">Select</th>}
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("name")}>
                      Proposal Name {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("status")}>
                      Status {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("totalScheduled")}>
                      Scheduled {sortField === "totalScheduled" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("conflictsAvoided")}>
                      Conflicts Avoided {sortField === "conflictsAvoided" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("totalSkipped")}>
                      Skipped {sortField === "totalSkipped" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-text-muted tracking-wider cursor-pointer hover:text-text select-none" onClick={() => handleSort("createdAt")}>
                      Created At {sortField === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] uppercase font-bold text-text-muted tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedProposals.map((proposal) => {
                    const statusStyle = STATUS_BADGE[proposal.status] || STATUS_BADGE.draft;
                    const isExpanded = expandedId === proposal.id;
                    return (
                      <React.Fragment key={proposal.id}>
                        <tr 
                          className={`hover:bg-primary/5 transition-colors cursor-pointer ${isExpanded ? "bg-accent/5 font-semibold" : ""}`}
                          onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                        >
                          {compareMode && (
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedForCompare.includes(proposal.id)}
                                onChange={() => toggleCompareSelect(proposal.id)}
                                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-text">{proposal.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.className}`}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-text font-semibold">{proposal.totalScheduled} classes</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{proposal.conflictsAvoided} classes</td>
                          <td className="px-6 py-4 text-sm text-red-600 font-semibold">{proposal.totalSkipped} classes</td>
                          <td className="px-6 py-4 text-xs text-text-muted">{formatDate(proposal.createdAt)}</td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                                className="h-8 text-xs border border-border"
                              >
                                {isExpanded ? "Collapse" : "Preview"}
                              </Button>
                              {(isAdmin || isDean) && proposal.status !== "applied" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApply(proposal, "append")}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    title="Append to active timetable"
                                  >
                                    Append
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApply(proposal, "replace")}
                                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                    title="Replace active timetable"
                                  >
                                    Replace
                                  </Button>
                                </>
                              )}
                              {(isAdmin || isProgramHead) && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDelete(proposal.id)}
                                  className="h-8 text-xs text-red-600 hover:text-red-700 font-semibold border border-border"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={compareMode ? 8 : 7} className="px-6 py-4 bg-surface-alt/25">
                              <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm bg-white p-4 space-y-4">
                                <h4 className="font-bold text-stone-900 text-sm">Preview timetable proposal grid for: {proposal.name}</h4>
                                <TimetableGrid entries={getPreviewEntries(proposal)} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {sortedProposals.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-white shadow-sm rounded-3xl mt-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-surface border border-border rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-primary/30"
            >
              <option value={3}>3 proposals</option>
              <option value={5}>5 proposals</option>
              <option value={10}>10 proposals</option>
              <option value={20}>20 proposals</option>
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-text-muted">
              Page <strong className="text-text font-bold">{currentPage}</strong> of <strong className="text-text font-bold">{totalPages || 1}</strong> ({sortedProposals.length} total proposals)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-border text-xs cursor-pointer"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-3 rounded-lg border border-border text-xs cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal Overlay */}
      {showComparison && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2.5rem] border border-stone-200 overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  <Columns2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text font-source-serif">Compare Proposals</h3>
                  <p className="text-xs text-text-muted">Compare generated schedules side by side.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowComparison(false)}
                className="p-2 hover:bg-surface-alt rounded-lg text-text-muted hover:text-text transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-alt/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedForCompare.map((id) => {
                  const proposal = proposals.find((p) => p.id === id);
                  if (!proposal) return null;

                  return (
                    <Card key={proposal.id} className="border border-border/80 bg-white/80 backdrop-blur shadow-md rounded-[2rem] overflow-hidden flex flex-col h-full">
                      <CardHeader className="border-b border-border/40 bg-surface/40 p-5">
                        <div className="flex justify-between items-start">
                          <CardTitle className="font-bold text-text text-base truncate pr-2">{proposal.name}</CardTitle>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 uppercase tracking-wide ${(STATUS_BADGE[proposal.status] || STATUS_BADGE.draft).className}`}>
                            {proposal.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted font-medium mt-2">
                          <span>📅 {formatDate(proposal.createdAt)}</span>
                          <span className="text-emerald-700 font-semibold">{proposal.totalScheduled} scheduled</span>
                          {proposal.totalSkipped > 0 && <span className="text-red-600 font-semibold">{proposal.totalSkipped} skipped</span>}
                          <span>⚡ {proposal.conflictsAvoided} avoided</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-5 overflow-x-auto">
                        <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-white min-w-[500px]">
                          <TimetableGrid entries={getPreviewEntries(proposal)} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end shrink-0">
              <Button onClick={() => setShowComparison(false)} className="bg-accent hover:bg-accent/90 text-white">
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
