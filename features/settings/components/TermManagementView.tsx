"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus, Pencil, Trash2, Star, X, AlertTriangle } from "lucide-react";
import { Term } from "@/lib/types/section-term.types";
import { termsService } from "@/features/sections/sections.service";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

const SEMESTER_OPTIONS = ["1st", "2nd", "Summer"];

function formatDate(date: any): string {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
    return isNaN(d.getTime()) ? String(date) : d.toLocaleDateString();
  } catch {
    return String(date);
  }
}

function toDateInputValue(date: any): string {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function TermManagementView() {
  const { profile } = useAuth();
  const toast = useToast();

  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termToEdit, setTermToEdit] = useState<Term | undefined>();
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("1st");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = termsService.subscribeAll((data) => {
      setTerms(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const resetForm = () => {
    setAcademicYear("");
    setSemester("1st");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
    setFormError(null);
  };

  const openAddModal = () => {
    setTermToEdit(undefined);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (term: Term) => {
    setTermToEdit(term);
    setAcademicYear(term.academicYear);
    setSemester(term.semester);
    setStartDate(toDateInputValue(term.startDate));
    setEndDate(toDateInputValue(term.endDate));
    setIsCurrent(term.isCurrent);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTermToEdit(undefined);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!academicYear.trim() || !startDate || !endDate) {
      setFormError("Academic year, start date, and end date are required.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setFormError("End date must be after start date.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (termToEdit) {
        await termsService.updateTerm(
          termToEdit.id,
          {
            academicYear: academicYear.trim(),
            semester,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent,
          },
          profile || undefined,
        );

        if (isCurrent && !termToEdit.isCurrent) {
          await termsService.setCurrentTerm(
            { ...termToEdit, academicYear: academicYear.trim(), semester, isCurrent: true },
            profile || undefined,
          );
        }

        toast.success("Term Updated", `Updated ${academicYear.trim()} — ${semester}.`);
      } else {
        const newTerm = await termsService.createTerm(
          {
            academicYear: academicYear.trim(),
            semester,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent: false,
          },
          profile || undefined,
        );

        if (isCurrent) {
          await termsService.setCurrentTerm(
            { ...newTerm, isCurrent: true },
            profile || undefined,
          );
        }

        toast.success("Term Created", `Created ${academicYear.trim()} — ${semester}.`);
      }

      closeModal();
    } catch (err) {
      console.error("Error saving term:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save term.");
      toast.error("Save Failed", "An error occurred while saving the term.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (termId: string) => {
    setDeleting(true);
    try {
      await termsService.deleteTerm(termId, profile || undefined);
      setDeleteConfirmId(null);
      toast.success("Term Deleted", "The term has been permanently deleted.");
    } catch (err) {
      console.error("Error deleting term:", err);
      toast.error("Deletion Failed", "Failed to delete the term.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetCurrent = async (term: Term) => {
    try {
      await termsService.setCurrentTerm(term, profile || undefined);
      toast.success("Current Term Updated", `${term.academicYear} — ${term.semester} is now the current term.`);
    } catch (err) {
      console.error("Error setting current term:", err);
      toast.error("Update Failed", "Failed to set the current term.");
    }
  };

  return (
    <><Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Term Management
        </CardTitle>
        <Button onClick={openAddModal} className="h-9 gap-2">
          <Plus className="h-4 w-4" />
          Add Term
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-alt/50 animate-pulse" />
            ))}
          </div>
        ) : terms.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
            <Calendar className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted mb-4">No academic terms created yet</p>
            <Button onClick={openAddModal} variant="secondary">
              Create First Term
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Academic Year</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Semester</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} className="border-b border-border/30 hover:bg-surface-alt/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-text">{term.academicYear}</td>
                    <td className="py-3 px-4 text-text">{term.semester}</td>
                    <td className="py-3 px-4 text-text-muted">{formatDate(term.startDate)}</td>
                    <td className="py-3 px-4 text-text-muted">{formatDate(term.endDate)}</td>
                    <td className="py-3 px-4">
                      {term.isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <Star className="h-3 w-3 fill-current" />
                          Current
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">Not Current</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSetCurrent(term)}
                          disabled={term.isCurrent}
                          title={term.isCurrent ? "Already current term" : "Set as current term"}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                            term.isCurrent
                              ? "text-emerald-400 cursor-not-allowed"
                              : "text-text-muted hover:text-amber-600 hover:bg-amber-50"
                          }`}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(term)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(term.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Delete Confirmation Modal */}
    {deleteConfirmId && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-sm border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <h4 className="font-semibold text-text">Delete Term?</h4>
            </div>
            <p className="text-sm text-text-muted mb-6">
              This will permanently delete this academic term. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 h-10"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 h-10 bg-red-600 hover:bg-red-700"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Add/Edit Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-md border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {termToEdit ? "Edit Term" : "Add New Term"}
            </CardTitle>
            <button
              onClick={closeModal}
              className="h-8 w-8 rounded-lg hover:bg-surface transition-colors flex items-center justify-center"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g., 2025-2026"
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                >
                  {SEMESTER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/50 border border-border/50 cursor-pointer hover:bg-surface-alt transition-colors">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text">Set as current term</span>
              </label>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-lg h-10"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-lg h-10"
                  disabled={saving}
                >
                  {saving ? "Saving..." : termToEdit ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}

export default TermManagementView;
