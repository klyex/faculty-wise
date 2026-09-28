import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  ImportableUser,
  ImportableCourse,
  ImportableRoom,
  ImportFormat,
  ImportEntityType,
  ImportResult,
  ImportSummary,
  ImportPreviewData,
  CSVParseOptions,
  ImportConfig,
  FileUploadValidation,
} from "@/lib/types/data-import.types";
import { User } from "@/lib/types/firestore.types";
import { auditService } from "@/features/audit/audit.service";

// Simple CSV parser
function parseCSV(content: string, options: CSVParseOptions = {}): string[][] {
  const delimiter = options.delimiter || ",";
  const lines = content.split("\n").filter((line) => {
    if (options.skipEmptyLines !== false) {
      return line.trim() !== "";
    }
    return true;
  });

  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  });
}

// Parse JSON from string
function parseJSON(content: string): any[] {
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    throw new Error("Invalid JSON format");
  }
}

// Validate user data
function validateUserData(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email) errors.push("Email is required");
  if (!data.displayName) errors.push("Display name is required");
  if (!["admin", "teacher", "student"].includes(data.role)) {
    errors.push(
      `Invalid role: ${data.role}. Must be 'admin', 'teacher', or 'student'`
    );
  }
  if (!["active", "inactive"].includes(data.status || "active")) {
    errors.push("Invalid status. Must be 'active' or 'inactive'");
  }

  return { valid: errors.length === 0, errors };
}

// Validate course data
function validateCourseData(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.code) errors.push("Course code is required");
  if (!data.name) errors.push("Course name is required");
  if (!data.department) errors.push("Department is required");
  if (typeof data.units !== "number" || data.units <= 0) {
    errors.push("Units must be a positive number");
  }
  if (typeof data.lectureHours !== "number" || data.lectureHours < 0) {
    errors.push("Lecture hours must be a non-negative number");
  }
  if (typeof data.labHours !== "number" || data.labHours < 0) {
    errors.push("Lab hours must be a non-negative number");
  }
  if (!["major", "minor", "general", "elective"].includes(data.category || "major")) {
    errors.push("Invalid category. Must be 'major', 'minor', 'general', or 'elective'");
  }

  return { valid: errors.length === 0, errors };
}

// Validate room data
function validateRoomData(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name) errors.push("Room name is required");
  if (!data.building) errors.push("Building is required");
  if (typeof data.floor !== "number" || data.floor < 1) {
    errors.push("Floor must be a positive number");
  }
  if (typeof data.capacity !== "number" || data.capacity <= 0) {
    errors.push("Capacity must be a positive number");
  }
  if (!["lecture", "laboratory", "seminar", "auditorium"].includes(data.type || "lecture")) {
    errors.push("Invalid room type");
  }
  if (!["available", "occupied", "maintenance"].includes(data.status || "available")) {
    errors.push("Invalid room status");
  }

  return { valid: errors.length === 0, errors };
}

// Convert CSV row to object
function csvRowToObject(headers: string[], row: string[]): Record<string, any> {
  const obj: Record<string, any> = {};
  headers.forEach((header, index) => {
    const value = row[index] || "";
    // Try to parse as number or boolean
    if (value === "") {
      obj[header] = null;
    } else if (value.toLowerCase() === "true") {
      obj[header] = true;
    } else if (value.toLowerCase() === "false") {
      obj[header] = false;
    } else if (!isNaN(Number(value))) {
      obj[header] = Number(value);
    } else {
      obj[header] = value;
    }
  });
  return obj;
}

export const dataImportService = {
  /**
   * Validate file upload
   */
  validateFile(file: File): FileUploadValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!file) {
      errors.push("No file selected");
      return { valid: false, errors, warnings };
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    const validTypes = [
      "text/csv",
      "application/json",
      "text/plain",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      warnings.push(
        `Unusual file type: ${file.type}. Expected CSV or JSON.`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  /**
   * Parse file content
   */
  async parseFile(file: File, config: ImportConfig): Promise<any[]> {
    const content = await file.text();

    if (config.format === "json") {
      return parseJSON(content);
    } else {
      // Parse CSV
      const rows = parseCSV(content, {
        hasHeader: config.hasHeader,
        skipEmptyLines: true,
      });

      if (rows.length === 0) {
        throw new Error("File is empty");
      }

      let dataRows = rows;
      let headers: string[] = [];

      if (config.hasHeader && rows.length > 0) {
        headers = rows[0];
        dataRows = rows.slice(1);
      } else if (!config.hasHeader && rows.length > 0) {
        // Generate default headers
        headers = Array.from({ length: rows[0].length }, (_, i) => `Column ${i + 1}`);
      }

      return dataRows.map((row) => csvRowToObject(headers, row));
    }
  },

  /**
   * Generate import preview
   */
  async generatePreview(
    file: File,
    config: ImportConfig,
    maxRows: number = 10
  ): Promise<ImportPreviewData> {
    const fileValidation = this.validateFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errors.join(", "));
    }

    const rawData = await this.parseFile(file, config);
    const preview: ImportPreviewData = {
      type: config.entityType,
      totalRows: rawData.length,
      rows: [],
      columnHeaders: rawData.length > 0 ? Object.keys(rawData[0]) : [],
    };

    const validator =
      config.entityType === "users"
        ? validateUserData
        : config.entityType === "courses"
          ? validateCourseData
          : validateRoomData;

    for (let i = 0; i < Math.min(rawData.length, maxRows); i++) {
      const row = rawData[i];
      const validation = validator(row);

      preview.rows.push({
        rowIndex: i + 1,
        originalData: row,
        parsed: validation.valid ? row : null,
        errors: validation.errors,
      });
    }

    return preview;
  },

  /**
   * Process and validate import data
   */
  async validateImportData(
    file: File,
    config: ImportConfig
  ): Promise<{ results: ImportResult[]; summary: ImportSummary }> {
    const fileValidation = this.validateFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errors.join(", "));
    }

    const rawData = await this.parseFile(file, config);
    const results: ImportResult[] = [];

    const validator =
      config.entityType === "users"
        ? validateUserData
        : config.entityType === "courses"
          ? validateCourseData
          : validateRoomData;

    rawData.forEach((row, index) => {
      const validation = validator(row);

      if (validation.valid) {
        results.push({
          success: true,
          rowIndex: index + 1,
          entity: row,
        });
      } else {
        results.push({
          success: false,
          rowIndex: index + 1,
          entity: null,
          error: validation.errors.join("; "),
        });
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    const summary: ImportSummary = {
      type: config.entityType,
      totalRows: rawData.length,
      successCount,
      failureCount,
      skippedCount: 0,
      results,
    };

    return { results, summary };
  },

  /**
   * Execute import to Firestore or mockData
   */
  async executeImport(
    file: File,
    config: ImportConfig,
    performingUser?: User
  ): Promise<ImportSummary> {
    const fileValidation = this.validateFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errors.join(", "));
    }

    const { results, summary } = await this.validateImportData(file, config);

    // Filter out failed records
    const validResults = results.filter((r) => r.success);

    if (validResults.length === 0) {
      throw new Error("No valid records to import. Please check the file format.");
    }

    const db = getDb();
    const collectionName =
      config.entityType === "users"
        ? "users"
        : config.entityType === "courses"
          ? "courses"
          : "rooms";

    // Production: Write to Firestore
    const collectionRef = collection(db, collectionName);

    for (const result of validResults) {
      if (result.entity) {
        const { id, ...data } = result.entity as any;
        try {
          // Filter out undefined values
          const insertData = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          Object.keys(insertData).forEach(
            (key) => insertData[key as keyof typeof insertData] === undefined && delete insertData[key as keyof typeof insertData]
          );
          await addDoc(collectionRef, insertData);
        } catch (err) {
          console.error(`Failed to import row ${result.rowIndex}:`, err);
          result.success = false;
          result.error = String(err);
          summary.failureCount++;
          summary.successCount--;
        }
      }
    }

    // Log audit entry
    if (performingUser) {
      try {
        await auditService.logAction({
          action: "DATA_IMPORT",
          targetId: `import-${Date.now()}`,
          targetType: "import_batch",
          details: {
            entityType: config.entityType,
            recordsImported: summary.successCount,
            recordsFailed: summary.failureCount,
            mode: "production",
          },
          performedBy: performingUser,
        });
      } catch (err) {
        console.error("Failed to log audit entry:", err);
      }
    }

    return summary;
  },

  /**
   * Export current data as CSV
   */
  exportAsCSV(
    data: any[],
    filename: string = "export.csv"
  ): void {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          const stringValue = String(value || "");
          // Escape quotes and wrap in quotes if needed
          return stringValue.includes(",") || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export current data as JSON
   */
  exportAsJSON(
    data: any[],
    filename: string = "export.json"
  ): void {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Get template CSV for a given entity type
   */
  getTemplateCSV(entityType: ImportEntityType): string {
    const templates = {
      users: `email,displayName,role,status,departmentId
faculty1@university.edu,Dr. John Smith,teacher,active,cs-dept
faculty2@university.edu,Prof. Jane Doe,teacher,active,math-dept
student1@university.edu,Alice Johnson,student,active,cs-dept`,
      courses: `code,name,description,units,lectureHours,labHours,category,departmentId
CS-101,Introduction to Computer Science,Basic programming and logic,3,2,3,major,cs-dept
MATH-101,Calculus I,Limits and derivatives,4,4,0,major,math-dept
CS-202,Data Structures,Arrays lists and trees,3,2,3,major,cs-dept`,
      rooms: `name,building,floor,capacity,type,status,features
Lab 101,Science Building,1,30,laboratory,available,Computers;Projector;Whiteboard
LH 205,Main Building,2,100,lecture,available,Sound System;AC;Projector
SR 301,Science Building,3,20,seminar,available,Whiteboard;AC`,
    };

    return templates[entityType] || "";
  },

  /**
   * Generate JSON template
   */
  getTemplateJSON(entityType: ImportEntityType): string {
    const templates = {
      users: [
        {
          email: "faculty1@university.edu",
          displayName: "Dr. John Smith",
          role: "teacher",
          status: "active",
          departmentId: "cs-dept",
        },
        {
          email: "faculty2@university.edu",
          displayName: "Prof. Jane Doe",
          role: "teacher",
          status: "active",
          departmentId: "math-dept",
        },
      ],
      courses: [
        {
          code: "CS-101",
          name: "Introduction to Computer Science",
          description: "Basic programming and logic",
          units: 3,
          lectureHours: 2,
          labHours: 3,
          category: "major",
          departmentId: "cs-dept",
        },
        {
          code: "MATH-101",
          name: "Calculus I",
          description: "Limits and derivatives",
          units: 4,
          lectureHours: 4,
          labHours: 0,
          category: "major",
          departmentId: "math-dept",
        },
      ],
      rooms: [
        {
          name: "Lab 101",
          building: "Science Building",
          floor: 1,
          capacity: 30,
          type: "laboratory",
          status: "available",
          features: ["Computers", "Projector", "Whiteboard"],
        },
        {
          name: "LH 205",
          building: "Main Building",
          floor: 2,
          capacity: 100,
          type: "lecture",
          status: "available",
          features: ["Sound System", "AC", "Projector"],
        },
      ],
    };

    return JSON.stringify(templates[entityType] || [], null, 2);
  },
};
