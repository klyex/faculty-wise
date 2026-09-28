"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Layers, Calendar, Plus, AlertTriangle } from "lucide-react";
import { Section, Term } from "@/lib/types/section-term.types";
import { User } from "@/lib/types/firestore.types";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { sectionsService, termsService } from "@/features/sections/sections.service";
import { programsService } from "@/features/programs/programs.service";
import { departmentsService } from "@/features/departments/departments.service";
import { AddEditSectionModal } from "@/features/sections/components/AddEditSectionModal";
import { SectionCard } from "@/features/sections/components/SectionCard";
import { AddEditTermModal } from "@/features/sections/components/AddEditTermModal";
import { TermCard } from "@/features/sections/components/TermCard";

export function SectionsView() {
  const { profile } = useAuth();
  const toast = useToast();
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teachers, setTeachers] = useState<Record<string, User>>({});

  // Section modal state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | undefined>();
  
  // Filter States
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState("all");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [selectedProgramId, setSelectedProgramId] = useState("all");

  // Term modal state
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [termToEdit, setTermToEdit] = useState<Term | undefined>();

  // UI state
  const [loading, setLoading] = useState(true);
  const [sectionDeleteConfirm, setSectionDeleteConfirm] = useState<string | null>(null);
  const [termDeleteConfirm, setTermDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Subscribe to programs
    const unsubscribePrograms = programsService.subscribePrograms((data) => {
      setPrograms(data);
    });

    // Subscribe to departments
    const unsubscribeDepts = departmentsService.subscribeDepartments((data) => {
      setDepartments(data);
    });

    // Subscribe to sections
    const unsubscribeSections = sectionsService.subscribeAll((data) => {
      setSections(data);
      setLoading(false);
      
      // Reload teachers when sections change to ensure advisor names are available
      const reloadTeachers = async () => {
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
      reloadTeachers();
    });

    // Subscribe to terms
    const unsubscribeTerms = termsService.subscribeAll((data) => {
      setTerms(data);
    });

    return () => {
      unsubscribePrograms();
      unsubscribeDepts();
      unsubscribeSections();
      unsubscribeTerms();
    };
  }, []);

  // Section handlers
  const handleAddSectionClick = () => {
    setSectionToEdit(undefined);
    setIsSectionModalOpen(true);
  };

  const handleEditSectionClick = (section: Section) => {
    setSectionToEdit(section);
    setIsSectionModalOpen(true);
  };

  const handleDeleteSectionClick = async (section: Section) => {
    setDeleting(true);
    try {
      await sectionsService.deleteSection(section.id, profile || undefined);
      setSectionDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting section:", err);
      toast.error("Deletion Failed", "Failed to delete section.");
    } finally {
      setDeleting(false);
    }
  };

  // Term handlers
  const handleAddTermClick = () => {
    setTermToEdit(undefined);
    setIsTermModalOpen(true);
  };

  const handleEditTermClick = (term: Term) => {
    setTermToEdit(term);
    setIsTermModalOpen(true);
  };

  const handleDeleteTermClick = async (term: Term) => {
    setDeleting(true);
    try {
      await termsService.deleteTerm(term.id, profile || undefined);
      setTermDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting term:", err);
      toast.error("Deletion Failed", "Failed to delete term.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSectionModalClose = () => {
    setIsSectionModalOpen(false);
    setSectionToEdit(undefined);
  };

  const handleTermModalClose = () => {
    setIsTermModalOpen(false);
    setTermToEdit(undefined);
  };

  // Compute unique institutes from departments
  const institutesList = React.useMemo(() => {
    const list = departments.map((d) => d.institute).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [departments]);

  // Filtered departments based on selected institute
  const filteredDepartments = React.useMemo(() => {
    if (selectedInstitute === "all") return departments;
    return departments.filter((d) => d.institute === selectedInstitute);
  }, [departments, selectedInstitute]);

  // Filtered programs based on cascading selection
  const filteredPrograms = React.useMemo(() => {
    let result = programs;
    if (selectedDepartmentId !== "all") {
      result = result.filter((p) => p.departmentId === selectedDepartmentId);
    } else if (selectedInstitute !== "all") {
      const deptIds = new Set(
        departments
          .filter((d) => d.institute === selectedInstitute)
          .map((d) => d.id)
      );
      result = result.filter((p) => deptIds.has(p.departmentId));
    }
    return result;
  }, [programs, selectedDepartmentId, selectedInstitute, departments]);

  // Filtered sections based on cascading selection
  const filteredSections = React.useMemo(() => {
    if (selectedProgramId && selectedProgramId !== "all") {
      return sections.filter((s) => s.programId === selectedProgramId);
    }
    // Filter by whatever programs are currently filtered
    const progIds = new Set(filteredPrograms.map((p) => p.id));
    return sections.filter((s) => progIds.has(s.programId));
  }, [sections, selectedProgramId, filteredPrograms]);

  // Resolve active program ID for section creation
  const activeProgramId = React.useMemo(() => {
    if (selectedProgramId && selectedProgramId !== "all") {
      return selectedProgramId;
    }
    return filteredPrograms.length > 0 ? filteredPrograms[0].id : "";
  }, [selectedProgramId, filteredPrograms]);

  return (
    <div className="space-y-6">
      {/* Sections Management Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Section Management
          </CardTitle>
          <Button
            onClick={handleAddSectionClick}
            className="h-9 gap-2"
            disabled={!activeProgramId}
          >
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-alt/20 p-4 border border-border/50 rounded-2xl">
              {/* Institute Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-0.5">Institute</label>
                <select
                  value={selectedInstitute}
                  onChange={(e) => {
                    setSelectedInstitute(e.target.value);
                    setSelectedDepartmentId("all");
                    setSelectedProgramId("all");
                  }}
                  className="w-full h-10 px-3 bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Institutes</option>
                  {institutesList.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-0.5">Department</label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedProgramId("all");
                  }}
                  className="w-full h-10 px-3 bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {filteredDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-0.5">Program</label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Programs</option>
                  {filteredPrograms.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              You must create at least one Program in the Departments tab before you can add or manage sections.
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
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <Layers className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted mb-4">
                {programs.length > 0 
                  ? "No sections created for this program yet" 
                  : "Create a program first to get started"}
              </p>
              {programs.length > 0 && (
                <Button onClick={handleAddSectionClick} variant="secondary">
                  Create First Section
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSections.map((section) => (
                <div key={section.id} className="relative">
                  {sectionDeleteConfirm === section.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                      <div className="bg-white rounded-xl p-4 shadow-lg w-full mx-2">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-text">Delete Section?</h4>
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          This will permanently delete the section "{section.name}". This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 h-9"
                            onClick={() => setSectionDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 h-9 bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                            onClick={() => handleDeleteSectionClick(section)}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <SectionCard
                    section={section}
                    advisorName={
                      section.advisorUid && teachers[section.advisorUid]
                        ? (() => {
                            const t = teachers[section.advisorUid];
                            const name = t.displayName || (t as any).name || (t as any).fullName;
                            return name ? `${name} (${t.email})` : t.email;
                          })()
                        : undefined
                    }
                    isAdmin={true}
                    onEdit={handleEditSectionClick}
                    onDelete={(s) => setSectionDeleteConfirm(s.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Terms Management Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Academic Terms Manager
          </CardTitle>
          <Button
            onClick={handleAddTermClick}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Term
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-surface-alt/50 animate-pulse"
                />
              ))}
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-surface/50">
              <Calendar className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted mb-4">No academic terms created yet</p>
              <Button onClick={handleAddTermClick} variant="secondary">
                Create First Term
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {terms.map((term) => (
                <div key={term.id} className="relative">
                  {termDeleteConfirm === term.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                      <div className="bg-white rounded-xl p-4 shadow-lg w-full mx-2">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-text">Delete Term?</h4>
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          This will permanently delete the term "{term.academicYear} {term.semester}". This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 h-9"
                            onClick={() => setTermDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 h-9 bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                            onClick={() => handleDeleteTermClick(term)}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <TermCard
                    term={term}
                    isAdmin={true}
                    onEdit={handleEditTermClick}
                    onDelete={(t) => setTermDeleteConfirm(t.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEditSectionModal
        isOpen={isSectionModalOpen}
        onClose={handleSectionModalClose}
        programId={activeProgramId}
        sectionToEdit={sectionToEdit}
      />

      <AddEditTermModal
        isOpen={isTermModalOpen}
        onClose={handleTermModalClose}
        termToEdit={termToEdit}
      />
    </div>
  );
}

export default SectionsView;
