export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface TimetableEntry {
  id: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  room: string;
  day: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  color?: string;    // Optional hex or tailwind class
  type: "lecture" | "lab" | "seminar" | "other";
  sectionName?: string;
}

export interface TimetableData {
  entries: TimetableEntry[];
  weekLabel?: string;
}
