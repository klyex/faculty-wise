# REVISION_TASK.md

# AI-Based Faculty Scheduling System
## Development Task List (Coding Only)

---

# AI FEATURES

## AI-001 Improve AI Scheduling Engine

### Tasks

- [x] Remove the "AI is analyzing..." loading message.
- [x] Implement automatic conflict detection.
- [x] Automatically regenerate schedules when conflicts are found.
- [x] Generate multiple schedule proposals.
- [x] Save generated schedules as proposals.
- [x] Allow comparison of generated schedule proposals.
- [x] Add proposal status (Draft, Accepted, Rejected).

---

## AI-002 Machine Learning Recommendation Engine

### Tasks

- [x] Build a recommendation engine for faculty assignment.
- [x] Recommend faculty based on:
  - Faculty expertise
  - Preferred subjects
  - Historical teaching assignments
  - Previously handled subjects
  - Current workload
- [x] Display ranked faculty recommendations.
- [x] Display recommendation scores or confidence levels.

---

## AI-003 Faculty Expertise Module

### Tasks

- [x] Create Faculty Expertise management page.
- [x] Allow faculty to manage:
  - Area of expertise
  - Preferred subjects
  - Specializations (optional)
- [x] Store expertise information in the database.
- [x] Integrate expertise into the recommendation engine.

---

## AI-004 Historical Teaching Data

### Tasks

- [x] Store historical faculty teaching assignments.
- [x] Save semester and school year history.
- [x] Use historical records when generating recommendations.
- [x] Create data retrieval layer for recommendation engine.

---

## AI-005 Intelligent Workload Distribution

### Tasks

- [ ] Calculate current faculty teaching load.
- [ ] Prevent overload during schedule generation.
- [ ] Distribute subjects fairly across qualified faculty.
- [ ] Consider expertise and historical assignments during distribution.

---

## AI-006 AI Recommendation Override

### Tasks

- [ ] Allow administrators to accept AI recommendations.
- [ ] Allow administrators to modify recommendations.
- [ ] Allow manual assignment of faculty.
- [ ] Log overridden recommendations.

---

# SYSTEM FEATURES

## SYS-001 Faculty Loading Module

### Tasks

- [x] Create Faculty Loading page.
- [x] Display:
  - Faculty
  - Subject
  - Day
  - Time
  - Units
- [x] Add filtering and search functionality.

---

## SYS-002 Weekly Faculty Schedule

### Tasks

- [x] Create weekly schedule view.
- [x] Display Monday–Saturday schedules.
- [x] Support printable schedule format.

---

## SYS-003 Room Availability Module

### Tasks

- [x] Create Room Availability page.
- [x] Display:
  - Available rooms
  - Occupied rooms
  - Time slots
- [x] Add room availability filtering.

---

## SYS-004 Course Offering Management

### Tasks

- [x] Support multiple school years.
- [x] Support multiple semesters.
- [x] Support summer term.
- [x] Allow copying previous course offerings.

---

## SYS-005 Department Structure

### Tasks

- [x] Update database structure to support:
  - Institute/Department
  - Sections
  - Subjects
- [x] Update CRUD operations.
- [x] Update navigation and filtering.

---

## SYS-006 User Roles

### Tasks

#### Program Head

- [ ] Assign faculty
- [ ] Assign subjects
- [ ] Assign rooms

#### Dean

- [ ] Review schedules
- [ ] Review faculty workload
- [ ] Approve schedules

#### Administrator

- [ ] Manage users
- [ ] Monitor schedules
- [ ] Override AI recommendations

- [ ] Update role-based permissions.

---

## SYS-007 Email Notification

### Tasks

- [ ] Send login credentials after faculty account creation.
- [ ] Send activation email.
- [ ] Allow faculty to create passwords through activation link.

---

## SYS-008 Student Schedule Search

### Tasks

- [ ] Remove student login requirement.
- [ ] Create public schedule search page.
- [ ] Search using:
  - Student ID
  - Class Code
- [ ] Display approved schedules only.

---

## SYS-009 UI Improvements

### Tasks

- [ ] Replace JavaScript alert dialogs with modal dialogs.
- [ ] Add confirmation modals.
- [ ] Add toast notifications for user actions.

---

## SYS-010 Enhanced Tables

### Tasks

- [ ] Improve Faculty Loading table.
- [ ] Improve Room Availability table.
- [ ] Improve Schedule table.
- [ ] Create AI Schedule Proposal table.
- [ ] Add sorting, searching, filtering, and pagination.