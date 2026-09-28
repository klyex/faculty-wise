export type OfferingStatus = "draft" | "published" | "archived";

export interface CourseOffering {
  id: string;
  courseId: string;
  termId: string;
  sectionId?: string; // Optional: specific section this is offered to
  programId?: string; // Optional: specific academic program this belongs to
  maxSlots?: number; // Optional: max enrollment
  assignedUnits: number; // Units assigned for this offering
  status: OfferingStatus;
  notes?: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  createdBy?: string; // UID of admin who created
}

export interface CourseOfferingWithCourse extends CourseOffering {
  courseName: string;
  courseCode: string;
  courseLectureHours: number;
  courseLabHours: number;
  courseUnits: number;
  sectionName?: string;
  programCode?: string;
}

export interface OfferingFilter {
  termId?: string;
  sectionId?: string;
  status?: OfferingStatus;
  courseId?: string;
}
