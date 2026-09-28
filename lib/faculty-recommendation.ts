import { FacultyMember } from "@/lib/types/faculty-load.types";
import { computeHistoricalScore } from "@/lib/teaching-history";

export interface FacultyRecommendation {
  faculty: FacultyMember;
  overallScore: number;
  confidence: "high" | "medium" | "low";
  breakdown: {
    expertiseMatch: number;
    eligibilityMatch: number;
    historicalMatch: number;
    departmentMatch: number;
    workloadScore: number;
  };
}

export interface RecommendationResult {
  courseId: string;
  courseCode: string;
  courseName: string;
  recommendations: FacultyRecommendation[];
}

const WEIGHTS = {
  expertiseMatch: 0.30,
  eligibilityMatch: 0.25,
  historicalMatch: 0.20,
  departmentMatch: 0.10,
  workloadScore: 0.15,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;.()\-/]+/)
    .filter(Boolean);
}

function keywordOverlap(textA: string, textB: string): number {
  const tokensA = new Set(tokenize(textA));
  const tokensB = tokenize(textB);
  if (tokensA.size === 0) return 0;
  const matches = tokensB.filter(t => tokensA.has(t));
  return Math.min(matches.length / tokensA.size, 1);
}

function computeExpertiseMatch(courseName: string, courseCode: string, faculty: FacultyMember): number {
  const courseKeywords = `${courseName} ${courseCode} ${courseName} ${courseCode}`;
  const facultyKeywords = [
    faculty.specialization || "",
    faculty.major || "",
    ...(faculty.skills || []),
    ...(faculty.certifications || []),
  ].join(" ");
  return keywordOverlap(courseKeywords, facultyKeywords);
}

function computeEligibilityMatch(courseId: string, courseCode: string, faculty: FacultyMember): number {
  const eligible = faculty.eligibleSubjects || [];
  if (eligible.includes(courseId) || eligible.includes(courseCode)) return 1;
  return 0;
}

function computeDepartmentMatch(courseDept: string, faculty: FacultyMember): number {
  const facultyDept = faculty.department || "";
  if (!courseDept || !facultyDept) return 0.5;
  const c = courseDept.toLowerCase();
  const f = facultyDept.toLowerCase();
  if (c === f) return 1;
  if (c.includes(f) || f.includes(c)) return 0.8;
  return 0;
}

function computeWorkloadScore(faculty: FacultyMember): number {
  if (faculty.targetUnits <= 0) return 0.5;
  const ratio = faculty.totalUnits / faculty.targetUnits;
  if (ratio >= 1.2) return 0;
  if (ratio >= 1.0) return 0.2;
  if (ratio >= 0.8) return 0.6;
  if (ratio >= 0.5) return 0.8;
  return 1;
}

function getConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export function getRecommendationsForCourse(
  courseId: string,
  courseCode: string,
  courseName: string,
  courseDepartment: string,
  facultyList: FacultyMember[]
): FacultyRecommendation[] {
  const scored: FacultyRecommendation[] = facultyList
    .filter(f => f.id)
    .map(f => {
      const expertiseMatch = computeExpertiseMatch(courseName, courseCode, f);
      const eligibilityMatch = computeEligibilityMatch(courseId, courseCode, f);
      const historicalMatch = computeHistoricalScore(courseCode, f);
      const departmentMatch = computeDepartmentMatch(courseDepartment, f);
      const workloadScore = computeWorkloadScore(f);

      const overallScore = Math.round(
        (expertiseMatch * WEIGHTS.expertiseMatch +
          eligibilityMatch * WEIGHTS.eligibilityMatch +
          historicalMatch * WEIGHTS.historicalMatch +
          departmentMatch * WEIGHTS.departmentMatch +
          workloadScore * WEIGHTS.workloadScore) * 100
      ) / 100;

      return {
        faculty: f,
        overallScore,
        confidence: getConfidence(overallScore),
        breakdown: {
          expertiseMatch: Math.round(expertiseMatch * 100) / 100,
          eligibilityMatch: Math.round(eligibilityMatch * 100) / 100,
          historicalMatch: Math.round(historicalMatch * 100) / 100,
          departmentMatch: Math.round(departmentMatch * 100) / 100,
          workloadScore: Math.round(workloadScore * 100) / 100,
        },
      };
    });

  scored.sort((a, b) => b.overallScore - a.overallScore);
  return scored;
}

export function getRecommendationsForCourses(
  courses: { id: string; code: string; name: string; department: string }[],
  facultyList: FacultyMember[]
): RecommendationResult[] {
  return courses.map(course =>
    getRecommendationsForCourse(course.id, course.code, course.name, course.department, facultyList)
  ).map((recs, i) => ({
    courseId: courses[i].id,
    courseCode: courses[i].code,
    courseName: courses[i].name,
    recommendations: recs,
  }));
}
