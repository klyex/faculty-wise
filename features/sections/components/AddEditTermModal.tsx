"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Term } from "@/lib/types/section-term.types";
import { termsService } from "../sections.service";

interface AddEditTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  termToEdit?: Term;
  onSuccess?: () => void;
}

export function AddEditTermModal({
  isOpen,
  onClose,
  termToEdit,
  onSuccess,
}: AddEditTermModalProps) {
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("1st");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (termToEdit) {
      setAcademicYear(termToEdit.academicYear);
      setSemester(termToEdit.semester);
      setIsCurrent(termToEdit.isCurrent);
      // Convert date to input format if needed
      if (termToEdit.startDate) {
        const startStr = termToEdit.startDate instanceof Date
          ? termToEdit.startDate.toISOString().split("T")[0]
          : new Date(termToEdit.startDate).toISOString().split("T")[0];
        setStartDate(startStr);
      }
      if (termToEdit.endDate) {
        const endStr = termToEdit.endDate instanceof Date
          ? termToEdit.endDate.toISOString().split("T")[0]
          : new Date(termToEdit.endDate).toISOString().split("T")[0];
        setEndDate(endStr);
      }
    } else {
      setAcademicYear("");
      setSemester("1st");
      setStartDate("");
      setEndDate("");
      setIsCurrent(false);
    }
  }, [isOpen, termToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!academicYear.trim() || !startDate || !endDate) {
      setError("Academic year, start date, and end date are required");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("Start date must be before end date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        academicYear,
        semester,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent,
      };

      if (termToEdit) {
        await termsService.updateTerm(termToEdit.id, data);
      } else {
        await termsService.createTerm(data);
      }

      setAcademicYear("");
      setSemester("1st");
      setStartDate("");
      setEndDate("");
      setIsCurrent(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error saving term:", err);
      setError(err instanceof Error ? err.message : "Failed to save term");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {termToEdit ? "Edit Term" : "Add New Term"}
          </CardTitle>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-surface transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
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
              <label className="text-sm font-medium text-text-muted">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <input
                type="checkbox"
                id="isCurrent"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label
                htmlFor="isCurrent"
                className="text-sm font-medium text-text cursor-pointer flex-1"
              >
                Set as Current Term
              </label>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 rounded-lg h-10"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg h-10"
                disabled={loading}
              >
                {loading ? "Saving..." : termToEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
