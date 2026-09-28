## Name: Faculty_Wise Project Structure

## Objective
Define a clear project and code file structure for Faculty_Wise so the application stays modular, maintainable, and easy to extend across UI, AI, Firebase, and business logic layers.

## Structure Principles
1. Feature-oriented organization
- Group files by responsibility, not by file type alone.
- Keep page-level code thin and move reusable logic into shared modules.

2. Separation of concerns
- UI components should not contain scheduling algorithms.
- Firebase access should be isolated from presentation components.
- AI optimization logic should live outside the page layer.

3. Predictable naming
- Use descriptive folder and file names.
- Prefer consistent suffixes like `*.service.ts`, `*.schema.ts`, `*.types.ts`, and `*.config.ts`.

4. Scalable boundaries
- Create dedicated modules for auth, scheduling, faculty management, and analytics when the feature grows.

## Recommended Repository Layout
```text
app/
  layout.tsx
  page.tsx
  globals.css
  (auth)/
  (dashboard)/
  (public)/

components/
  ui/
  layout/
  dashboard/
  schedule/
  faculty/
  forms/

lib/
  firebase/
  ai/
  scheduling/
  utils/
  constants/
  validations/

types/
  auth.ts
  faculty.ts
  schedule.ts
  course.ts
  common.ts

hooks/
  useAuth.ts
  useSchedule.ts
  useFacultyLoad.ts

services/
  firebase/
    auth.service.ts
    firestore.service.ts
    storage.service.ts
  ai/
    optimization.service.ts
    scoring.service.ts
  scheduling/
    conflict.service.ts
    load.service.ts

features/
  auth/
  faculty/
  courses/
  scheduling/
  analytics/
  settings/

public/
  images/
  icons/
  fonts/

.agents/
  brainstorming/
  ui-implementation/
  ai-implementation/
  firebase-implementation/
  project-structure/
  roadmap/
  tasks/
  decisions/
  _templates/
```

## App Layer Rules
- Keep `app/page.tsx` and route files focused on composition.
- Load data through services or feature modules, not directly from the component tree.
- Use route groups for separation of public, auth, and dashboard sections.

## Component Layer Rules
1. `components/ui`
- Reusable primitives: Button, Card, Badge, Input, Modal, Tabs, Table, Drawer.

2. `components/layout`
- Shell pieces: Sidebar, Header, Topbar, Navigation, Footer.

3. Feature folders
- Feature-specific view components belong with their domain.
- Example: schedule grid, faculty load cards, conflict banners.

## Service Layer Rules
1. Firebase services
- All Firestore/auth/storage access should pass through service modules.
- Components should consume services through hooks or feature controllers.

2. AI services
- Keep optimization scoring, ranking, and candidate generation isolated.
- Expose a small API for schedule generation and evaluation.

3. Scheduling services
- Keep conflict detection, validation, and assignment logic in one place.

## Data and Types Rules
- Define shared TypeScript types in `types/`.
- Keep Firebase document shapes typed separately from UI view models when needed.
- Store validation schemas alongside the domain they protect.

## Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Services: `something.service.ts`
- Utilities: `something.util.ts`
- Schemas: `something.schema.ts`
- Types: `something.types.ts`
- Constants: `something.constants.ts`

## Dependency Flow
Allowed flow:
- `app` -> `features` -> `services` / `lib` -> `types`
- `components` may consume `types` and `lib`, but should not own business logic.

Avoid:
- UI importing low-level Firebase SDK calls directly.
- AI modules depending on page components.
- Circular dependencies between features.

## MVP File Placement
1. Landing and auth
- `app/page.tsx`
- `app/(auth)/login/page.tsx`
- `components/layout/*`

2. Dashboard and schedules
- `app/(dashboard)/dashboard/page.tsx`
- `features/scheduling/*`
- `components/schedule/*`

3. Firebase and data access
- `services/firebase/*`
- `lib/firebase/*`
- `types/*`

4. AI and optimization
- `services/ai/*`
- `services/scheduling/*`
- `lib/ai/*`

## Growth Plan
1. Start with a lean structure and create folders only when a domain needs them.
2. Move repeated code into shared primitives before duplicating it.
3. Add feature modules as the system gains complexity.
4. Keep architecture notes in `.agents/decisions/` when a structure decision matters.

## Acceptance Criteria
- New code has a clear place to live.
- UI, AI, and Firebase code are separated by layer.
- Shared components and services are reusable.
- Future features can be added without reorganizing the whole project.
