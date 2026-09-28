import { FacultyMember, LoadAssignment } from "@/lib/types/faculty-load.types";

export interface HistoricalRecord {
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  units: number;
  section: string;
}

export interface TeacherHistory {
  teacherId: string;
  teacherName: string;
  semesters: string[];
  academicYears: string[];
  coursesPerSemester: Record<string, HistoricalRecord[]>;
  allRecords: HistoricalRecord[];
  courseSummary: Record<string, { totalSemesters: number; recentSemesters: number; records: HistoricalRecord[] }>;
}

function extractSemesterLabel(assignment: LoadAssignment): string {
  return assignment.semester || "Unknown";
}

function extractAcademicYear(assignment: LoadAssignment): string {
  return assignment.academicYear || "";
}

function extractCourseId(assignment: LoadAssignment): string {
  return assignment.courseCode || assignment.courseName || "";
}

export function buildTeacherHistory(faculty: FacultyMember): TeacherHistory {
  const allRecords: HistoricalRecord[] = (faculty.assignments || [])
    .filter(a => a.courseCode || a.courseName)
    .map(a => ({
      courseId: extractCourseId(a),
      courseCode: a.courseCode || "",
      courseName: a.courseName || "",
      semester: extractSemesterLabel(a),
      academicYear: extractAcademicYear(a),
      units: a.units || 0,
      section: a.section || "A",
    }));

  const semesters = new Set<string>();
  const academicYears = new Set<string>();
  const coursesPerSemester: Record<string, HistoricalRecord[]> = {};
  const courseSummary: Record<string, { totalSemesters: number; recentSemesters: number; records: HistoricalRecord[] }> = {};

  for (const record of allRecords) {
    const semKey = record.academicYear ? `${record.academicYear} ${record.semester}` : record.semester;
    semesters.add(semKey);
    if (record.academicYear) academicYears.add(record.academicYear);

    if (!coursesPerSemester[semKey]) coursesPerSemester[semKey] = [];
    coursesPerSemester[semKey].push(record);

    const cKey = record.courseCode;
    if (!courseSummary[cKey]) {
      courseSummary[cKey] = { totalSemesters: 0, recentSemesters: 0, records: [] };
    }
    courseSummary[cKey].records.push(record);
  }

  const semesterList = Array.from(semesters).sort();
  const recentSemesters = semesterList.slice(-2);

  for (const cKey of Object.keys(courseSummary)) {
    courseSummary[cKey].totalSemesters = new Set(
      courseSummary[cKey].records.map(r => r.academicYear ? `${r.academicYear} ${r.semester}` : r.semester)
    ).size;
    courseSummary[cKey].recentSemesters = courseSummary[cKey].records.filter(r => {
      const sk = r.academicYear ? `${r.academicYear} ${r.semester}` : r.semester;
      return recentSemesters.includes(sk);
    }).length;
  }

  return {
    teacherId: faculty.id,
    teacherName: faculty.name,
    semesters: semesterList,
    academicYears: Array.from(academicYears).sort(),
    coursesPerSemester,
    allRecords,
    courseSummary,
  };
}

export function buildAllTeacherHistories(facultyList: FacultyMember[]): Map<string, TeacherHistory> {
  const map = new Map<string, TeacherHistory>();
  for (const f of facultyList) {
    map.set(f.id, buildTeacherHistory(f));
  }
  return map;
}

export function getCoursesTaughtByTeacher(
  teacherId: string,
  facultyList: FacultyMember[]
): string[] {
  const faculty = facultyList.find(f => f.id === teacherId);
  if (!faculty) return [];
  const codes = new Set<string>();
  for (const a of faculty.assignments || []) {
    if (a.courseCode) codes.add(a.courseCode);
  }
  return Array.from(codes);
}

export function getTeachersForCourse(
  courseCode: string,
  facultyList: FacultyMember[]
): { teacher: FacultyMember; totalSemesters: number; lastTaught: string | null }[] {
  const results: { teacher: FacultyMember; totalSemesters: number; lastTaught: string | null }[] = [];
  for (const f of facultyList) {
    const matching = (f.assignments || []).filter(a => a.courseCode === courseCode);
    if (matching.length > 0) {
      const semesters = new Set(matching.map(a => a.semester || "Unknown").filter(Boolean));
      const sortedSems = Array.from(semesters).sort();
      results.push({
        teacher: f,
        totalSemesters: semesters.size,
        lastTaught: sortedSems[sortedSems.length - 1] || null,
      });
    }
  }
  results.sort((a, b) => b.totalSemesters - a.totalSemesters);
  return results;
}

export function computeHistoricalScore(
  courseCode: string,
  faculty: FacultyMember
): number {
  const history = buildTeacherHistory(faculty);
  const summary = history.courseSummary[courseCode];
  if (!summary || summary.totalSemesters === 0) return 0;

  const recencyBonus = summary.recentSemesters / Math.max(summary.totalSemesters, 1);
  const frequencyScore = Math.min(summary.totalSemesters / 4, 1);
  return Math.round((recencyBonus * 0.6 + frequencyScore * 0.4) * 100) / 100;
}

export function getHistoricalSummaryForDisplay(
  facultyList: FacultyMember[]
): { teacherName: string; courses: { code: string; name: string; semesters: string[] }[] }[] {
  return facultyList.map(f => {
    const history = buildTeacherHistory(f);
    const courses = Object.entries(history.courseSummary).map(([code, summary]) => ({
      code,
      name: summary.records[0]?.courseName || code,
      semesters: Array.from(new Set(summary.records.map(r => r.academicYear ? `${r.academicYear} ${r.semester}` : r.semester))),
    }));
    courses.sort((a, b) => b.semesters.length - a.semesters.length);
    return { teacherName: f.name, courses };
  });
}
