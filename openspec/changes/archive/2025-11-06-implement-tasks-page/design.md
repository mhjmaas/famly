# Design: Implement Tasks Page

## Architecture Overview

This change implements a complete Tasks page for the web application following a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     Tasks Page Component                │
│              (apps/web/src/app/[lang]/app/tasks/)       │
│   - Orchestrates UI rendering                           │
│   - Handles routing and i18n                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Tasks View Component                   │
│         (apps/web/src/components/tasks/)                │
│   - Main UI logic and state management                  │
│   - Event handlers and business logic                   │
│   - Integrates with Redux store                         │
└────────┬───────────────────────────────┬────────────────┘
         │                               │
         │                               │
┌────────▼────────────────┐   ┌──────────▼──────────────┐
│    Tasks Redux Slice    │   │   API Client Functions  │
│ (store/slices/tasks)    │   │   (lib/api-client.ts)   │
│  - State management     │   │   - HTTP requests       │
│  - Optimistic updates   │   │   - Error handling      │
│  - Karma integration    │   │   - Type safety         │
└─────────────────────────┘   └─────────────────────────┘
```

## Component Structure

### 1. Page Component (`page.tsx`)
**Responsibility**: Server-side rendering entry point with i18n setup

```typescript
// apps/web/src/app/[lang]/app/tasks/page.tsx
- Fetches initial data server-side (optional)
- Passes dictionary and locale to TasksView
- Wraps in DashboardLayout
```

**Key Features**:
- Server Component for initial render performance
- Handles locale resolution
- Provides i18n dictionary

### 2. Tasks View Component (`TasksView.tsx`)
**Responsibility**: Main client-side UI with all task management logic

**Location**: `apps/web/src/components/tasks/TasksView.tsx`

**State Management**:
```typescript
// Local UI state
- isCreateOpen: boolean          // Create dialog visibility
- editingTask: Task | null       // Task being edited
- filter: FilterType             // Current filter selection
- taskType: 'single' | 'recurring'  // Tab selection in create dialog
- deleteConfirmTask: Task | null // Task pending deletion
- formData: TaskFormData         // Form input values
- showDescription: boolean       // Optional field visibility
- showDueDate: boolean
- showAssignment: boolean
- showKarma: boolean
- selectedDays: string[]         // Recurring schedule days
- weekFrequency: string          // Recurring frequency

// Redux state (via hooks)
- tasks: Task[]                  // From tasks slice
- karma: Record<userId, balance> // From karma slice
- user: UserProfile              // From user slice
- families: Family[]             // From family slice (for current family)
```

**Key Functions**:
1. **Data Fetching**:
   - `useEffect` on mount fetches tasks via Redux action
   - Dispatches `fetchTasks(familyId)` thunk
   - Shows loading state during fetch

2. **Filtering Logic**:
   ```typescript
   const filteredTasks = useMemo(() => {
     if (filter === 'my-tasks') {
       return tasks.filter(task => {
         // Check if assigned to current user
         if (task.assignment.type === 'member' &&
             task.assignment.memberId === user.id) return true;
         // Check if assigned to user's role
         if (task.assignment.type === 'role' &&
             task.assignment.role === user.role) return true;
         return false;
       });
     }
     if (filter === 'active') return tasks.filter(t => !t.completedAt);
     if (filter === 'completed') return tasks.filter(t => t.completedAt);
     return tasks; // 'all'
   }, [tasks, filter, user]);
   ```

3. **Task Creation**:
   - Opens dialog with tabs for "Single Task" / "Recurring Task"
   - Single task: name, optional description/due date/assignment/karma
   - Recurring task: includes schedule selector (days + frequency)
   - Dispatches `createTask()` or `createSchedule()` action
   - Shows success toast on completion

4. **Task Update**:
   - Pre-fills form with existing task data
   - Supports updating all fields
   - Dispatches `updateTask()` action
   - Handles both regular and schedule-linked tasks

5. **Task Completion**:
   - Toggles `completedAt` timestamp
   - Dispatches `completeTask()` action
   - Updates karma balance in Redux if task has karma metadata
   - Shows toast with karma reward notification

6. **Task Deletion**:
   - Regular tasks: immediate deletion
   - Recurring tasks: shows dialog with options:
     - "Delete This Task Only" (removes single instance)
     - "Delete All Recurring Tasks" (deletes schedule)

7. **Task Claiming**:
   - Available for unassigned and role-based tasks
   - Updates assignment to current user
   - Dispatches `updateTask()` with new assignment

### 3. Redux Slice (`tasks.slice.ts`)

**Location**: `apps/web/src/store/slices/tasks.slice.ts`

**State Shape**:
```typescript
interface TasksState {
  tasks: Task[];
  schedules: TaskSchedule[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;  // Timestamp for cache invalidation
}
```

**Actions & Thunks**:

1. **`fetchTasks`** (async thunk):
   ```typescript
   // GET /v1/families/{familyId}/tasks
   - Fetches all tasks for family
   - Updates state.tasks
   - Sets lastFetch timestamp
   ```

2. **`fetchSchedules`** (async thunk):
   ```typescript
   // GET /v1/families/{familyId}/tasks/schedules
   - Fetches recurring schedules
   - Updates state.schedules
   ```

3. **`createTask`** (async thunk):
   ```typescript
   // POST /v1/families/{familyId}/tasks
   - Creates single task
   - Optimistically adds to state
   - Rolls back on error
   ```

4. **`createSchedule`** (async thunk):
   ```typescript
   // POST /v1/families/{familyId}/tasks/schedules
   - Creates recurring schedule
   - Adds to state.schedules
   ```

5. **`updateTask`** (async thunk):
   ```typescript
   // PATCH /v1/families/{familyId}/tasks/{taskId}
   - Updates task fields
   - Optimistically updates in state
   - Rolls back on error
   ```

6. **`completeTask`** (async thunk):
   ```typescript
   // PATCH /v1/families/{familyId}/tasks/{taskId}
   // with { completedAt: timestamp }
   - Marks task complete
   - Updates karma balance if task has karma
   - Dispatches karma slice action
   ```

7. **`deleteTask`** (async thunk):
   ```typescript
   // DELETE /v1/families/{familyId}/tasks/{taskId}
   - Removes task
   - Optimistically removes from state
   ```

8. **`deleteSchedule`** (async thunk):
   ```typescript
   // DELETE /v1/families/{familyId}/tasks/schedules/{scheduleId}
   - Removes schedule
   - Orphans existing task instances
   ```

**Selectors**:
```typescript
export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectSchedules = (state: RootState) => state.tasks.schedules;
export const selectTasksLoading = (state: RootState) => state.tasks.isLoading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectTaskById = (taskId: string) => (state: RootState) =>
  state.tasks.tasks.find(t => t._id === taskId);
```

### 4. API Client Extensions

**Location**: `apps/web/src/lib/api-client.ts`

**New Functions**:
```typescript
// Task CRUD
export async function getTasks(familyId: string, params?: TaskQueryParams): Promise<Task[]>
export async function getTask(familyId: string, taskId: string): Promise<Task>
export async function createTask(familyId: string, data: CreateTaskRequest): Promise<Task>
export async function updateTask(familyId: string, taskId: string, data: UpdateTaskRequest): Promise<Task>
export async function deleteTask(familyId: string, taskId: string): Promise<void>

// Schedule CRUD
export async function getSchedules(familyId: string): Promise<TaskSchedule[]>
export async function getSchedule(familyId: string, scheduleId: string): Promise<TaskSchedule>
export async function createSchedule(familyId: string, data: CreateScheduleRequest): Promise<TaskSchedule>
export async function updateSchedule(familyId: string, scheduleId: string, data: UpdateScheduleRequest): Promise<TaskSchedule>
export async function deleteSchedule(familyId: string, scheduleId: string): Promise<void>
```

### 5. Type Definitions

**Location**: `apps/web/src/types/api.types.ts` (extend existing file)

```typescript
// Task types matching backend domain
export interface Task {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  dueDate?: string;  // ISO 8601
  assignment: TaskAssignment;
  completedAt?: string;  // ISO 8601
  scheduleId?: string;  // Link to schedule if generated
  metadata?: {
    karma?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskAssignment =
  | { type: 'unassigned' }
  | { type: 'member'; memberId: string }
  | { type: 'role'; role: 'parent' | 'child' };

export interface TaskSchedule {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: {
    daysOfWeek: number[];  // 0-6 (Sun-Sat)
    weeklyInterval: number;  // 1-4
    startDate: string;  // ISO 8601
    endDate?: string;  // ISO 8601
  };
  timeOfDay?: string;  // HH:mm format
  metadata?: {
    karma?: number;
  };
  lastGeneratedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  dueDate?: string;
  assignment: TaskAssignment;
  metadata?: {
    karma?: number;
  };
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  dueDate?: string;
  assignment?: TaskAssignment;
  completedAt?: string | null;
  metadata?: {
    karma?: number;
  };
}

export interface CreateScheduleRequest {
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: {
    daysOfWeek: number[];
    weeklyInterval: number;
    startDate: string;
    endDate?: string;
  };
  timeOfDay?: string;
  metadata?: {
    karma?: number;
  };
}

export interface UpdateScheduleRequest {
  name?: string;
  description?: string;
  assignment?: TaskAssignment;
  schedule?: {
    daysOfWeek?: number[];
    weeklyInterval?: number;
    startDate?: string;
    endDate?: string;
  };
  timeOfDay?: string;
  metadata?: {
    karma?: number;
  };
}

export interface TaskQueryParams {
  dueDateFrom?: string;
  dueDateTo?: string;
}
```

## UI Component Details

### Missing UI Components

**1. Tabs Component** (`apps/web/src/components/ui/tabs.tsx`):
- Copy from reference design
- Uses @radix-ui/react-tabs
- Already in reference, needs to be added to main app

**2. Checkbox Component** (`apps/web/src/components/ui/checkbox.tsx`):
- Uses @radix-ui/react-checkbox
- Standard shadcn/ui component
- Add via: `npx shadcn@latest add checkbox`

**3. Textarea Component** (`apps/web/src/components/ui/textarea.tsx`):
- Standard HTML textarea with styling
- Already in reference
- Copy to main app

### Task Card Layout

```
┌──────────────────────────────────────────────────────────┐
│ ☐ Task Name                              🌟 10 │ ⋮ Menu  │
│   Optional description text                               │
│   [User Badge] [Due Date] [Recurring] [Karma Badge]      │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
- Checkbox: Toggle completion
- Task Name: Bold, strikethrough if completed
- Description: Muted text, only if present
- Badges: Assignment, due date, recurring indicator
- Karma: Large display on right if present
- Menu: Edit / Delete dropdown

### Create/Edit Dialog

**Tabs for Create Mode**:
1. **Single Task**: Simple form
2. **Recurring Task**: Form + schedule selector

**Form Fields** (progressive disclosure):
- Name* (always visible, required)
- [+ Description] button → Textarea
- [+ Due] button → Date picker
- [+ Assignment] button → Select dropdown
- [+ Karma] button → Number input

**Schedule Selector** (recurring only):
```
┌─────────────────────────────────────────┐
│  🔄 Recurring Schedule                  │
│  ┌───────────────────────────────────┐ │
│  │ Repeat on:                        │ │
│  │ [Mon] [Tue] [Wed] [Thu] [Fri]    │ │
│  │ [Sat] [Sun]                       │ │
│  │                                    │ │
│  │ Frequency: [Every week ▼]         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Data Flow Diagrams

### Task Creation Flow
```
User clicks "New Task"
   │
   ├─> Open dialog
   │   │
   │   ├─> Select "Single Task" tab
   │   │   │
   │   │   ├─> Fill form
   │   │   │   (name, description, due, assignment, karma)
   │   │   │
   │   │   └─> Click "Create Task"
   │   │       │
   │   │       ├─> Dispatch createTask() thunk
   │   │       │   │
   │   │       │   ├─> POST /v1/families/{id}/tasks
   │   │       │   │
   │   │       │   ├─> Update Redux state (optimistic)
   │   │       │   │
   │   │       │   └─> Show success toast
   │   │       │
   │   │       └─> Close dialog
   │   │
   │   └─> Select "Recurring Task" tab
   │       │
   │       ├─> Fill form + select schedule
   │       │
   │       └─> Click "Create Task"
   │           │
   │           ├─> Dispatch createSchedule() thunk
   │           │   │
   │           │   ├─> POST /v1/families/{id}/tasks/schedules
   │           │   │
   │           │   └─> Update Redux state
   │           │
   │           └─> Close dialog
```

### Task Completion Flow
```
User clicks checkbox on task
   │
   ├─> Task has karma?
   │   │
   │   ├─ YES ──> Dispatch completeTask() thunk
   │   │          │
   │   │          ├─> PATCH /v1/families/{id}/tasks/{taskId}
   │   │          │   with { completedAt: now }
   │   │          │
   │   │          ├─> Update task in Redux
   │   │          │
   │   │          ├─> Dispatch incrementKarma(userId, amount)
   │   │          │
   │   │          └─> Show toast: "Great job! You earned X karma"
   │   │
   │   └─ NO ───> Dispatch updateTask() thunk
   │              │
   │              ├─> PATCH with { completedAt: now }
   │              │
   │              └─> Show toast: "Task completed"
```

### Filter Application Flow
```
User selects filter tab
   │
   ├─> Update local filter state
   │
   ├─> useMemo recalculates filteredTasks
   │   │
   │   ├─ "My Tasks" ──> Filter by assignment
   │   │                 (user ID or user role)
   │   │
   │   ├─ "All" ───────> Return all tasks
   │   │
   │   ├─ "Active" ────> Filter completedAt === null
   │   │
   │   └─ "Completed" ─> Filter completedAt !== null
   │
   └─> Re-render with filtered list
```

## i18n Strategy

### Translation Keys Structure
```json
{
  "dashboard": {
    "pages": {
      "tasks": {
        "title": "Tasks",
        "description": "Manage your family's tasks and chores",
        "filters": {
          "myTasks": "My Tasks",
          "all": "All Tasks",
          "active": "Active",
          "completed": "Completed"
        },
        "emptyState": {
          "title": "No tasks yet",
          "description": {
            "myTasks": "You don't have any tasks assigned to you yet",
            "default": "Create your first task to get started"
          },
          "cta": "Create Task"
        },
        "create": {
          "title": "Create New Task",
          "description": "Add a new task for your family",
          "tabs": {
            "single": "Single Task",
            "recurring": "Recurring Task"
          },
          "fields": {
            "name": {
              "label": "Task Name",
              "placeholder": "e.g., Take out the trash",
              "required": "Task name is required"
            },
            "description": {
              "label": "Description",
              "placeholder": "Add any additional details...",
              "add": "Description"
            },
            "dueDate": {
              "label": "Due",
              "add": "Due"
            },
            "assignment": {
              "label": "Assign To",
              "add": "Assignment",
              "options": {
                "unassigned": "Unassigned",
                "allParents": "All Parents",
                "allChildren": "All Children"
              }
            },
            "karma": {
              "label": "Karma Points",
              "placeholder": "e.g., 10",
              "add": "Karma"
            },
            "schedule": {
              "title": "Recurring Schedule",
              "repeatOn": "Repeat on",
              "frequency": {
                "label": "Frequency",
                "options": {
                  "weekly": "Every week",
                  "biweekly": "Every 2 weeks",
                  "triweekly": "Every 3 weeks",
                  "monthly": "Every 4 weeks"
                }
              }
            }
          },
          "buttons": {
            "cancel": "Cancel",
            "create": "Create Task",
            "creating": "Creating..."
          },
          "success": "Task created successfully",
          "error": "Failed to create task"
        },
        "edit": {
          "title": "Edit Task",
          "description": "Update the task details",
          "buttons": {
            "cancel": "Cancel",
            "update": "Update Task",
            "updating": "Updating..."
          },
          "success": "Task updated successfully",
          "error": "Failed to update task"
        },
        "delete": {
          "title": "Delete Task",
          "description": "Are you sure you want to delete this task?",
          "recurringTitle": "Delete Recurring Task",
          "recurringDescription": "This is a recurring task. Would you like to delete just this instance or all future occurrences?",
          "buttons": {
            "cancel": "Cancel",
            "deleteOne": "Delete This Task Only",
            "deleteAll": "Delete All Recurring Tasks"
          },
          "success": {
            "single": "Task deleted",
            "recurring": "Recurring tasks deleted"
          },
          "error": "Failed to delete task"
        },
        "complete": {
          "success": "Task completed",
          "successWithKarma": "Great job! You earned {karma} karma points",
          "reopen": "Task reopened"
        },
        "claim": {
          "button": "Claim Task",
          "success": "You've claimed \"{name}\""
        },
        "badges": {
          "unassigned": "Unassigned",
          "allParents": "All Parents",
          "allChildren": "All Children",
          "recurring": "Recurring",
          "karma": "{amount} Karma"
        },
        "menu": {
          "edit": "Edit",
          "delete": "Delete"
        },
        "loading": "Loading tasks...",
        "error": "Failed to load tasks"
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests (100% Coverage Goal)

**1. Redux Slice Tests** (`tasks.slice.test.ts`):
```typescript
describe('tasks slice', () => {
  describe('reducers', () => {
    it('should handle initial state')
    it('should add task optimistically')
    it('should update task optimistically')
    it('should remove task optimistically')
    it('should rollback on error')
  });

  describe('fetchTasks thunk', () => {
    it('should fetch tasks successfully')
    it('should handle fetch error')
    it('should set loading state correctly')
  });

  describe('createTask thunk', () => {
    it('should create single task')
    it('should handle validation errors')
    it('should rollback on API error')
  });

  describe('createSchedule thunk', () => {
    it('should create recurring schedule')
    it('should validate schedule fields')
  });

  describe('updateTask thunk', () => {
    it('should update task fields')
    it('should handle partial updates')
  });

  describe('completeTask thunk', () => {
    it('should complete task without karma')
    it('should complete task with karma and update balance')
    it('should mark as incomplete')
  });

  describe('deleteTask thunk', () => {
    it('should delete single task')
    it('should handle non-existent task')
  });

  describe('deleteSchedule thunk', () => {
    it('should delete schedule')
    it('should orphan existing tasks')
  });

  describe('selectors', () => {
    it('should select all tasks')
    it('should select task by id')
    it('should select loading state')
    it('should select error state')
  });
});
```

### E2E Tests (Complete User Journeys)

**Test File**: `apps/web/tests/e2e/tasks/tasks-page.spec.ts`

```typescript
test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to tasks page
  });

  test.describe('Task List', () => {
    test('should display all tasks by default')
    test('should display empty state when no tasks')
    test('should filter to my tasks')
    test('should filter to active tasks')
    test('should filter to completed tasks')
  });

  test.describe('Create Single Task', () => {
    test('should create task with only name')
    test('should create task with all fields')
    test('should create task with karma')
    test('should show validation for empty name')
    test('should add optional fields progressively')
  });

  test.describe('Create Recurring Task', () => {
    test('should create weekly recurring task')
    test('should create biweekly recurring task')
    test('should select multiple days')
    test('should validate at least one day selected')
  });

  test.describe('Update Task', () => {
    test('should edit task name')
    test('should add description to existing task')
    test('should change assignment')
    test('should add karma to task')
  });

  test.describe('Complete Task', () => {
    test('should mark task as complete')
    test('should complete task and award karma')
    test('should mark task as incomplete')
    test('should show in completed filter after completion')
  });

  test.describe('Delete Task', () => {
    test('should delete single task')
    test('should show confirmation for recurring task')
    test('should delete single recurring instance')
    test('should delete all recurring instances')
  });

  test.describe('Claim Task', () => {
    test('should claim unassigned task')
    test('should claim role-based task')
    test('should not show claim button for assigned task')
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile')
    test('should work on tablet')
    test('should work on desktop')
  });

  test.describe('i18n', () => {
    test('should display in English')
    test('should display in Dutch')
  });
});
```

## Performance Considerations

1. **Optimistic Updates**: Immediately update UI before API response
2. **Memoization**: Use `useMemo` for filtered tasks to avoid re-computation
3. **Lazy Loading**: Consider pagination if task list exceeds 100 items (future enhancement)
4. **Debouncing**: Not needed for this feature (no search input)
5. **Cache Strategy**: Redux persists in memory; fetch on mount

## Security Considerations

1. **Authorization**: All API calls include JWT token via cookies
2. **Family Scoping**: All operations scoped to familyId (backend validates)
3. **XSS Protection**: React automatically escapes text content
4. **Input Validation**: Zod schemas on backend validate all inputs
5. **CSRF**: Not applicable (stateless JWT auth)

## Accessibility Requirements

1. **Keyboard Navigation**: All interactive elements keyboard-accessible
2. **Screen Readers**:
   - Proper ARIA labels on checkboxes
   - Dialog announces title
   - Button labels describe action
3. **Focus Management**: Dialog traps focus, returns focus on close
4. **Color Contrast**: All text meets WCAG AA standards
5. **Touch Targets**: Minimum 44x44px for mobile

## Browser Compatibility

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- No IE11 support required

## Rollout Plan

1. Implement behind feature flag (optional)
2. Deploy to staging for internal testing
3. Monitor error rates and performance metrics
4. Gradual rollout to production (if feature flags used)

## Maintenance & Future Enhancements

**Potential Future Work** (out of current scope):
- Task search/filtering by name
- Task sorting (due date, creation date, karma)
- Task categories/tags
- Bulk operations (multi-select)
- Task templates
- Task comments/notes
- Subtasks/checklists
- File attachments
- Task history/audit log
- Calendar view of tasks
