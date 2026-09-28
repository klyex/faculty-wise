import { Course, Room, User, Schedule } from "./types/firestore.types";

export interface ScheduleDecision {
  courseCode: string;
  courseName: string;
  assignedTeacher: string;
  teacherReason: string;
  assignedRoom: string;
  roomReason: string;
  day: string;
  timeSlot: string;
  conflictsAvoided: number;
}

export interface AiScheduleReport {
  totalCourses: number;
  totalScheduled: number;
  totalSkipped: number;
  skippedCourses: { name: string; reason: string }[];
  decisions: ScheduleDecision[];
  conflictsAvoided: number;
  teacherLoadSummary: Record<string, number>;
  roomUsageSummary: Record<string, number>;
}

export interface ConflictInfo {
  type: "teacher" | "room" | "both";
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  conflictingEntity: string;
}

export function detectConflictsAgainstExisting(
  draftSchedules: Omit<Schedule, "id">[],
  existingSchedules: Omit<Schedule, "id">[],
  faculty: User[],
  rooms: Room[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  for (const draft of draftSchedules) {
    for (const existing of existingSchedules) {
      if (draft.dayOfWeek === existing.dayOfWeek && draft.startTime === existing.startTime) {
        const teacherConflict = draft.teacherId === existing.teacherId;
        const roomConflict = draft.roomId === existing.roomId;
        if (teacherConflict || roomConflict) {
          const getTeacherName = (id: string) => {
            const t = faculty.find(f => f.id === id || (f as any).uid === id);
            return t?.displayName || (t as any)?.name || (t as any)?.fullName || id;
          };
          const getRoomLabel = (id: string) => {
            const r = rooms.find(rm => rm.id === id);
            return r ? `${r.name} (${r.building})` : id;
          };
          conflicts.push({
            type: teacherConflict && roomConflict ? "both" : teacherConflict ? "teacher" : "room",
            teacherName: getTeacherName(draft.teacherId),
            roomName: getRoomLabel(draft.roomId),
            day: draft.dayOfWeek,
            startTime: draft.startTime,
            endTime: draft.endTime,
            courseCode: draft.courseCode || draft.courseId,
            courseName: draft.courseName || draft.courseId,
            conflictingEntity: teacherConflict
              ? getTeacherName(existing.teacherId)
              : getRoomLabel(existing.roomId),
          });
        }
      }
    }
  }
  return conflicts;
}

export function generateAiSchedule(
  courses: Course[],
  faculty: User[],
  rooms: Room[],
  term: string = "Semester 1, 2026",
  existingSchedules: Omit<Schedule, "id">[] = []
): { schedules: Omit<Schedule, "id">[]; report: AiScheduleReport } {
  const schedules: Omit<Schedule, "id">[] = [];
  const decisions: ScheduleDecision[] = [];
  const skippedCourses: { name: string; reason: string }[] = [];
  let totalConflictsAvoided = 0;
  const teacherLoad: Record<string, number> = {};
  const roomUsage: Record<string, number> = {};

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeslots = [
    { start: "08:00", end: "09:30" },
    { start: "09:30", end: "11:00" },
    { start: "11:00", end: "12:30" },
    { start: "13:00", end: "14:30" },
    { start: "14:30", end: "16:00" }
  ];

  const isConflict = (teacherId: string, roomId: string, day: string, startTime: string) => {
    const newConflict = schedules.some(
      s => (s.teacherId === teacherId || s.roomId === roomId) &&
           s.dayOfWeek === day &&
           s.startTime === startTime
    );
    if (newConflict) return true;
    const existingConflict = existingSchedules.some(
      s => (s.teacherId === teacherId || s.roomId === roomId) &&
           s.dayOfWeek === day &&
           s.startTime === startTime
    );
    return existingConflict;
  };

  const getTeacherName = (id: string) => {
    const t = faculty.find(f => f.id === id || (f as any).uid === id);
    return t?.displayName || (t as any)?.name || (t as any)?.fullName || id;
  };
  const getRoomLabel = (id: string) => {
    const r = rooms.find(rm => rm.id === id);
    return r ? `${r.name} (${r.building})` : id;
  };

  for (const course of courses) {
    const courseName = course.name || course.id;
    const courseCode = course.code || course.id;

    let suitableTeachers = faculty.filter(f => f.role === 'teacher' && f.status === 'active');
    let teacherReason = "";

    if (suitableTeachers.length === 0) {
      skippedCourses.push({ name: courseName, reason: "No active teachers available in the system." });
      continue;
    }

    if (course.department) {
      const deptTeachers = suitableTeachers.filter(f => f.departmentId === course.department);
      if (deptTeachers.length > 0) {
        suitableTeachers = deptTeachers;
        teacherReason = `Matched to department "${course.department}" (${deptTeachers.length} eligible).`;
      } else {
        teacherReason = `No teachers in dept "${course.department}", using all ${suitableTeachers.length} active teachers.`;
      }
    } else {
      teacherReason = `No department specified, pool of ${suitableTeachers.length} active teachers.`;
    }

    suitableTeachers.sort((a, b) => (teacherLoad[a.id] || 0) - (teacherLoad[b.id] || 0));

    const needsLab = course.name.toLowerCase().includes('lab') || course.name.toLowerCase().includes('programming');
    let suitableRooms = rooms;
    let roomReason = "";

    if (needsLab) {
      const labRooms = rooms.filter(r => r.type === 'laboratory');
      if (labRooms.length > 0) {
        suitableRooms = labRooms;
        roomReason = `Course requires lab/programming → assigned laboratory room (${labRooms.length} available).`;
      } else {
        roomReason = "Needs lab but none available, using any room.";
      }
    } else {
      const lecRooms = rooms.filter(r => r.type === 'lecture' || r.type === 'seminar' || (r.type as string) === 'auditorium');
      if (lecRooms.length > 0) {
        suitableRooms = lecRooms;
        roomReason = `Lecture/seminar course → assigned lecture room (${lecRooms.length} available).`;
      } else {
        roomReason = "No lecture rooms, using any available room.";
      }
    }

    if (suitableRooms.length === 0) {
      skippedCourses.push({ name: courseName, reason: "No suitable rooms available." });
      continue;
    }

    suitableRooms.sort((a, b) => (roomUsage[a.id] || 0) - (roomUsage[b.id] || 0));

    let assigned = false;
    let conflictsHit = 0;
    let attempts = 0;
    const maxAttempts = 100;

    while (!assigned && attempts < maxAttempts) {
      attempts++;
      const teacherIdx = Math.min(
        Math.floor(Math.random() * Math.min(3, suitableTeachers.length)),
        suitableTeachers.length - 1
      );
      const roomIdx = Math.min(
        Math.floor(Math.random() * Math.min(3, suitableRooms.length)),
        suitableRooms.length - 1
      );
      const selectedTeacher = suitableTeachers[teacherIdx];
      const selectedRoom = suitableRooms[roomIdx];

      const day = days[Math.floor(Math.random() * days.length)];
      const slot = timeslots[Math.floor(Math.random() * timeslots.length)];

      if (!isConflict(selectedTeacher.id, selectedRoom.id, day, slot.start)) {
        const entry: Omit<Schedule, "id"> = {
          courseId: course.id,
          teacherId: selectedTeacher.id,
          roomId: selectedRoom.id,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
          semester: term,
          courseName,
          courseCode,
        };
        const sanitized = Object.fromEntries(
          Object.entries(entry).filter(([, v]) => v !== undefined)
        ) as Omit<Schedule, "id">;
        schedules.push(sanitized);

        teacherLoad[selectedTeacher.id] = (teacherLoad[selectedTeacher.id] || 0) + 1;
        roomUsage[selectedRoom.id] = (roomUsage[selectedRoom.id] || 0) + 1;

        decisions.push({
          courseCode,
          courseName,
          assignedTeacher: getTeacherName(selectedTeacher.id),
          teacherReason: `${teacherReason} Selected "${getTeacherName(selectedTeacher.id)}" (load: ${teacherLoad[selectedTeacher.id]} classes).`,
          assignedRoom: getRoomLabel(selectedRoom.id),
          roomReason,
          day,
          timeSlot: `${slot.start} – ${slot.end}`,
          conflictsAvoided: conflictsHit,
        });

        totalConflictsAvoided += conflictsHit;
        assigned = true;
      } else {
        conflictsHit++;
      }
    }

    if (!assigned) {
      skippedCourses.push({ name: courseName, reason: `Could not find a conflict-free slot after ${attempts} attempts.` });
    }
  }

  const teacherLoadSummary: Record<string, number> = {};
  for (const f of faculty.filter(u => u.role === 'teacher' && u.status === 'active')) {
    teacherLoadSummary[getTeacherName(f.id)] = 0;
  }
  for (const [id, count] of Object.entries(teacherLoad)) {
    teacherLoadSummary[getTeacherName(id)] = count;
  }

  const roomUsageSummary: Record<string, number> = {};
  for (const r of rooms) {
    roomUsageSummary[getRoomLabel(r.id)] = 0;
  }
  for (const [id, count] of Object.entries(roomUsage)) {
    roomUsageSummary[getRoomLabel(id)] = count;
  }

  const report: AiScheduleReport = {
    totalCourses: courses.length,
    totalScheduled: schedules.length,
    totalSkipped: skippedCourses.length,
    skippedCourses,
    decisions,
    conflictsAvoided: totalConflictsAvoided,
    teacherLoadSummary,
    roomUsageSummary,
  };

  return { schedules, report };
}

export function generateMultipleSchedules(
  courses: Course[],
  faculty: User[],
  rooms: Room[],
  count: number = 3,
  term: string = "Semester 1, 2026",
  existingSchedules: Omit<Schedule, "id">[] = []
): { schedules: Omit<Schedule, "id">[]; report: AiScheduleReport }[] {
  const results: { schedules: Omit<Schedule, "id">[]; report: AiScheduleReport }[] = [];
  for (let i = 0; i < count; i++) {
    const result = generateAiSchedule(courses, faculty, rooms, term, existingSchedules);
    results.push(result);
  }
  return results;
}
