"use client";

import React, { useState, useEffect } from "react";
import { Term } from "@/lib/types/section-term.types";
import { courseOfferingsService } from "../course-offerings.service";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User } from "@/lib/types/firestore.types";
import {
  X,
  Copy,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FileStack,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyOfferingsModalProps {
  targetTermId: string;
  targetTermLabel: string;
  allTerms: Term[];
  onClose: () => void;
  onComplete: (result: { copied: number; skipped: number }) => void;
  performingUser?: User;
}

export function CopyOfferingsModal({
  targetTermId,
  targetTermLabel,
  allTerms,
  onClose,
  onComplete,
  performingUser,
}: CopyOfferingsModalProps) {
  const [sourceTermId, setSourceTermId] = useState("");
  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{
    willCopy: number;
    willSkip: number;
  } | null>(null);
  const [copying, setCopying] = useState(false);
  const [result, setResult] = useState<{
    copied: number;
    skipped: number;
  } | null>(null);

  // Available source terms — exclude the target term
  const sourceTerms = allTerms.filter((t) => t.id !== targetTermId);

  // Group source terms by academic year for the dropdown
  const groupedTerms = sourceTerms.reduce<Record<string, Term[]>>(
    (groups, term) => {
      const key = term.academicYear || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(term);
      return groups;
    },
    {}
  );
  const sortedYears = Object.keys(groupedTerms).sort().reverse();

  // When source term changes, compute preview
  useEffect(() => {
    if (!sourceTermId) {
      setPreview(null);
      setSourceCount(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    (async () => {
      try {
        const sourceOfferings =
          await courseOfferingsService.getOfferingsByTerm(sourceTermId);
        const targetOfferings =
          await courseOfferingsService.getOfferingsByTerm(targetTermId);

        if (cancelled) return;

        setSourceCount(sourceOfferings.length);

        const existingKeys = new Set(
          targetOfferings.map(
            (o) => `${o.courseId}__${o.sectionId || ""}`
          )
        );

        const willCopy = sourceOfferings.filter(
          (o) =>
            !existingKeys.has(`${o.courseId}__${o.sectionId || ""}`)
        ).length;
        const willSkip = sourceOfferings.length - willCopy;

        setPreview({ willCopy, willSkip });
      } catch (err) {
        console.error("Preview error:", err);
        setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceTermId, targetTermId]);

  const handleCopy = async () => {
    if (!sourceTermId || !preview || preview.willCopy === 0) return;

    setCopying(true);
    try {
      const res = await courseOfferingsService.copyOfferingsFromTerm(
        sourceTermId,
        targetTermId,
        performingUser
      );
      setResult(res);
      onComplete(res);
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setCopying(false);
    }
  };

  const getTermLabel = (term: Term) =>
    `${term.semester} Semester — AY ${term.academicYear}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-300">
        <Card className="w-full max-w-lg overflow-hidden flex flex-col border border-border bg-white shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface-alt/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">
                  Copy from Previous Term
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Duplicate offerings into{" "}
                  <strong className="text-primary">{targetTermLabel}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-all text-text-muted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {result ? (
              /* Success State */
              <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">
                    Copy Complete
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Successfully copied{" "}
                    <strong className="text-emerald-700">
                      {result.copied}
                    </strong>{" "}
                    offering{result.copied !== 1 ? "s" : ""} as drafts.
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-xs text-amber-600 mt-1.5 font-medium">
                      {result.skipped} duplicate
                      {result.skipped !== 1 ? "s" : ""} skipped (already
                      existed).
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Source Term Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Select Source Term
                  </label>
                  <select
                    value={sourceTermId}
                    onChange={(e) => setSourceTermId(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text font-medium"
                  >
                    <option value="">
                      -- Choose a term to copy from --
                    </option>
                    {sortedYears.map((year) => (
                      <optgroup key={year} label={`AY ${year}`}>
                        {groupedTerms[year]
                          .sort((a, b) => {
                            const order: Record<string, number> = {
                              "1st": 1,
                              "2nd": 2,
                              Summer: 3,
                            };
                            return (
                              (order[a.semester] || 9) -
                              (order[b.semester] || 9)
                            );
                          })
                          .map((term) => (
                            <option key={term.id} value={term.id}>
                              {term.semester} Semester
                              {term.isCurrent ? " (Current)" : ""}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Preview Panel */}
                {sourceTermId && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-8 gap-3 text-text-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">
                          Analyzing offerings...
                        </span>
                      </div>
                    ) : preview ? (
                      <div className="space-y-4">
                        {/* Visual Transfer Diagram */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-alt/50 border border-border/50">
                          <div className="flex-1 text-center">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">
                              Source
                            </div>
                            <div className="text-2xl font-bold text-text">
                              {sourceCount}
                            </div>
                            <div className="text-[10px] text-text-muted">
                              offering{sourceCount !== 1 ? "s" : ""}
                            </div>
                          </div>

                          <ArrowRight className="h-5 w-5 text-primary shrink-0" />

                          <div className="flex-1 text-center">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mb-1">
                              Will Copy
                            </div>
                            <div className="text-2xl font-bold text-emerald-700">
                              {preview.willCopy}
                            </div>
                            <div className="text-[10px] text-emerald-600">
                              new draft{preview.willCopy !== 1 ? "s" : ""}
                            </div>
                          </div>

                          {preview.willSkip > 0 && (
                            <div className="flex-1 text-center">
                              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600 mb-1">
                                Skipping
                              </div>
                              <div className="text-2xl font-bold text-amber-600">
                                {preview.willSkip}
                              </div>
                              <div className="text-[10px] text-amber-500">
                                duplicate{preview.willSkip !== 1 ? "s" : ""}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Warnings */}
                        {preview.willCopy === 0 && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              All offerings from the source term already
                              exist in the target. Nothing to copy.
                            </span>
                          </div>
                        )}

                        {sourceCount === 0 && (
                          <div className="bg-surface-alt border border-border rounded-2xl p-4 text-xs font-medium text-text-muted flex items-start gap-2.5">
                            <FileStack className="w-4 h-4 mt-0.5 shrink-0 text-text-muted" />
                            <span>
                              The selected source term has no offerings to
                              copy.
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/50 bg-surface-alt/30 flex items-center justify-end gap-3 shrink-0">
            {result ? (
              <Button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary hover:bg-primary-strong text-white text-sm font-semibold rounded-xl"
              >
                Done
              </Button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  type="button"
                  className="px-5 py-2.5 border border-border rounded-xl hover:bg-stone-50 transition-all text-sm font-semibold text-text"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleCopy}
                  disabled={
                    !sourceTermId ||
                    copying ||
                    !preview ||
                    preview.willCopy === 0
                  }
                  className="px-6 py-2.5 bg-primary hover:bg-primary-strong disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl gap-2"
                >
                  {copying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Offerings
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
