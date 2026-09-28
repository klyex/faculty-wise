"use client";

import React, { useState, useEffect } from "react";
import { X, Code, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Program } from "@/lib/types/department-schedule.types";
import { Department } from "@/lib/types/department.types";
import { programsService } from "../programs.service";

interface AddEditProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programToEdit?: Program;
  departments: Department[];
  onSuccess?: () => void;
}

export function AddEditProgramModal({
  isOpen,
  onClose,
  programToEdit,
  departments,
  onSuccess,
}: AddEditProgramModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Pre-fill form if editing
    if (programToEdit) {
      setCode(programToEdit.code);
      setName(programToEdit.name);
      setDepartmentId(programToEdit.departmentId);
    } else {
      setCode("");
      setName("");
      setDepartmentId(departments.length > 0 ? departments[0].id : "");
    }
  }, [isOpen, programToEdit, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim() || !departmentId) {
      setError("Program code, name, and department are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (programToEdit) {
        // Update existing program
        await programsService.updateProgram(programToEdit.id, {
          code,
          name,
          departmentId,
        });
      } else {
        // Create new program
        await programsService.createProgram({
          code,
          name,
          departmentId,
        });
      }

      setCode("");
      setName("");
      setDepartmentId("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error saving program:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save program"
      );
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
            <BookOpen className="h-5 w-5 text-primary" />
            {programToEdit ? "Edit Program" : "Add New Program"}
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
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Code className="h-3.5 w-3.5" />
                Program Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., BSCS, BSIT"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Program Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., BS Computer Science"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Saving..." : programToEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
