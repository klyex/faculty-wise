export type CourseCategory = "major" | "minor" | "general" | "elective";

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  units: number;
  lectureHours: number;
  labHours: number;
  category: CourseCategory;
  departmentId: string; // reference to Department ID
  department?: string; // department name for display
}

export interface CourseFilter {
  search?: string;
  category?: CourseCategory;
  departmentId?: string;
  institute?: string;
}
