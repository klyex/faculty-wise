import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { InstitutionSettings } from "@/lib/types/institution.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "../audit/audit.service";

// Singleton ID for institution settings
const INSTITUTION_DOC_ID = "default";

export const institutionService = {
  /**
   * Subscribe to real-time institution settings updates
   */
  subscribeSettings(
    onUpdate: (settings: InstitutionSettings) => void
  ): () => void {
    const db = getDb();
    const settingsRef = doc(db, "institutionSettings", INSTITUTION_DOC_ID);

    return onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate({
            id: snapshot.id,
            institutionName: data.institutionName || "FacultyWise University",
            currentAcademicYear: data.currentAcademicYear || "",
            systemLocale: data.systemLocale || "en-US",
            systemNotificationsEnabled: data.systemNotificationsEnabled ?? true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
          } as InstitutionSettings);
        } else {
          const defaults: InstitutionSettings = {
            id: INSTITUTION_DOC_ID,
            institutionName: "FacultyWise University",
            currentAcademicYear: "",
            systemLocale: "en-US",
            systemNotificationsEnabled: true,
          };
          onUpdate(defaults);
        }
      },
      (error) => {
        console.error("Error subscribing to institution settings:", error);
      }
    );
  },

  /**
   * Fetch current institution settings (one-time read)
   */
  async getSettings(): Promise<InstitutionSettings> {
    const db = getDb();
    const settingsRef = doc(db, "institutionSettings", INSTITUTION_DOC_ID);
    const snapshot = await getDoc(settingsRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        institutionName: data.institutionName || "FacultyWise University",
        currentAcademicYear: data.currentAcademicYear || "",
        systemLocale: data.systemLocale || "en-US",
        systemNotificationsEnabled: data.systemNotificationsEnabled ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
      } as InstitutionSettings;
    }

    // Return defaults if not found
    return {
      id: INSTITUTION_DOC_ID,
      institutionName: "FacultyWise University",
      currentAcademicYear: "",
      systemLocale: "en-US",
      systemNotificationsEnabled: true,
    };
  },

  /**
   * Update institution settings
   */
  async updateSettings(
    data: Partial<Omit<InstitutionSettings, "id" | "createdAt" | "updatedAt" | "createdBy">>,
    performingUser?: User
  ): Promise<void> {
    const db = getDb();
    try {
      const settingsRef = doc(db, "institutionSettings", INSTITUTION_DOC_ID);
      const snapshot = await getDoc(settingsRef);

      if (!snapshot.exists()) {
        // Create if doesn't exist
        // Filter out undefined values
        const documentData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: performingUser?.id,
        };
        // Remove undefined fields
        Object.keys(documentData).forEach(
          (key) => documentData[key as keyof typeof documentData] === undefined && delete documentData[key as keyof typeof documentData]
        );
        await setDoc(settingsRef, documentData);
      } else {
        // Update existing
        const documentData = {
          ...data,
          updatedAt: serverTimestamp(),
        };
        // Remove undefined fields
        Object.keys(documentData).forEach(
          (key) => documentData[key as keyof typeof documentData] === undefined && delete documentData[key as keyof typeof documentData]
        );
        await updateDoc(settingsRef, documentData);
      }

      // Log audit entry
      if (performingUser) {
        await auditService.logAction({
          action: "SETTINGS_UPDATE",
          targetId: INSTITUTION_DOC_ID,
          targetType: "institutionSettings",
          details: Object.keys(data).reduce((acc, key) => {
            acc[key] = data[key as keyof typeof data];
            return acc;
          }, {} as Record<string, any>),
          performedBy: performingUser,
        });
      }
    } catch (error) {
      console.error("Failed to update institution settings:", error);
      throw error;
    }
  },
};
