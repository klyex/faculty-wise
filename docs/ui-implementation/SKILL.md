## Skill: Faculty_Wise UI Theme Implementation

## Purpose
Define a clear, consistent, and modern visual theme for Faculty_Wise so the product feels professional for college administrators and easy to use on desktop and mobile.

## Theme Direction
- Style: Academic operations dashboard with a clean, confident, and data-first look.
- Mood: Trustworthy, structured, efficient.
- Visual tone: Light-first, high readability, subtle depth, strong information hierarchy.

## Typography
- Primary font: Manrope (UI text, labels, controls)
- Secondary font: Source Serif 4 (section headings, key page titles)
- Fallback: sans-serif and serif generic stacks

Recommended scale:
- Display: 40/48, weight 700
- H1: 32/40, weight 700
- H2: 24/32, weight 700
- H3: 20/28, weight 600
- Body: 16/24, weight 400
- Caption: 13/18, weight 500

## Color System
Use CSS variables and keep contrast accessible.

```css
:root {
  --bg: #f6f8fb;
  --surface: #ffffff;
  --surface-alt: #eef3f9;
  --text: #10233f;
  --text-muted: #4f5f75;

  --primary: #0f6ba8;
  --primary-strong: #0b4f7d;
  --accent: #e6a700;

  --success: #1f8a53;
  --warning: #b7791f;
  --danger: #c0392b;
  --info: #2f76b7;

  --border: #d7e0ec;
  --focus: #0f6ba8;

  --shadow-sm: 0 2px 8px rgba(16, 35, 63, 0.06);
  --shadow-md: 0 8px 24px rgba(16, 35, 63, 0.12);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
}
```

## Layout Principles
- Use a 12-column grid on desktop and single-column stacking on small screens.
- Keep dashboard density moderate: prioritize scanability over squeezing too much data.
- Prefer cards for grouped data: schedule metrics, faculty load summaries, conflict alerts.
- Keep primary actions visible at top right of sections.

## Component Styling Rules
1. Buttons
- Primary: solid primary background, white text.
- Secondary: white background, primary border/text.
- Danger: red background for destructive actions only.

2. Tables
- Sticky header for schedule tables.
- Zebra row hover states for readability.
- Status chips (Conflict, Balanced, Overload, Pending).

3. Cards
- Soft shadow and subtle border.
- Header with concise title and one action icon max.

4. Forms
- Use explicit labels above fields.
- Error states with helper text below fields.
- Availability selection should use clear day/time chips.

## Motion and Interaction
Use short, purposeful animations only.
- Duration: 140ms to 220ms
- Easing: ease-out for entry, ease-in-out for state changes
- Use motion for:
  - page section reveal
  - conflict row highlight
  - drawer/modal transitions

Avoid decorative animation loops that distract from data work.

## Accessibility Checklist
- Color contrast target: WCAG AA minimum.
- Visible keyboard focus for all interactive elements.
- Touch target size: at least 44x44px.
- Support reduced motion with `prefers-reduced-motion`.
- All charts and status indicators must have text equivalents.

## Page Theme Recommendations
1. Admin Dashboard
- Hero strip with key KPIs: conflicts, unassigned classes, overloaded faculty.
- Two-column layout: schedule health panel + recent actions.

2. Timetable Builder
- Left panel: constraints and filters.
- Main panel: timetable grid with conflict overlays.
- Right panel: auto-suggestions and quick fixes.

3. Faculty Load Manager
- Faculty cards sorted by load health (balanced, near limit, overloaded).
- Detail drawer with qualifications, certifications, and assigned subjects.

4. Lab Rotation Planner
- Timeline/grid view for room and equipment rotation.
- Capacity and utilization badges.

## Implementation Notes for Next.js
- Put color and spacing variables in app/globals.css.
- Create reusable UI primitives before page-level styling:
  - Button
  - Card
  - Chip
  - StatTile
  - DataTable
- Keep all states in a single style system: default, hover, active, focus, disabled, loading.

## Do and Do Not
Do:
- Keep text concise and data labels explicit.
- Use color plus icon or text for status meaning.
- Preserve consistent spacing rhythm.

Do not:
- Use random gradients per page.
- Overuse glass effects or noisy shadows.
- Depend on color alone to communicate conflicts.

## MVP Theme Deliverables
1. Global design tokens in CSS variables.
2. Styled dashboard shell (header, sidebar, content area).
3. Reusable component set for data-heavy pages.
4. Responsive behavior for mobile and tablet.
5. Accessibility pass on core screens.
