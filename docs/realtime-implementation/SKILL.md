# Real-Time Data Display Implementation

## Overview
This skill documents the implementation of real-time data display for Faculty_Wise using Firestore listeners. The system automatically updates dashboard information as data changes in the database without requiring page refreshes.

## Architecture Pattern

### Core Components

#### 1. Real-Time Hooks (`lib/hooks/`)
- **useFirestoreCollection**: Enhanced to support both one-time (`getDocs`) and real-time (`onSnapshot`) fetching
- **useTeacherDashboard**: Combines multiple Firestore listeners to provide aggregated dashboard data

#### 2. Type System (`lib/types/`)
- **TeacherDashboardData**: Complete dashboard state including stats, courses, and upcoming sessions
- **TeacherStats**: Calculated metrics for teacher
- **UpcomingSession**: Next class with time countdown
- **TeacherCourse**: Course information aggregated from multiple sources

#### 3. Feature Components (`features/teacher-profile/`)
- **RealtimeTeacherDashboard**: Container component orchestrating all real-time data
- **RealtimeTeacherStats**: Displays real-time statistics with loading state
- **RealtimeUpcomingSession**: Shows next class with countdown timer
- **RealtimeTeachingLoadSummary**: Lists teacher's courses with real-time updates

## Implementation Details

### Real-Time Hook Pattern
```typescript
export function useTeacherDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  
  useEffect(() => {
    // Multiple onSnapshot listeners for different collections
    // Each listener updates state when data changes
    // Cleanup function unsubscribes all listeners on unmount
  }, [user?.uid]);
}
```

### Key Features

1. **Multiple Listeners**: Simultaneously listens to schedules, courses, and teacher data
2. **Aggregated Data**: Calculates stats and derives upcoming sessions from raw data
3. **Cleanup Management**: Properly unsubscribes listeners to prevent memory leaks
4. **Error Handling**: Includes error states for graceful degradation
5. **Loading States**: Shows skeleton/spinner during initial load

### Data Flow
```
Firestore Collections
├── schedules (filtered by teacherId)
├── courses (all courses)
└── teachers (current teacher)
        ↓
  useTeacherDashboard Hook
        ↓
  Aggregate & Calculate
  (upcoming sessions, stats, etc)
        ↓
  RealtimeTeacherDashboard Container
        ↓
  Individual Components
  (Stats, Session, LoadSummary)
```

## Usage

### In a Component
```tsx
import { RealtimeTeacherDashboard } from "@/features/teacher-profile/RealtimeTeacherDashboard";

export function MyPage() {
  return <RealtimeTeacherDashboard />;
}
```

### Using the Hook Directly
```tsx
import { useTeacherDashboard } from "@/lib/hooks/useTeacherDashboard";

export function MyComponent() {
  const { dashboardData, loading, error } = useTeacherDashboard();
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return <DisplayData data={dashboardData} />;
}
```

## Extending to Other Roles

### Admin Dashboard Real-Time
Similar pattern for admin metrics:
1. Create `useAdminDashboard` hook
2. Listen to schedules, conflicts, and optimization runs
3. Calculate KPIs (room utilization, conflict count, etc)
4. Create components for stats display

### Student Dashboard Real-Time
For student schedules and enrollments:
1. Create `useStudentDashboard` hook
2. Listen to enrollments and class schedules
3. Show upcoming classes and assignment deadlines
4. Update on changes

## Performance Considerations

### Listener Optimization
- Only subscribe to necessary collections
- Use Firestore filters (where clauses) to limit data
- Unsubscribe listeners immediately on unmount

### State Updates
- Batch updates when possible
- Avoid unnecessary re-renders with proper dependency arrays
- Consider using Context API for shared real-time data

### Firestore Costs
- Real-time listeners count as "reads" after initial snapshot
- Each listener update costs similar to one read
- Monitor usage in Firebase console

## Error Handling

```typescript
if (error) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <p className="text-sm text-red-800">
        Error loading dashboard data: {error.message}
      </p>
    </div>
  );
}
```

## Testing Considerations

1. **Mock Firestore**: Use emulator for testing
2. **Listener Cleanup**: Verify unsubscribe is called
3. **Data Changes**: Test listeners respond to updates
4. **Error Cases**: Test connection failures

## Future Enhancements

1. **Polling Fallback**: Add polling for offline scenarios
2. **Local Cache**: Cache last known state for instant load
3. **Partial Updates**: Update only changed fields
4. **Subscriptions**: Use Firebase realtime database for ultra-low latency
5. **Notification System**: Alert users of important updates

## Related Documentation
- Firebase Implementation: `docs/firebase-implementation/SKILL.md`
- Project Structure: `docs/project-structure/SKILL.md`
