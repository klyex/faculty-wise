export type AvailabilityStatus = "preferred" | "available" | "unavailable";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface AvailabilitySlot {
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AvailabilityStatus;
}

export interface TeacherAvailability {
  teacherId: string;
  semester: string;
  academicYear: string;
  slots: AvailabilitySlot[];
  lastUpdated: string;
}
