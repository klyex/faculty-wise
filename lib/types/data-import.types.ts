import { User } from "./firestore.types";
import { Course } from "./course.types";
import { Room } from "./room.types";

export type ImportEntityType = "users" | "courses" | "rooms";
export type ImportFormat = "csv" | "json";

// Import request data
export interface ImportableUser extends Omit<User, "id" | "createdAt" | "updatedAt"> {
  id?: string; // Optional, auto-generated if not provided
}

export interface ImportableCourse extends Omit<Course, "id" | "departmentId"> {
  id?: string; // Optional, auto-generated if not provided
  departmentId?: string; // Optional, defaults based on department name
}

export interface ImportableRoom extends Omit<Room, "id"> {
  id?: string; // Optional, auto-generated if not provided
}

// Import result tracking
export interface ImportResult {
  success: boolean;
  rowIndex: number;
  entity: ImportableUser | ImportableCourse | ImportableRoom | null;
  error?: string;
}

export interface ImportSummary {
  type: ImportEntityType;
  totalRows: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  results: ImportResult[];
}

// Preview data structure
export interface ImportPreviewData {
  type: ImportEntityType;
  totalRows: number;
  rows: Array<{
    rowIndex: number;
    originalData: Record<string, any>;
    parsed: ImportableUser | ImportableCourse | ImportableRoom | null;
    errors: string[];
  }>;
  columnHeaders: string[];
}

// File upload validation
export interface FileUploadValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Column mapping configuration
export interface ColumnMapping {
  [csvColumnName: string]: string; // maps CSV column to schema field
}

export interface ImportConfig {
  entityType: ImportEntityType;
  format: ImportFormat;
  hasHeader: boolean;
  columnMapping?: ColumnMapping;
  skipValidation?: boolean;
  dryRun?: boolean;
}

// CSV Parser options
export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

// Import statistics
export interface ImportStatistics {
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  successRate: number;
}
