export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'student' | 'program_head' | 'dean' | 'vpaa';
  status: 'active' | 'inactive';
  departmentId: string | null;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  photoURL?: string | null;
}

// Schedule collection schema
export interface Schedule {
  id: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  courseName?: string;
  courseCode?: string;
  room?: string;
  building?: string;
  isOnline?: boolean;
  date?: any; // Firestore Timestamp or Date
}

// Course collection schema
export interface Course {
  id: string;
  name: string;
  code?: string;
  department: string;
  credits: number;
  units?: number;
  capacity: number;
  studentCount?: number;
}

// Room collection schema
export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'lecture' | 'laboratory' | 'seminar';
  building: string;
}

// Audit Log collection schema
export interface AuditLog {
  id: string;
  timestamp: any; // Firestore Timestamp
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  targetId: string;
  targetType: string;
  details: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}

export type AuditAction = 
  | 'USER_CREATE'
  | 'USER_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'USER_STATUS_CHANGE'
  | 'SCHEDULE_PUBLISH'
  | 'DATA_IMPORT'
  | 'SETTINGS_UPDATE';
