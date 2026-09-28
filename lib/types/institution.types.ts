export interface InstitutionSettings {
  id: string; // Always "default" - singleton pattern
  institutionName: string;
  currentAcademicYear: string;
  systemLocale: string; // e.g., "en-US", "fil-PH"
  systemNotificationsEnabled: boolean;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  createdBy?: string; // UID of user who created
}
