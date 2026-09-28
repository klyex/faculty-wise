export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface Section {
  id: string;
  name: string;
  yearLevel: number;
  programId: string;
}

export interface DepartmentFilter {
  departmentId?: string;
  programId?: string;
  sectionId?: string;
}
