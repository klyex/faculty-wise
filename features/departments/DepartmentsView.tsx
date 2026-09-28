"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, Plus, AlertTriangle, BookOpen } from "lucide-react";
import { Department } from "@/lib/types/department.types";
import { User } from "@/lib/types/firestore.types";
import { departmentsService } from "@/features/departments/departments.service";
import { programsService } from "@/features/programs/programs.service";
import { AddEditDepartmentModal } from "@/features/departments/components/AddEditDepartmentModal";
import { DepartmentCard } from "@/features/departments/components/DepartmentCard";
import { AddEditProgramModal } from "@/features/programs/components/AddEditProgramModal";
import { ProgramCard } from "@/features/programs/components/ProgramCard";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

export function DepartmentsView() {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const toast = useToast();
  const [teachers, setTeachers] = useState<Record<string, User>>({});

  // Department modal state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | undefined>();

  // Program modal state
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<any | undefined>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedInstitute, setSelectedInstitute] = useState("all");
  const [deptDeleteConfirm, setDeptDeleteConfirm] = useState<string | null>(null);
  const [programDeleteConfirm, setProgramDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Compute unique institutes list
  const institutesList = React.useMemo(() => {
    const list = departments.map((d) => d.institute).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [departments]);

  // Filter departments based on selected institute
  const filteredDepartments = React.useMemo(() => {
    if (selectedInstitute === "all") return departments;
    return departments.filter((d) => d.institute === selectedInstitute);
  }, [departments, selectedInstitute]);

  useEffect(() => {
    // Subscribe to departments
    const unsubscribeDepts = departmentsService.subscribeDepartments((data) => {
      setDepartments(data);
    });

    // Subscribe to programs
    const unsubscribePrograms = programsService.subscribePrograms((data) => {
      setPrograms(data);
      setLoading(false);
    });

    // Load teachers
    const loadTeachers = async () => {
      try {
        const teachersData = await departmentsService.getTeachers();
        const teachersMap: Record<string, User> = {};
        teachersData.forEach((teacher) => {
          teachersMap[teacher.id] = teacher;
        });
        setTeachers(teachersMap);
      } catch (err) {
        console.error("Error loading teachers:", err);
      }
    };
    loadTeachers();

    return () => {
      unsubscribeDepts();
      unsubscribePrograms();
    };
  }, []);

  // Department handlers
  const handleAddDeptClick = () => {
    setDepartmentToEdit(undefined);
    setIsDeptModalOpen(true);
  };

  const handleEditDeptClick = (dept: Department) => {
    setDepartmentToEdit(dept);
    setIsDeptModalOpen(true);
  };

  const handleDeleteDeptClick = async (dept: Department) => {
    setDeleting(true);
    try {
      await departmentsService.deleteDepartment(dept.id, profile || undefined);
      setDeptDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting department:", err);
      toast.error("Deletion Failed", "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  // Program handlers
  const handleAddProgramClick = () => {
    setProgramToEdit(undefined);
    setSelectedDepartmentId(departments.length > 0 ? departments[0].id : "");
    setIsProgramModalOpen(true);
  };

  const handleEditProgramClick = (program: any) => {
    setProgramToEdit(program);
    setSelectedDepartmentId(program.departmentId);
    setIsProgramModalOpen(true);
  };

  const handleDeleteProgramClick = async (program: any) => {
    setDeleting(true);
    try {
      await programsService.deleteProgram(program.id, profile || undefined);
      setProgramDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting program:", err);
      toast.error("Deletion Failed", "Failed to delete program.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeptModalClose = () => {
    setIsDeptModalOpen(false);
    setDepartmentToEdit(undefined);
  };

  const handleProgramModalClose = () => {
    setIsProgramModalOpen(false);
    setProgramToEdit(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Department Management Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Department Management
          </CardTitle>
          <Button
            onClick={handleAddDeptClick}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-surface-alt/50 animate-pulse"
                />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <Building2 className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted mb-4">No departments created yet</p>
              <Button onClick={handleAddDeptClick} variant="secondary">
                Create First Department
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Institute Filter */}
              <div className="flex items-center gap-2 p-3 bg-surface-alt/30 border border-border/50 rounded-xl max-w-xs">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Filter by Institute</span>
                <select
                  value={selectedInstitute}
                  onChange={(e) => setSelectedInstitute(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-text outline-none cursor-pointer flex-1"
                >
                  <option value="all">All Institutes</option>
                  {institutesList.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {filteredDepartments.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
                  <p className="text-text-muted">No departments found in {selectedInstitute}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDepartments.map((dept) => (
                    <div key={dept.id} className="relative">
                      {deptDeleteConfirm === dept.id && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                          <div className="bg-white rounded-xl p-4 shadow-lg w-full mx-2">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <h4 className="font-semibold text-text">Delete Department?</h4>
                            </div>
                            <p className="text-sm text-text-muted mb-4">
                              This will permanently delete the department "{dept.name}". This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="flex-1 h-9"
                                onClick={() => setDeptDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                className="flex-1 h-9 bg-red-600 hover:bg-red-700"
                                disabled={deleting}
                                onClick={() => handleDeleteDeptClick(dept)}
                              >
                                {deleting ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <DepartmentCard
                        department={dept}
                        chairName={
                          dept.chairUid && teachers[dept.chairUid]
                            ? (() => {
                                const t = teachers[dept.chairUid];
                                const name = t.displayName || (t as any).name || (t as any).fullName;
                                return name ? `${name} (${t.email})` : t.email;
                              })()
                            : undefined
                        }
                        isAdmin={true}
                        onEdit={handleEditDeptClick}
                        onDelete={(d) => setDeptDeleteConfirm(d.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Management Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Program Management
          </CardTitle>
          <Button
            onClick={handleAddProgramClick}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Program
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {departments.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Filter by Department</label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-surface-alt/50 animate-pulse"
                />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <BookOpen className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted mb-4">No programs created yet</p>
              <Button onClick={handleAddProgramClick} variant="secondary">
                Create First Program
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedDepartmentId
                ? programs.filter((p) => p.departmentId === selectedDepartmentId)
                : programs
              ).map((program) => (
                <div key={program.id} className="relative">
                  {programDeleteConfirm === program.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                      <div className="bg-white rounded-xl p-4 shadow-lg w-full mx-2">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-text">Delete Program?</h4>
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          This will permanently delete the program "{program.name}". This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 h-9"
                            onClick={() => setProgramDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 h-9 bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                            onClick={() => handleDeleteProgramClick(program)}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <ProgramCard
                    program={program}
                    departmentName={
                      departments.find((d) => d.id === program.departmentId)?.name
                    }
                    isAdmin={true}
                    onEdit={handleEditProgramClick}
                    onDelete={(p) => setProgramDeleteConfirm(p.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEditDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={handleDeptModalClose}
        departmentToEdit={departmentToEdit}
      />

      <AddEditProgramModal
        isOpen={isProgramModalOpen}
        onClose={handleProgramModalClose}
        programToEdit={programToEdit}
        departments={departments}
      />
    </div>
  );
}

export default DepartmentsView;
