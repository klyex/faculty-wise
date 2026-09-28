# Unfinished Tasks Matrix (Admin, Teacher, Student)

This document tracks all outstanding institutional, scheduling, and portal tasks categorized by **User Persona** (Admin, Teacher, and Student).

---

## 1. 🔑 Administrator Tasks

The Administrator is responsible for managing institutional assets, course listings, department mappings, and launching optimization runs.

### 🔳 Institutional Assets & Infrastructure
- [x] **Department CRUD Management UI**:
  - Build a settings interface to Add, Edit, and Delete departments.
  - Bind a department chair selector that loads users with the `teacher` role.
- [x] **Section & Academic Term Setup**:
  - Configure class sections (e.g., `BSCS-3A`) with targets, student enrollments, and advisor bounds.
  - Implement academic terms manager (`2025-2026 1st Semester`, etc.) to partition data.

### 🔳 Course Catalog (In Progress - Option B Selected)
- [x] **Course Catalog Real-time Service**: Develop `courses.service.ts` to manage course additions, updates, and removals in Firestore.
- [x] **Interactive Add/Edit Course Modal**: A premium form to configure Course Code, Course Name, Units, Lecture/Lab Hours split, Category (Major/Minor/General/Elective), and Department assignment.
- [x] **Administrative Card Actions**: Add Edit/Delete hover triggers inside `CourseCard` components.

### 🔳 Timetables & Optimization
- [ ] **Interactive Schedule Grid**:
  - A visual time-grid (Mon-Sat, 7:00 AM - 9:00 PM) where admins can drag-and-drop or select empty cells to publish timetables.
- [ ] **Conflict Detection Service**:
  - Real-time Firestore logic to audit overlaps: prevent assigning a teacher or a room to two classes concurrently.
- [ ] **AI Optimization Engine Launcher**:
  - Configurator dashboard to trigger Genetic Algorithm schedule generation runs with custom constraint weights.
  - Version comparison grid to preview and select candidates before publishing.

---

## 2. 👨‍🏫 Teacher Tasks

Teachers require features to declare availability, coordinate loads, and view real-time department schedules.

### 🔳 Availability & Preferences
- [x] **Preferred Hours Form**:
  - Interactive grid interface for teachers to submit their availability (Preferred, Available, Unavailable slots) for the upcoming term.
  - Auto-validation checks to ensure teachers declare at least the minimum required slots for their target unit load.

### 🔳 Academic Dashboards
- [x] **Department-Wide Calendar**:
  - Interactive calendar displaying all schedules within their department to simplify substitute coverage and collaboration.
- [x] **Teaching Load Analysis**:
  - Live statistics page highlighting their target hours vs. actual scheduled hours, tracking load balances.
- [ ] **Timetable Calendar Export**:
  - Sync with Google Calendar, Outlook, or download as an `.ics` file.

---

## 3. 🎓 Student Tasks

Students need seamless schedule transparency, class tracking, and enrollment validation.

### 🔳 Enrollment & Section Timetables
- [x] **Personalized Class Schedule**:
  - Dynamic calendar view showing their specific section's weekly timetables.
- [x] **Room & Class Updates**:
  - Live toast alerts and banner updates if a class is rescheduled, moved, or if there is a room change (e.g., to a different laboratory).
- [x] **Credit/Unit Checklist**:
  - visual progress tracker mapping current units to degree program requirements.
