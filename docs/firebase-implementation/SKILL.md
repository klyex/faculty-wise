---
title: Faculty_Wise Firebase Implementation
---

## Name: Faculty_Wise Firebase Implementation

## Objective
Design and implement the Firebase backend for Faculty_Wise to support real-time scheduling workflows, secure role-based access, analytics-ready data, and reliable operations.

## Firebase Stack
1. Authentication
- Firebase Authentication (email/password initially, optional Google SSO).
- Custom claims for role-based access (`admin`, `faculty`, `student`).

2. Database
- Cloud Firestore as the primary operational database.
- Optional Realtime Database only if live collaborative editing requires ultra-low-latency cursors/state.

3. Backend Logic
- Cloud Functions (2nd gen) for scheduling runs, validations, conflict detection, and notifications.

4. File Storage
- Cloud Storage for CSV imports, schedule exports, and archived artifacts.

5. Monitoring and Ops
- Firebase Logging + Error Reporting + Performance Monitoring.

## Firestore Data Model
Recommended top-level collections:
- `users`
- `departments`
- `programs`
- `teachers`
- `students`
- `courses`
- `sections`
- `rooms`
- `terms`
- `courseOfferings`
- `timetableEntries`
- `teacherAvailability`
- `enrollments`
- `optimizationRuns`
- `scheduleVersions`
- `publishedSchedules`
- `auditLogs`

## Database Collections and Fields (Data Dictionary)
Use this as the implementation baseline for Firebase database work.

### 1) `users/{uid}`
- `email: string`
- `displayName: string`
- `role: "admin" | "teacher" | "student"`
- `status: "active" | "inactive"`
- `departmentId: string | null`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### 2) `departments/{departmentId}`
- `code: string`
- `name: string`
- `chairUid: string | null` (ref `users/{uid}`)
- `createdAt: Timestamp`

### 3) `programs/{programId}`
- `departmentId: string` (ref `departments/{departmentId}`)
- `code: string`
- `name: string`
- `createdAt: Timestamp`

### 4) `sections/{sectionId}`
- `programId: string` (ref `programs/{programId}`)
- `name: string` (ex: `BSCS-3A`)
- `yearLevel: number`
- `studentCount: number`

### 5) `teachers/{teacherId}`
- `uid: string` (ref `users/{uid}`)
- `employeeNo: string`
- `fullName: string`
- `departmentId: string`
- `designation: string`
- `employmentType: string`
- `specialization: string`
- `officeLocation: string`
- `targetUnits: number`

### 6) `students/{studentId}`
- `uid: string` (ref `users/{uid}`)
- `studentNo: string`
- `fullName: string`
- `programId: string`
- `sectionId: string | null`
- `yearLevel: number`
- `major: string | null`
- `gpa: number | null`

### 7) `courses/{courseId}`
- `code: string`
- `name: string`
- `description: string`
- `units: number`
- `lectureHours: number`
- `labHours: number`
- `category: "major" | "minor" | "general" | "elective"`
- `departmentId: string`
- `isActive: boolean`

### 8) `rooms/{roomId}`
- `name: string`
- `building: string`
- `floor: number`
- `capacity: number`
- `type: "lecture" | "laboratory" | "seminar" | "auditorium"`
- `status: "available" | "occupied" | "maintenance"`
- `features: string[]`

### 9) `terms/{termId}`
- `academicYear: string` (ex: `2025-2026`)
- `semester: string` (ex: `1st`, `2nd`, `Summer`)
- `startDate: Timestamp`
- `endDate: Timestamp`
- `isCurrent: boolean`

### 10) `courseOfferings/{offeringId}`
- `courseId: string`
- `sectionId: string`
- `teacherId: string`
- `termId: string`
- `maxSlots: number`
- `assignedUnits: number`
- `status: "draft" | "published" | "archived"`
- `notes: string | null` (optional)
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `createdBy: string` (uid of user who created)

### 11) `institutionSettings/{settingsId}` (Singleton: always "default")
- `institutionName: string`
- `currentAcademicYear: string`
- `systemLocale: string` (e.g., `en-US`, `fil-PH`)
- `systemNotificationsEnabled: boolean`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `createdBy: string` (uid of user who created)

### 12) `timetableEntries/{entryId}`
- `offeringId: string`
- `roomId: string`
- `dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"`
- `startTime: string` (HH:mm)
- `endTime: string` (HH:mm)
- `sessionType: "lecture" | "lab" | "seminar" | "other"`
- `isPublished: boolean`

### 13) `teacherAvailability/{availabilityId}`
- `teacherId: string`
- `termId: string`
- `lastUpdated: Timestamp`

Subcollection: `teacherAvailability/{availabilityId}/slots/{slotId}`
- `dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"`
- `startTime: string` (HH:mm)
- `endTime: string` (HH:mm)
- `status: "preferred" | "available" | "unavailable"`

### 14) `enrollments/{enrollmentId}`
- `studentId: string`
- `offeringId: string`
- `enrolledAt: Timestamp`
- `status: "enrolled" | "dropped" | "completed"`
- `finalGrade: number | null`

### 15) `auditLogs/{logId}`
- `actorUid: string`
- `action: string`
- `resourceType: string`
- `resourceId: string`
- `metadata: map`
- `createdAt: Timestamp`

## Firestore Relationship Map (Reference by ID)
- `departments` -> `programs` -> `sections`
- `users` -> (`teachers` or `students` profile)
- `departments` -> `courses`
- `courses` + `sections` + `teachers` + `terms` -> `courseOfferings`
- `courseOfferings` + `rooms` -> `timetableEntries`
- `teachers` + `terms` -> `teacherAvailability` -> `slots`
- `students` + `courseOfferings` -> `enrollments`

Example document structure:
1. `users/{uid}`
- `displayName`, `email`, `role`, `departmentId`, `active`

2. `teachers/{teacherId}`
- `uid`, `employeeNo`, `departmentId`, `designation`, `targetUnits`

3. `optimizationRuns/{runId}`
- `termId`, `status`, `weights`, `startedBy`, `startedAt`, `completedAt`, `topVersionIds[]`, `metrics`

4. `scheduleVersions/{versionId}`
- `runId`, `score`, `hardViolations`, `softPenalty`, `entries[]`, `createdAt`

5. `publishedSchedules/{termId}`
- `versionId`, `publishedBy`, `publishedAt`, `entries[]`

## Indexing Strategy
Create composite indexes for common query paths:
- `teachers` by `departmentId + uid`
- `courseOfferings` by `termId + teacherId`
- `timetableEntries` by `roomId + dayOfWeek + startTime`
- `enrollments` by `studentId + status`
- `scheduleVersions` by `runId + score(desc)`
- `optimizationRuns` by `termId + status + startedAt(desc)`
- `publishedSchedules` by `termId`

## Security Rules Strategy
Principles:
- Deny-by-default.
- Role and ownership checks for every collection.
- Separate read access for published data vs draft optimization data.

Rule intent:
1. Admin
- Full read/write for operational collections.

2. Faculty
- Read own profile and own schedule assignments.
- Submit/update own availability.
- Read published schedule for their department.

3. Student
- Read published schedule only.
- No write access in MVP.

## Cloud Functions Design
Core callable/trigger functions:
1. `setUserRole` (admin only)
- Assign or update custom claims.

2. `importMasterData`
- Parse uploaded CSV/JSON and upsert faculty/courses/rooms/labs.

3. `startOptimizationRun`
- Validate term readiness and enqueue optimization process.

4. `processOptimizationRun`
- Perform candidate generation/evaluation; write ranked `scheduleVersions`.

5. `repairScheduleConflicts`
- Resolve or annotate hard/soft conflicts in selected version.

6. `publishScheduleVersion`
- Copy approved version into `publishedSchedules/{termId}` atomically.

7. `logAuditEvent`
- Record high-impact actions (publish, role change, import).

## Real-Time UX Data Flow
1. Admin starts run
- Create `optimizationRuns/{runId}` with `status=queued`.

2. Function updates run
- `queued -> running -> repairing -> completed/failed`.

3. Dashboard listeners
- Subscribe to run doc and top schedule versions.
- Render live metrics: conflict count, score trend, processing time.

## Transactions and Consistency
Use Firestore transactions/batches for:
- Publishing selected schedule version.
- Writing related run status + metrics + output references.
- Preventing concurrent publish for same term.

## Backup and Retention
1. Daily exports
- Export critical collections (`publishedSchedules`, `optimizationRuns`, `auditLogs`) to Cloud Storage.

2. Retention policy
- Keep run artifacts for at least 2 academic years.
- Keep published schedules and audit logs per institutional policy.

## Environment and Config
Use `.env` + Firebase config separation:
- `dev`, `staging`, `prod` projects.
- Store algorithm weights and toggles in Remote Config or Firestore `systemConfig`.

## MVP Delivery Plan
1. Set up Firebase project, Auth, and Firestore schema.
2. Implement security rules and role claim setup flow.
3. Build data import function and admin import UI hooks.
4. Implement optimization run lifecycle functions.
5. Add publish workflow with audit logging.
6. Add monitoring dashboards and alerts.

## Acceptance Criteria
- Role-based access is enforced by rules.
- Admin can run optimization and publish a schedule.
- Faculty can view assignments and update availability.
- Published schedules are readable by intended users.
- All publish and role-change actions are audit-logged.
