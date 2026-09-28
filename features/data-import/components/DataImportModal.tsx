"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ImportConfig,
  ImportEntityType,
  ImportPreviewData,
  ImportSummary,
} from "@/lib/types/data-import.types";
import { dataImportService } from "../data-import.service";

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: ImportEntityType;
  onSuccess?: (summary: ImportSummary) => void;
}

type ModalStep = "upload" | "preview" | "results";

export function DataImportModal({
  isOpen,
  onClose,
  entityType = "users",
  onSuccess,
}: DataImportModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<ModalStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [hasHeader, setHasHeader] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [results, setResults] = useState<ImportSummary | null>(null);
  const [selectedType, setSelectedType] = useState<ImportEntityType>(entityType);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setWarning(null);
    setSelectedFile(file);

    // Detect format from file extension
    if (file.name.endsWith(".csv")) {
      setFormat("csv");
    } else if (file.name.endsWith(".json")) {
      setFormat("json");
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const config: ImportConfig = {
        entityType: selectedType,
        format,
        hasHeader,
      };

      const previewData = await dataImportService.generatePreview(
        selectedFile,
        config
      );
      setPreview(previewData);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: ImportConfig = {
        entityType: selectedType,
        format,
        hasHeader,
      };

      const summary = await dataImportService.executeImport(
        selectedFile,
        config,
        profile || undefined
      );
      setResults(summary);
      setStep("results");
      onSuccess?.(summary);
    } catch (err: any) {
      setError(err.message || "Failed to import data");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = (fileFormat: "csv" | "json") => {
    try {
      if (fileFormat === "csv") {
        const csv = dataImportService.getTemplateCSV(selectedType);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${selectedType}_template.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const json = dataImportService.getTemplateJSON(selectedType);
        const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${selectedType}_template.json`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to download template:", err);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setFormat("csv");
    setHasHeader(true);
    setError(null);
    setWarning(null);
    setPreview(null);
    setResults(null);
  };

  if (!isOpen) return null;

  const entityLabels = {
    users: "Faculty & Staff",
    courses: "Courses",
    rooms: "Rooms",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-surface rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-alt/50 border-b border-border/50 backdrop-blur-sm p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text">Import Data</h2>
            <p className="text-text-muted mt-1">
              {step === "upload" && "Select a file to begin import"}
              {step === "preview" && "Review data before importing"}
              {step === "results" && "Import completed"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Entity Type Selection */}
              <div>
                <label className="text-sm font-medium text-text-muted px-1 block mb-3">
                  Select entity type to import
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["users", "courses", "rooms"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-4 rounded-xl border-2 transition-all text-center font-medium ${
                        selectedType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface-alt hover:border-border/80"
                      }`}
                    >
                      {entityLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="text-sm font-medium text-text-muted px-1 block mb-3">
                  File format
                </label>
                <div className="flex gap-3">
                  {(["csv", "json"] as const).map((fmt) => (
                    <label
                      key={fmt}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        borderColor: format === fmt ? "var(--color-primary)" : "var(--color-border)",
                        backgroundColor:
                          format === fmt ? "var(--color-primary-10)" : "var(--color-surface-alt)",
                      }}
                    >
                      <input
                        type="radio"
                        value={fmt}
                        checked={format === fmt}
                        onChange={(e) => setFormat(e.target.value as "csv" | "json")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-text uppercase">
                        {fmt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CSV Options */}
              {format === "csv" && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-alt/50 border border-border/50">
                  <input
                    type="checkbox"
                    id="hasHeader"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label
                    htmlFor="hasHeader"
                    className="text-sm text-text-muted cursor-pointer"
                  >
                    First row contains column headers
                  </label>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium text-text-muted px-1 block mb-3">
                  Upload file
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept={format === "csv" ? ".csv,.txt" : ".json"}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer bg-surface-alt/30"
                  >
                    <Upload className="h-8 w-8 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {format === "csv" ? "CSV or TXT files" : "JSON files"} up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {/* Template Download */}
              <div>
                <label className="text-sm font-medium text-text-muted px-1 block mb-3">
                  Or download a template to get started
                </label>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadTemplate("csv")}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV Template
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadTemplate("json")}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    JSON Template
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {warning && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{warning}</span>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Total Rows
                  </p>
                  <p className="text-2xl font-bold text-text mt-2">
                    {preview.totalRows}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Valid
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    {preview.rows.filter((r) => r.errors.length === 0).length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Errors
                  </p>
                  <p className="text-2xl font-bold text-rose-600 mt-2">
                    {preview.rows.filter((r) => r.errors.length > 0).length}
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text">Preview (first 10 rows)</h3>
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-alt/50 border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted w-12">
                          Row
                        </th>
                        {preview.columnHeaders.map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted"
                          >
                            {header}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted w-12">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {preview.rows.map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-surface-alt/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-text-muted font-mono">
                            {row.rowIndex}
                          </td>
                          {preview.columnHeaders.map((header) => (
                            <td
                              key={header}
                              className="px-4 py-3 text-xs text-text truncate max-w-xs"
                            >
                              {String(row.originalData[header] || "")}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right">
                            {row.errors.length === 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Error Details */}
                {preview.rows.some((r) => r.errors.length > 0) && (
                  <Card className="bg-rose-50 border border-rose-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-rose-900">
                        Errors Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {preview.rows
                        .filter((r) => r.errors.length > 0)
                        .map((row) => (
                          <div key={row.rowIndex} className="text-sm text-rose-800">
                            <p className="font-medium">Row {row.rowIndex}:</p>
                            <ul className="list-disc list-inside ml-2">
                              {row.errors.map((err, idx) => (
                                <li key={idx} className="text-xs">
                                  {err}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Results Step */}
          {step === "results" && results && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    Import completed successfully!
                  </h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    {results.successCount} records imported out of{" "}
                    {results.totalRows}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-text mt-2">
                    {results.totalRows}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-xs text-emerald-700 uppercase tracking-wider font-bold">
                    Success
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    {results.successCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-xs text-rose-700 uppercase tracking-wider font-bold">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-rose-600 mt-2">
                    {results.failureCount}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50">
                <p className="text-sm text-text-muted mb-3">Success Rate</p>
                <div className="w-full bg-surface-alt rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all"
                    style={{
                      width: `${Math.round(
                        (results.successCount / results.totalRows) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {Math.round((results.successCount / results.totalRows) * 100)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-alt/50 border-t border-border/50 backdrop-blur-sm p-6 flex gap-3 justify-end">
          {step === "upload" && (
            <>
              <Button variant="secondary" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!selectedFile || loading}
                className="gap-2 rounded-xl"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Preview
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="secondary"
                onClick={() => setStep("upload")}
                className="rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || preview?.rows.some((r) => r.errors.length > 0)}
                className="gap-2 rounded-xl"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Import
              </Button>
            </>
          )}

          {step === "results" && (
            <>
              <Button
                variant="secondary"
                onClick={handleReset}
                className="rounded-xl"
              >
                Import Another File
              </Button>
              <Button onClick={onClose} className="rounded-xl">
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
