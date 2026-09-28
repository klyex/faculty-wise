export interface Department {
  id: string;
  code: string;
  name: string;
  institute?: string; // e.g. Institute of Computing, Institute of Arts & Sciences
  chairUid: string | null;
  chairName?: string; // for display
  createdAt?: any; // Firestore Timestamp
}

export interface DepartmentFilter {
  search?: string;
  institute?: string;
}
