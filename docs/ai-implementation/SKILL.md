## Name: Faculty_Wise AI Implementation

## Objective
Implement an AI-assisted scheduling engine that generates conflict-free timetables and balanced faculty loads using historical data, qualification matching, and constraint optimization.

## AI Scope
1. Instructor-course matching
- Score each faculty member against each course based on specialization, certifications, teaching history, and preference fit.

2. Timetable optimization
- Build weekly schedules that satisfy hard constraints and optimize soft constraints.

3. Conflict detection and repair
- Detect room/time/faculty collisions and propose automatic repair moves.

4. Load balancing
- Keep faculty loads within min/max thresholds while preserving qualification quality.

## Constraint Model
Hard constraints (must pass):
- No faculty time overlap.
- No room/lab time overlap.
- Faculty assigned only to qualified courses.
- Course section must receive required contact hours.

Soft constraints (optimize):
- Minimize faculty overload/underload.
- Prefer historical availability patterns.
- Reduce schedule gaps for faculty and students.
- Improve lab/resource utilization.

## Optimization Strategy
Use a hybrid approach:
1. Heuristic seed generation
- Create initial feasible schedules quickly using greedy assignment with qualification scoring.

2. Genetic algorithm refinement
- Chromosome: full timetable + faculty assignment map.
- Fitness: weighted objective score minus penalties.
- Operators: crossover on schedule blocks, mutation on time-slot and faculty swaps.
- Elitism: keep top candidates each generation.

3. Local search repair
- Apply targeted swap/reassign operations to resolve remaining soft-constraint penalties.

## Suggested Fitness Function
Maximize:
- Qualification match score
- Historical availability match
- Balanced load score
- Lab utilization score

Minimize penalties:
- Hard constraint violations (very high penalty)
- Overload/underload
- Excess idle gaps
- Repeated late-day clustering

## Firebase Implementation
1. Firestore collections
- users
- faculty
- courses
- sections
- rooms
- labs
- schedules
- loadProfiles
- historicalAssignments
- optimizationRuns

2. Cloud Functions
- `startOptimizationRun`: initialize optimization with selected semester/term data.
- `evaluateCandidate`: compute score and constraint penalties.
- `repairConflicts`: run post-processing conflict repair.
- `publishSchedule`: write approved schedule snapshot to active term.

3. Realtime updates
- Stream optimization run status and top candidate metrics to admin dashboard.

4. Authentication and roles
- Admin: full control and approval rights.
- Faculty: read assignment and submit availability/preferences.
- Student (optional MVP): read-only published schedule.

## Data Pipeline
1. Input preparation
- Normalize faculty qualifications, certifications, and availability.
- Build course requirements and room/lab constraints.

2. Optimization execution
- Run initial generation, refine over N generations, then repair.

3. Validation and publish
- Validate no hard violations.
- Save top K schedule versions.
- Admin reviews and publishes selected version.

## API/Event Contract (Suggested)
- Trigger: Firestore document create in `optimizationRuns/{runId}`.
- Status updates: `queued`, `running`, `repairing`, `completed`, `failed`.
- Output: ranked schedule versions with metrics and conflict summaries.

## MVP Implementation Plan
1. Build deterministic rule-based scheduler baseline.
2. Add conflict detection and repair workflow.
3. Introduce scoring and optimization run tracking.
4. Add GA refinement for higher-quality schedules.
5. Expose side-by-side version comparison in admin UI.

## Evaluation Metrics
- Hard conflict count (target: 0).
- Average qualification match per course.
- Faculty load variance.
- Room/lab utilization rate.
- Time-to-generate schedule.

## Risks and Mitigations
1. Sparse or noisy historical data
- Fallback to rule-based defaults and confidence scoring.

2. Long optimization runtime
- Use generation/time caps and early stopping.

3. Overfitting to past assignments
- Mix historical signal with explicit current-term constraints.

## Deliverables
1. AI service flow documented and implemented via Cloud Functions.
2. Fitness scoring model with configurable weights.
3. Conflict detection and repair module.
4. Ranked schedule outputs with transparent metrics for admin review.
