"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { availabilityService, TeacherAvailability } from "@/features/availability/availability.service";
import { EnhancedAvailabilityGrid } from "./EnhancedAvailabilityGrid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Check,
  AlertCircle,
  Save,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AvailabilitySubmissionViewProps {
  termId: string;
  academicYear: string;
  semester: string;
  minHoursRequired?: number;
}

type ViewState = "editing" | "review" | "submitting" | "success";

export function AvailabilitySubmissionView({
  termId,
  academicYear,
  semester,
  minHoursRequired = 12,
}: AvailabilitySubmissionViewProps) {
  const { profile } = useAuth();
  const [viewState, setViewState] = useState<ViewState>("editing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<TeacherAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing availability
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = availabilityService.subscribeTeacherAvailability(
      profile.id,
      termId,
      (data) => {
        if (data) {
          setAvailability(data);
        } else {
          // Create new availability with default slots
          const defaultSlots = availabilityService.generateDefaultSlots();
          setAvailability({
            teacherId: profile.id,
            termId,
            academicYear,
            semester,
            slots: defaultSlots,
            lastUpdated: new Date(),
            minHoursRequired,
          });
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.id, termId, academicYear, semester, minHoursRequired]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-surface-alt rounded-2xl" />
        <div className="h-96 bg-surface-alt rounded-2xl" />
      </div>
    );
  }

  if (!availability || !profile) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
        <p>Unable to load availability. Please try again.</p>
      </div>
    );
  }

  const validation = availabilityService.validateAvailability(availability, minHoursRequired);
  const availableHours = availabilityService.calculateAvailableHours(availability.slots);

  const handleSlotsChange = (newSlots: typeof availability.slots) => {
    setAvailability({ ...availability, slots: newSlots });
    setError(null);
  };

  const handleReview = () => {
    if (!validation.valid) {
      setError(validation.errors.join("; "));
      return;
    }
    setViewState("review");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    const result = await availabilityService.submitAvailability(availability, profile);

    if (result.success) {
      setSuccessMessage(
        `Availability submitted successfully for ${semester} Semester, ${academicYear}`
      );
      setViewState("success");
      setAvailability(result.data || availability);

      // Show success for 3 seconds, then reset
      setTimeout(() => {
        setViewState("editing");
        setSuccessMessage(null);
      }, 3000);
    } else {
      setError(result.error || "Failed to submit availability");
      setViewState("review");
    }

    setSaving(false);
  };

  const handleDownloadCSV = () => {
    const csv = availabilityService.exportAsCSV(availability);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `availability-${termId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    const defaultSlots = availabilityService.generateDefaultSlots();
    setAvailability({
      ...availability,
      slots: defaultSlots,
    });
    setViewState("editing");
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text font-source-serif">
            Availability Submission
          </h1>
          <p className="text-text-muted mt-1">
            Specify your preferred and available teaching hours for {semester} Semester, {academicYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 py-1.5 px-3"
          >
            <Calendar className="h-3.5 w-3.5" />
            {semester} Semester
          </Badge>
        </div>
      </div>

      {/* Editing State */}
      {viewState === "editing" && (
        <>
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-text-muted">Hours Available</span>
                  </div>
                  <p className="text-3xl font-bold text-text">{availableHours.toFixed(1)}h</p>
                  <p className="text-xs text-text-muted">
                    {availableHours >= minHoursRequired ? (
                      <span className="text-emerald-600 font-medium">✓ Minimum met ({minHoursRequired}h)</span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        {minHoursRequired - availableHours} more hours needed
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-text-muted">Preferred Slots</span>
                  </div>
                  <p className="text-3xl font-bold text-text">
                    {availability.slots.filter((s) => s.status === "preferred").length}
                  </p>
                  <p className="text-xs text-text-muted">Times you prefer most</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-text-muted">Available Slots</span>
                  </div>
                  <p className="text-3xl font-bold text-text">
                    {availability.slots.filter((s) => s.status === "available").length}
                  </p>
                  <p className="text-xs text-text-muted">Additional options</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-surface-alt/30 border-b border-border/50">
              <CardTitle className="text-lg">Your Availability Grid</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <EnhancedAvailabilityGrid
                slots={availability.slots}
                onSlotsChange={handleSlotsChange}
                showStats={true}
              />
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="border-border/50 shadow-sm bg-primary/5 border-dashed">
            <CardContent className="pt-6 space-y-3">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Mark your availability</p>
                  <p className="text-xs text-text-muted">Click slots to cycle: Unavailable → Available → Preferred</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Meet minimum hours</p>
                  <p className="text-xs text-text-muted">Select at least {minHoursRequired} hours of availability</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Submit your preferences</p>
                  <p className="text-xs text-text-muted">Review and submit for scheduling consideration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-900">Validation Error</p>
                <p className="text-xs text-rose-800 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleDownloadCSV}
              variant="secondary"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleReview}
              className="gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              Review & Submit
            </Button>
          </div>
        </>
      )}

      {/* Review State */}
      {viewState === "review" && (
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-surface-alt/30">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Review Your Submission</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50">
                    <span className="text-sm text-text">Total Available Hours</span>
                    <span className="text-lg font-bold text-primary">{availableHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50">
                    <span className="text-sm text-text">Preferred Slots</span>
                    <span className="text-lg font-bold text-text">
                      {availability.slots.filter((s) => s.status === "preferred").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50">
                    <span className="text-sm text-text">Available Slots</span>
                    <span className="text-lg font-bold text-text">
                      {availability.slots.filter((s) => s.status === "available").length}
                    </span>
                  </div>
                </div>
              </div>

              {validation.warnings.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 uppercase mb-2">Warnings</p>
                  <ul className="space-y-1">
                    {validation.warnings.map((warn, idx) => (
                      <li key={idx} className="text-xs text-amber-800">• {warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Grid */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-surface-alt/30 border-b border-border/50">
              <CardTitle className="text-lg">Availability Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <EnhancedAvailabilityGrid
                slots={availability.slots}
                onSlotsChange={() => {}}
                readOnly={true}
                showStats={false}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setViewState("editing")}
              variant="secondary"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Submitting..." : "Submit Availability"}
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {viewState === "success" && successMessage && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in zoom-in-50 duration-300">
          <Check className="h-12 w-12 text-emerald-600 mx-auto" />
          <div>
            <p className="text-lg font-bold text-emerald-900">Submitted Successfully!</p>
            <p className="text-sm text-emerald-800 mt-1">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
