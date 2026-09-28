export interface CurriculumCourse {
  courseId: string;
  yearLevel: number;
  semester: '1st' | '2nd' | 'Summer';
  isCore: boolean;
}

export interface Curriculum {
  id: string;
  name: string;
  programId: string;
  academicYear: string;
  totalYears: number;
  courses: CurriculumCourse[];
  createdAt?: any;
}

export interface CurriculumFormData {
  name: string;
  programId: string;
  academicYear: string;
  totalYears: number;
}
