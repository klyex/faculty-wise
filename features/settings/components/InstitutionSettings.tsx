"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, Calendar, Globe, Bell, Upload, CheckCircle2 } from "lucide-react";
import { InstitutionSettings as InstitutionSettingsType } from "@/lib/types/institution.types";
import { ImportSummary } from "@/lib/types/data-import.types";
import { institutionService } from "@/features/settings/institution.service";
import { dataImportService } from "@/features/data-import/data-import.service";
import { DataImportModal } from "@/features/data-import/components/DataImportModal";
import { useAuth } from "@/lib/context/AuthContext";
import { BackupManager } from "@/features/backups/components/BackupManager";

export function InstitutionSettings() {
  const { profile } = useAuth();

  // Institution settings state
  const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettingsType | null>(null);
  const [institutionFormData, setInstitutionFormData] = useState({
    institutionName: "",
    currentAcademicYear: "",
    systemLocale: "en-US",
    systemNotificationsEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to institution settings
    const unsubscribeSettings = institutionService.subscribeSettings((settings) => {
      setInstitutionSettings(settings);
      setInstitutionFormData({
        institutionName: settings.institutionName,
        currentAcademicYear: settings.currentAcademicYear,
        systemLocale: settings.systemLocale,
        systemNotificationsEnabled: settings.systemNotificationsEnabled,
      });
    });

    return () => {
      unsubscribeSettings();
    };
  }, []);

  const handleImportSuccess = (summary: ImportSummary) => {
    setImportSuccessMessage(
      `Successfully imported ${summary.successCount} records. ${summary.failureCount > 0 ? `${summary.failureCount} records failed.` : ""}`
    );
    setIsImportModalOpen(false);
    setTimeout(() => setImportSuccessMessage(null), 5000);
  };

  // Institution settings handlers
  const downloadAllTemplates = (format: "csv" | "json") => {
    const types: ("users" | "courses" | "rooms")[] = ["users", "courses", "rooms"];
    types.forEach((type) => {
      try {
        const content = format === "csv" 
          ? dataImportService.getTemplateCSV(type) 
          : dataImportService.getTemplateJSON(type);
        const blob = new Blob([content], { 
          type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;" 
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${type}_template.${format}`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error(`Failed to download ${type} template:`, err);
      }
    });
  };

  const handleUpdateInstitutionSettings = async () => {
    if (!profile) return;

    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      await institutionService.updateSettings(
        {
          institutionName: institutionFormData.institutionName,
          currentAcademicYear: institutionFormData.currentAcademicYear,
          systemLocale: institutionFormData.systemLocale,
          systemNotificationsEnabled: institutionFormData.systemNotificationsEnabled,
        },
        profile
      );
      setSettingsMessage("Institution settings updated successfully");
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update institution settings:", error);
      setSettingsMessage("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Institution Details Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Institution Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {settingsMessage && (
            <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${
              settingsMessage.includes("success") 
                ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                : "bg-red-50 border-red-200 text-red-900"
            }`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{settingsMessage}</span>
            </div>
          )}

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Institution Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input 
                  type="text" 
                  value={institutionFormData.institutionName}
                  onChange={(e) => setInstitutionFormData({ ...institutionFormData, institutionName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Academic Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input 
                    type="text" 
                    value={institutionFormData.currentAcademicYear}
                    onChange={(e) => setInstitutionFormData({ ...institutionFormData, currentAcademicYear: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">System Locale</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <select 
                    value={institutionFormData.systemLocale}
                    onChange={(e) => setInstitutionFormData({ ...institutionFormData, systemLocale: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="fil-PH">Filipino (Philippines)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text">System Notifications</span>
              </div>
              <button
                onClick={() => setInstitutionFormData({ 
                  ...institutionFormData, 
                  systemNotificationsEnabled: !institutionFormData.systemNotificationsEnabled 
                })}
                className={`h-5 w-10 rounded-full relative cursor-pointer transition-all ${
                  institutionFormData.systemNotificationsEnabled ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                  institutionFormData.systemNotificationsEnabled ? "right-0.5" : "left-0.5"
                }`} />
              </button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Enable automated email notifications for faculty load alerts and schedule conflicts.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleUpdateInstitutionSettings}
              disabled={savingSettings}
              className="px-8 shadow-md"
            >
              {savingSettings ? "Saving..." : "Update Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Import Management Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-surface-alt/30 border-b border-border/50 flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Data Import
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Import faculty members, courses, and room data from CSV or JSON files. Download templates below to get started.
            </p>

            {importSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="primary"
                className="gap-2 h-12"
              >
                <Upload className="h-5 w-5" />
                Import Data
              </Button>
              <Button
                onClick={() => downloadAllTemplates("csv")}
                variant="secondary"
                className="gap-2 h-12"
              >
                Download CSV Template
              </Button>
              <Button
                onClick={() => downloadAllTemplates("json")}
                variant="secondary"
                className="gap-2 h-12"
              >
                Download JSON Template
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt/50 border border-border/50 space-y-3">
              <h4 className="font-medium text-sm text-text">Supported Entity Types</h4>
              <ul className="text-sm text-text-muted space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Faculty & Staff (users with role teacher)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Courses (with code, units, hours, category)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Rooms (with building, capacity, type, features)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <BackupManager />

      {/* Modals */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default InstitutionSettings;
