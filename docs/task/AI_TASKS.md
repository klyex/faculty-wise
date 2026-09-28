# AI Scheduling & Optimization Tasks

This document tracks the tasks related to the AI scheduling engine and optimization workflows.

## 1. Core Optimization Engine
- [ ] **Constraint Modeling**: Define mathematical representations for hard constraints (no overlaps) and soft constraints (preferences).
- [ ] **Fitness Function Implementation**: Build a weighted scoring model to evaluate schedule quality (load balance, qualification match).
- [ ] **Genetic Algorithm (GA)**: Implement the core optimization loop (selection, crossover, mutation) for schedule refinement.
- [ ] **Load Balancing Logic**: Algorithm to distribute units fairly among faculty based on target loads and designations.

## 2. Intelligence & Matching
- [ ] **Qualification Matching**: Logic to score faculty-course pairings based on specialization and teaching history.
- [ ] **Conflict Detection Service**: Real-time or batch service to identify collisions in time, room, or faculty assignments.
- [ ] **Automatic Conflict Repair**: Heuristic moves to resolve hard violations by proposing alternative slots or rooms.
- [ ] **Historical Pattern Analysis**: Use past data to improve initial schedule seeding and preference matching.

## 3. Integration & Workflow
- [ ] **Optimization Run Lifecycle**: Manage the state machine for runs (`queued` -> `running` -> `repairing` -> `completed`).
- [ ] **Cloud Functions Execution**: Port the heavy computation logic to 2nd Gen Cloud Functions for scalability.
- [ ] **Real-time Status Streaming**: Push progress updates and live metrics (score trend, conflict count) to the Admin UI.
- [ ] **Schedule Versioning**: Implementation for saving multiple ranked versions (`scheduleVersions`) from a single run.

## 4. Admin Optimization UI
- [ ] **Optimization Run Launcher**: Configurable UI to start runs with custom weights and term selections.
- [ ] **Version Comparison Dashboard**: Side-by-side view to compare different schedule candidates based on metrics.
- [ ] **Conflict Visualizer**: Interactive view highlighting specific violations and suggesting fixes.
- [ ] **Manual Override Tools**: Ability for admins to "lock" specific slots before or after AI optimization.

## 5. Analytics & Evaluation
- [ ] **Utilization Metrics**: Calculate and display room and lab occupancy rates.
- [ ] **Quality Insights**: Generate reports on schedule "tightness" and faculty satisfaction scores.
- [ ] **Success Tracking**: Compare AI-generated schedules against previous manual benchmarks.
