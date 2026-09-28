"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CourseOfferingWithCourse } from "@/lib/types/offering.types";
import { Term } from "@/lib/types/section-term.types";
import { Course } from "@/lib/types/course.types";
import { courseOfferingsService } from "./course-offerings.service";
import { coursesService } from "../courses/courses.service";
import { termsService } from "../sections/sections.service";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/context/AuthContext";
import { AddOfferingModal } from "./components/AddOfferingModal";
import { CopyOfferingsModal } from "./components/CopyOfferingsModal";
import { OfferingsList } from "./components/OfferingsList";
import {
  Calendar,
  Plus,
  Upload,
  AlertCircle,
  CheckCircle,
  Copy,
  Loader2,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewState = "default" | "publishing";

// Semester display order for sorting
const SEMESTER_ORDER: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  Summer: 3,
};

export default function CourseOfferingsView() {
  const { user, profile } = useAuth();

  // Dynamic term data from Firestore / mockData
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const [offerings, setOfferings] = useState<CourseOfferingWithCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
    totalUnits: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("default");
  const [successMessage, setSuccessMessage] = useState("");

  // Subscribe to terms from Firestore / mockData
  useEffect(() => {
    setTermsLoading(true);
    const unsubscribe = termsService.subscribeAll((data) => {
      setAllTerms(data);

      // Auto-select the current term, or the first term if none is current
      if (!selectedTermId || !data.find((t) => t.id === selectedTermId)) {
        const currentTerm = data.find((t) => t.isCurrent);
        if (currentTerm) {
          setSelectedTermId(currentTerm.id);
        } else if (data.length > 0) {
          setSelectedTermId(data[0].id);
        }
      }

      setTermsLoading(false);
    });

    return unsubscribe;
  }, []);

  const selectedTerm = allTerms.find((t) => t.id === selectedTermId);

  // Group terms by academic year for the selector UI
  const termsByYear = useMemo(() => {
    const groups: Record<string, Term[]> = {};
    allTerms.forEach((term) => {
      const key = term.academicYear || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(term);
    });

    // Sort semesters within each year
    Object.values(groups).forEach((terms) =>
      terms.sort(
        (a, b) =>
          (SEMESTER_ORDER[a.semester] || 9) -
          (SEMESTER_ORDER[b.semester] || 9)
      )
    );

    // Sort years descending (most recent first)
    const sortedYears = Object.keys(groups).sort().reverse();
    return sortedYears.map((year) => ({
      year,
      terms: groups[year],
    }));
  }, [allTerms]);

  // Subscribe to offerings for the selected term
  useEffect(() => {
    if (!selectedTermId) return;

    const unsubscribe = courseOfferingsService.subscribeOfferingsByTerm(
      selectedTermId,
      (data) => {
        setOfferings(data);
      }
    );

    return unsubscribe;
  }, [selectedTermId]);

  // Subscribe to courses
  useEffect(() => {
    const unsubscribe = coursesService.subscribeCourses((courses) => {
      setAllCourses(courses);
    });

    return unsubscribe;
  }, []);

  // Update stats when offerings change
  useEffect(() => {
    const updateStats = async () => {
      if (!selectedTermId) return;
      const newStats =
        await courseOfferingsService.getOfferingStats(selectedTermId);
      setStats(newStats);
    };
    updateStats();
  }, [offerings, selectedTermId]);

  const handleAddOffering = async (
    courseId: string,
    assignedUnits: number,
    sectionId: string,
    programId: string,
    notes?: string
  ) => {
    if (!profile) return;

    try {
      await courseOfferingsService.createOffering(
        {
          courseId,
          termId: selectedTermId,
          sectionId,
          programId,
          assignedUnits,
          status: "draft",
          notes,
        },
        profile
      );
      setShowAddModal(false);
      setSuccessMessage("Course offering added successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to create offering:", error);
    }
  };

  const handlePublishOfferings = async () => {
    if (!profile || stats.draft === 0) return;

    setViewState("publishing");
    try {
      await courseOfferingsService.publishOfferingsForTerm(
        selectedTermId,
        profile
      );
      setViewState("default");
      setSuccessMessage(`Published ${stats.draft} course offerings`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to publish offerings:", error);
      setViewState("default");
    }
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!profile) return;

    try {
      await courseOfferingsService.deleteOffering(offeringId, profile);
      setSuccessMessage("Course offering removed");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to delete offering:", error);
    }
  };

  const handleExportCSV = () => {
    const csv = courseOfferingsService.exportAsCSV(offerings);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `course-offerings-${selectedTermId}.csv`;
    a.click();
  };

  const handleCopyComplete = (result: {
    copied: number;
    skipped: number;
  }) => {
    setShowCopyModal(false);
    if (result.copied > 0) {
      setSuccessMessage(
        `Copied ${result.copied} offering${result.copied !== 1 ? "s" : ""} as drafts${
          result.skipped > 0
            ? ` (${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""} skipped)`
            : ""
        }`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const getTermLabel = (term: Term) =>
    `${term.semester} Semester — AY ${term.academicYear}`;

  if (termsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-muted text-sm font-medium">
          Loading academic terms...
        </p>
      </div>
    );
  }

  if (allTerms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
            Course Offerings
          </h1>
          <p className="text-text-muted mt-2">
            Define which courses are offered in each term before scheduling
            starts.
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-text mb-2">
              No Academic Terms Found
            </h3>
            <p className="text-text-muted mb-4 max-w-md mx-auto">
              Create academic terms (1st Semester, 2nd Semester, Summer) in
              the{" "}
              <strong className="text-primary">Sections &amp; Terms</strong>{" "}
              page before managing course offerings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
          Course Offerings
        </h1>
        <p className="text-text-muted mt-2">
          Define which courses are offered in this term before scheduling
          starts. Offerings lock once published.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Academic Year & Term Selector */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-text-muted">
          Select Academic Term
        </label>
        <div className="space-y-3">
          {termsByYear.map(({ year, terms }) => (
            <div key={year} className="space-y-2">
              {/* Academic Year Label */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  AY {year}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Semester Buttons */}
              <div className="flex flex-wrap gap-3">
                {terms.map((term) => {
                  const isSelected = selectedTermId === term.id;
                  const isSummer = term.semester === "Summer";

                  return (
                    <button
                      key={term.id}
                      onClick={() => setSelectedTermId(term.id)}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm cursor-pointer relative",
                        isSelected
                          ? "border-primary bg-primary text-white shadow-md"
                          : "border-border text-text hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isSummer ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                        {term.semester}
                        {term.semester !== "Summer" ? " Semester" : " Term"}
                      </span>
                      {term.isCurrent && (
                        <span
                          className={cn(
                            "absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            isSelected
                              ? "bg-white text-primary"
                              : "bg-primary text-white"
                          )}
                        >
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-text-muted text-sm font-medium mb-1">
                Total
              </p>
              <p className="text-3xl font-bold text-text">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-text-muted text-sm font-medium mb-1">
                Draft
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.draft}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-text-muted text-sm font-medium mb-1">
                Published
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {stats.published}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-text-muted text-sm font-medium mb-1">
                Archived
              </p>
              <p className="text-3xl font-bold text-gray-600">
                {stats.archived}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-text-muted text-sm font-medium mb-1">
                Total Units
              </p>
              <p className="text-3xl font-bold text-primary">
                {stats.totalUnits}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Course Offering
        </Button>

        {allTerms.length > 1 && (
          <Button
            onClick={() => setShowCopyModal(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy from Previous Term
          </Button>
        )}

        {stats.draft > 0 && (
          <Button
            onClick={handlePublishOfferings}
            disabled={viewState === "publishing"}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {viewState === "publishing"
              ? "Publishing..."
              : `Publish (${stats.draft})`}
          </Button>
        )}

        {offerings.length > 0 && (
          <Button onClick={handleExportCSV} variant="secondary">
            Export CSV
          </Button>
        )}
      </div>

      {/* No Offerings State */}
      {offerings.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-text mb-2">
              No courses offered yet
            </h3>
            <p className="text-text-muted mb-4">
              Add courses to define what's available in{" "}
              {selectedTerm
                ? `${selectedTerm.semester} ${selectedTerm.academicYear}`
                : "this term"}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add First Course
              </Button>
              {allTerms.length > 1 && (
                <Button
                  onClick={() => setShowCopyModal(true)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy from Previous Term
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offerings List */}
      {offerings.length > 0 && (
        <OfferingsList
          offerings={offerings}
          onDelete={handleDeleteOffering}
          onStatusChange={async (offeringId, newStatus) => {
            if (!profile) return;
            try {
              await courseOfferingsService.updateOffering(
                offeringId,
                { status: newStatus },
                profile
              );
            } catch (error) {
              console.error("Failed to update offering:", error);
            }
          }}
        />
      )}

      {/* Add Offering Modal */}
      {showAddModal && (
        <AddOfferingModal
          termId={selectedTermId}
          allCourses={allCourses}
          existingOfferings={offerings}
          onAdd={handleAddOffering}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Copy Offerings Modal */}
      {showCopyModal && selectedTerm && (
        <CopyOfferingsModal
          targetTermId={selectedTermId}
          targetTermLabel={getTermLabel(selectedTerm)}
          allTerms={allTerms}
          performingUser={profile || undefined}
          onClose={() => setShowCopyModal(false)}
          onComplete={handleCopyComplete}
        />
      )}
    </div>
  );
}
