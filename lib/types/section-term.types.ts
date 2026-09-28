export interface Section {
  id: string;
  programId: string;
  name: string; // e.g., BSCS-3A
  yearLevel: number; // 1, 2, 3, 4
  studentCount: number;
  advisorUid: string | null;
  targets?: {
    minUnits?: number;
    maxUnits?: number;
  };
  createdAt?: any; // Firestore Timestamp
}

export interface Term {
  id: string;
  academicYear: string; // e.g., "2025-2026"
  semester: string; // e.g., "1st", "2nd", "Summer"
  startDate: any; // Firestore Timestamp or Date
  endDate: any; // Firestore Timestamp or Date
  isCurrent: boolean;
  createdAt?: any;
}

export interface SectionFilter {
  programId?: string;
  yearLevel?: number;
}
