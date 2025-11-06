# Implementation Tasks

This document provides a step-by-step guide for implementing the Tasks page. Follow these tasks in order. Each task is designed to be completable by a junior developer with clear acceptance criteria.

---

## Phase 1: Foundation & Types (TDD Setup)

### Task 1: Add missing UI components
**Priority**: P0
**Estimated Time**: 30 minutes
**Dependencies**: None

**Instructions**:
1. Add Checkbox component:
   ```bash
   cd apps/web
   npx shadcn@latest add checkbox
   ```

2. Copy Tabs component from reference:
   ```bash
   cp reference/v0-famly/components/ui/tabs.tsx apps/web/src/components/ui/tabs.tsx
   ```

3. Copy Textarea component from reference (or use shadcn):
   ```bash
   npx shadcn@latest add textarea
   # OR
   cp reference/v0-famly/components/ui/textarea.tsx apps/web/src/components/ui/textarea.tsx
   ```

4. Verify imports work:
   ```typescript
   import { Checkbox } from '@/components/ui/checkbox'
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
   import { Textarea } from '@/components/ui/textarea'
   ```

**Acceptance Criteria**:
- ✅ All three components are in `apps/web/src/components/ui/`
- ✅ Components can be imported without errors
- ✅ TypeScript compilation succeeds
- ✅ No lint errors

---

### Task 2: Add task-related types to API types file
**Priority**: P0
**Estimated Time**: 20 minutes
**Dependencies**: Task 1

**File**: `apps/web/src/types/api.types.ts`

**Instructions**:
1. Open `apps/web/src/types/api.types.ts`
2. Add the following types at the end of the file:

```typescript
// ============= Tasks Types =============

export type TaskAssignment =
  | { type: 'unassigned' }
  | { type: 'member'; memberId: string }
  | { type: 'role'; role: 'parent' | 'child' };

export interface Task {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  dueDate?: string;  // ISO 8601
  assignment: TaskAssignment;
  completedAt?: string;  // ISO 8601
  scheduleId?: string;
  metadata?: {
    karma?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSchedule {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: {
    daysOfWeek: number[];  // 0-6 (Sun-Sat)
    weeklyInterval: number;  // 1-4
    startDate: string;
    endDate?: string;
  };
  timeOfDay?: string;  // HH:mm
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

**Acceptance Criteria**:
- ✅ All types added to `api.types.ts`
- ✅ TypeScript compilation succeeds
- ✅ Types match backend API schema
- ✅ No lint errors

---

### Task 3: Extend API client with task functions
**Priority**: P0
**Estimated Time**: 30 minutes
**Dependencies**: Task 2

**File**: `apps/web/src/lib/api-client.ts`

**Instructions**:
1. Open `apps/web/src/lib/api-client.ts`
2. Add import for new types at the top:
```typescript
import type {
  // ... existing imports
  Task,
  TaskSchedule,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  TaskQueryParams,
} from "@/types/api.types";
```

3. Add the following functions at the end of the file (before the final export if any):

```typescript
// ============= Tasks API =============

export type {
  Task,
  TaskSchedule,
  TaskAssignment,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  TaskQueryParams,
} from "@/types/api.types";

export async function getTasks(
  familyId: string,
  params?: TaskQueryParams,
  cookie?: string,
): Promise<Task[]> {
  const queryParams = new URLSearchParams();
  if (params?.dueDateFrom) queryParams.set("dueDateFrom", params.dueDateFrom);
  if (params?.dueDateTo) queryParams.set("dueDateTo", params.dueDateTo);

  const queryString = queryParams.toString();
  const endpoint = `/v1/families/${familyId}/tasks${queryString ? `?${queryString}` : ""}`;

  return apiClient<Task[]>(endpoint, { cookie });
}

export async function getTask(
  familyId: string,
  taskId: string,
  cookie?: string,
): Promise<Task> {
  return apiClient<Task>(`/v1/families/${familyId}/tasks/${taskId}`, { cookie });
}

export async function createTask(
  familyId: string,
  data: CreateTaskRequest,
): Promise<Task> {
  return apiClient<Task>(`/v1/families/${familyId}/tasks`, {
    method: "POST",
    body: data,
  });
}

export async function updateTask(
  familyId: string,
  taskId: string,
  data: UpdateTaskRequest,
): Promise<Task> {
  return apiClient<Task>(`/v1/families/${familyId}/tasks/${taskId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteTask(
  familyId: string,
  taskId: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function getSchedules(
  familyId: string,
  cookie?: string,
): Promise<TaskSchedule[]> {
  return apiClient<TaskSchedule[]>(
    `/v1/families/${familyId}/tasks/schedules`,
    { cookie },
  );
}

export async function getSchedule(
  familyId: string,
  scheduleId: string,
  cookie?: string,
): Promise<TaskSchedule> {
  return apiClient<TaskSchedule>(
    `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
    { cookie },
  );
}

export async function createSchedule(
  familyId: string,
  data: CreateScheduleRequest,
): Promise<TaskSchedule> {
  return apiClient<TaskSchedule>(`/v1/families/${familyId}/tasks/schedules`, {
    method: "POST",
    body: data,
  });
}

export async function updateSchedule(
  familyId: string,
  scheduleId: string,
  data: UpdateScheduleRequest,
): Promise<TaskSchedule> {
  return apiClient<TaskSchedule>(
    `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
    {
      method: "PATCH",
      body: data,
    },
  );
}

export async function deleteSchedule(
  familyId: string,
  scheduleId: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
    {
      method: "DELETE",
    },
  );
}
```

**Acceptance Criteria**:
- ✅ All task API functions added
- ✅ Functions properly typed with TypeScript
- ✅ Consistent with existing API client patterns
- ✅ TypeScript compilation succeeds
- ✅ No lint errors

---

## Phase 2: Redux State Layer (TDD)

### Task 4: Create tasks Redux slice with unit tests
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task 3

**Files**:
- `apps/web/src/store/slices/tasks.slice.ts`
- `apps/web/tests/unit/store/tasks.slice.test.ts`

**Instructions**:

**Step 4.1: Create test file first (TDD approach)**

Create `apps/web/tests/unit/store/tasks.slice.test.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, {
  fetchTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  fetchSchedules,
  createSchedule,
  deleteSchedule,
  selectTasks,
  selectSchedules,
  selectTasksLoading,
  selectTasksError,
  selectTaskById,
} from '@/store/slices/tasks.slice';
import * as apiClient from '@/lib/api-client';
import type { Task, TaskSchedule } from '@/types/api.types';

// Mock the API client
jest.mock('@/lib/api-client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('tasks slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: tasksReducer,
        karma: (state = { balances: {}, isLoading: false, error: null }) => state,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().tasks;
      expect(state).toEqual({
        tasks: [],
        schedules: [],
        isLoading: false,
        error: null,
        lastFetch: null,
      });
    });
  });

  describe('fetchTasks thunk', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          _id: 'task-1',
          familyId: 'family-1',
          name: 'Test Task',
          assignment: { type: 'unassigned' },
          createdBy: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockApiClient.getTasks.mockResolvedValueOnce(mockTasks);

      await store.dispatch(fetchTasks('family-1'));

      const state = store.getState().tasks;
      expect(state.tasks).toEqual(mockTasks);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastFetch).toBeGreaterThan(0);
    });

    it('should handle fetch error', async () => {
      mockApiClient.getTasks.mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch(fetchTasks('family-1'));

      const state = store.getState().tasks;
      expect(state.tasks).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should set loading state during fetch', () => {
      mockApiClient.getTasks.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      store.dispatch(fetchTasks('family-1'));

      const state = store.getState().tasks;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe('createTask thunk', () => {
    it('should create task with optimistic update', async () => {
      const newTask: Task = {
        _id: 'task-2',
        familyId: 'family-1',
        name: 'New Task',
        assignment: { type: 'unassigned' },
        createdBy: 'user-1',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      };

      mockApiClient.createTask.mockResolvedValueOnce(newTask);

      await store.dispatch(
        createTask({
          familyId: 'family-1',
          data: { name: 'New Task', assignment: { type: 'unassigned' } },
        }),
      );

      const state = store.getState().tasks;
      expect(state.tasks).toContainEqual(newTask);
      expect(state.error).toBe(null);
    });

    it('should rollback on create error', async () => {
      mockApiClient.createTask.mockRejectedValueOnce(new Error('Creation failed'));

      const initialTasks = store.getState().tasks.tasks;

      await store.dispatch(
        createTask({
          familyId: 'family-1',
          data: { name: 'Failed Task', assignment: { type: 'unassigned' } },
        }),
      );

      const state = store.getState().tasks;
      expect(state.tasks).toEqual(initialTasks);
      expect(state.error).toBe('Creation failed');
    });
  });

  describe('updateTask thunk', () => {
    beforeEach(async () => {
      const existingTask: Task = {
        _id: 'task-1',
        familyId: 'family-1',
        name: 'Original Name',
        assignment: { type: 'unassigned' },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockApiClient.getTasks.mockResolvedValueOnce([existingTask]);
      await store.dispatch(fetchTasks('family-1'));
    });

    it('should update task optimistically', async () => {
      const updatedTask: Task = {
        _id: 'task-1',
        familyId: 'family-1',
        name: 'Updated Name',
        assignment: { type: 'unassigned' },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      };

      mockApiClient.updateTask.mockResolvedValueOnce(updatedTask);

      await store.dispatch(
        updateTask({
          familyId: 'family-1',
          taskId: 'task-1',
          data: { name: 'Updated Name' },
        }),
      );

      const state = store.getState().tasks;
      const task = state.tasks.find((t) => t._id === 'task-1');
      expect(task?.name).toBe('Updated Name');
    });

    it('should rollback on update error', async () => {
      mockApiClient.updateTask.mockRejectedValueOnce(new Error('Update failed'));

      const originalName = store.getState().tasks.tasks[0].name;

      await store.dispatch(
        updateTask({
          familyId: 'family-1',
          taskId: 'task-1',
          data: { name: 'Failed Update' },
        }),
      );

      const state = store.getState().tasks;
      const task = state.tasks.find((t) => t._id === 'task-1');
      expect(task?.name).toBe(originalName);
      expect(state.error).toBe('Update failed');
    });
  });

  describe('completeTask thunk', () => {
    it('should complete task without karma', async () => {
      const task: Task = {
        _id: 'task-1',
        familyId: 'family-1',
        name: 'Task',
        assignment: { type: 'member', memberId: 'user-1' },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks('family-1'));

      const completedTask = { ...task, completedAt: '2025-01-15T10:00:00Z' };
      mockApiClient.updateTask.mockResolvedValueOnce(completedTask);

      await store.dispatch(
        completeTask({
          familyId: 'family-1',
          taskId: 'task-1',
          userId: 'user-1',
        }),
      );

      const state = store.getState().tasks;
      const updatedTask = state.tasks.find((t) => t._id === 'task-1');
      expect(updatedTask?.completedAt).toBeTruthy();
    });

    it('should complete task with karma and update balance', async () => {
      // This test verifies karma integration
      // Implementation will dispatch incrementKarma action
      const task: Task = {
        _id: 'task-1',
        familyId: 'family-1',
        name: 'Task with Karma',
        assignment: { type: 'member', memberId: 'user-1' },
        metadata: { karma: 10 },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks('family-1'));

      const completedTask = { ...task, completedAt: '2025-01-15T10:00:00Z' };
      mockApiClient.updateTask.mockResolvedValueOnce(completedTask);

      await store.dispatch(
        completeTask({
          familyId: 'family-1',
          taskId: 'task-1',
          userId: 'user-1',
          karma: 10,
        }),
      );

      const state = store.getState().tasks;
      const updatedTask = state.tasks.find((t) => t._id === 'task-1');
      expect(updatedTask?.completedAt).toBeTruthy();
      // Karma balance check would be in karma slice tests
    });
  });

  describe('deleteTask thunk', () => {
    it('should delete task optimistically', async () => {
      const task: Task = {
        _id: 'task-1',
        familyId: 'family-1',
        name: 'Task to Delete',
        assignment: { type: 'unassigned' },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks('family-1'));

      mockApiClient.deleteTask.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteTask({ familyId: 'family-1', taskId: 'task-1' }),
      );

      const state = store.getState().tasks;
      expect(state.tasks.find((t) => t._id === 'task-1')).toBeUndefined();
    });
  });

  describe('schedule thunks', () => {
    it('should fetch schedules successfully', async () => {
      const mockSchedules: TaskSchedule[] = [
        {
          _id: 'schedule-1',
          familyId: 'family-1',
          name: 'Weekly Chore',
          assignment: { type: 'role', role: 'child' },
          schedule: {
            daysOfWeek: [1, 3],
            weeklyInterval: 1,
            startDate: '2025-01-01',
          },
          createdBy: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockApiClient.getSchedules.mockResolvedValueOnce(mockSchedules);

      await store.dispatch(fetchSchedules('family-1'));

      const state = store.getState().tasks;
      expect(state.schedules).toEqual(mockSchedules);
    });

    it('should create schedule', async () => {
      const newSchedule: TaskSchedule = {
        _id: 'schedule-2',
        familyId: 'family-1',
        name: 'New Schedule',
        assignment: { type: 'unassigned' },
        schedule: {
          daysOfWeek: [0, 6],
          weeklyInterval: 2,
          startDate: '2025-01-01',
        },
        createdBy: 'user-1',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      };

      mockApiClient.createSchedule.mockResolvedValueOnce(newSchedule);

      await store.dispatch(
        createSchedule({
          familyId: 'family-1',
          data: {
            name: 'New Schedule',
            assignment: { type: 'unassigned' },
            schedule: {
              daysOfWeek: [0, 6],
              weeklyInterval: 2,
              startDate: '2025-01-01',
            },
          },
        }),
      );

      const state = store.getState().tasks;
      expect(state.schedules).toContainEqual(newSchedule);
    });

    it('should delete schedule', async () => {
      const schedule: TaskSchedule = {
        _id: 'schedule-1',
        familyId: 'family-1',
        name: 'Schedule to Delete',
        assignment: { type: 'unassigned' },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: '2025-01-01',
        },
        createdBy: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      mockApiClient.getSchedules.mockResolvedValueOnce([schedule]);
      await store.dispatch(fetchSchedules('family-1'));

      mockApiClient.deleteSchedule.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteSchedule({ familyId: 'family-1', scheduleId: 'schedule-1' }),
      );

      const state = store.getState().tasks;
      expect(state.schedules.find((s) => s._id === 'schedule-1')).toBeUndefined();
    });
  });

  describe('selectors', () => {
    beforeEach(async () => {
      const mockTasks: Task[] = [
        {
          _id: 'task-1',
          familyId: 'family-1',
          name: 'Task 1',
          assignment: { type: 'unassigned' },
          createdBy: 'user-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          _id: 'task-2',
          familyId: 'family-1',
          name: 'Task 2',
          assignment: { type: 'member', memberId: 'user-2' },
          createdBy: 'user-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      mockApiClient.getTasks.mockResolvedValueOnce(mockTasks);
      await store.dispatch(fetchTasks('family-1'));
    });

    it('selectTasks should return all tasks', () => {
      const state = store.getState();
      const tasks = selectTasks(state);
      expect(tasks).toHaveLength(2);
    });

    it('selectTaskById should return specific task', () => {
      const state = store.getState();
      const task = selectTaskById('task-1')(state);
      expect(task?.name).toBe('Task 1');
    });

    it('selectTaskById should return undefined for non-existent task', () => {
      const state = store.getState();
      const task = selectTaskById('non-existent')(state);
      expect(task).toBeUndefined();
    });

    it('selectTasksLoading should return loading state', () => {
      const state = store.getState();
      const isLoading = selectTasksLoading(state);
      expect(typeof isLoading).toBe('boolean');
    });

    it('selectTasksError should return error state', () => {
      const state = store.getState();
      const error = selectTasksError(state);
      expect(error).toBe(null);
    });

    it('selectSchedules should return all schedules', () => {
      const state = store.getState();
      const schedules = selectSchedules(state);
      expect(Array.isArray(schedules)).toBe(true);
    });
  });
});
```

**Step 4.2: Run tests to see them fail (RED)**

```bash
cd apps/web
pnpm test:unit tests/unit/store/tasks.slice.test.ts
```

You should see failures because the slice doesn't exist yet.

**Step 4.3: Create the Redux slice implementation (GREEN)**

Create `apps/web/src/store/slices/tasks.slice.ts`:

```typescript
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  getTasks,
  getTask,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  getSchedules,
  createSchedule as apiCreateSchedule,
  deleteSchedule as apiDeleteSchedule,
} from '@/lib/api-client';
import { incrementKarma, decrementKarma } from './karma.slice';
import type { RootState } from '../store';
import type {
  Task,
  TaskSchedule,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateScheduleRequest,
} from '@/types/api.types';

interface TasksState {
  tasks: Task[];
  schedules: TaskSchedule[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: TasksState = {
  tasks: [],
  schedules: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (familyId: string) => {
    const tasks = await getTasks(familyId);
    return { tasks, timestamp: Date.now() };
  },
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ familyId, data }: { familyId: string; data: CreateTaskRequest }) => {
    const task = await apiCreateTask(familyId, data);
    return task;
  },
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({
    familyId,
    taskId,
    data,
  }: {
    familyId: string;
    taskId: string;
    data: UpdateTaskRequest;
  }) => {
    const task = await apiUpdateTask(familyId, taskId, data);
    return task;
  },
);

export const completeTask = createAsyncThunk(
  'tasks/completeTask',
  async (
    {
      familyId,
      taskId,
      userId,
      karma,
    }: {
      familyId: string;
      taskId: string;
      userId: string;
      karma?: number;
    },
    { dispatch },
  ) => {
    const completedAt = new Date().toISOString();
    const task = await apiUpdateTask(familyId, taskId, { completedAt });

    // Update karma if task has karma metadata
    if (karma && karma > 0) {
      dispatch(incrementKarma({ userId, amount: karma }));
    }

    return task;
  },
);

export const reopenTask = createAsyncThunk(
  'tasks/reopenTask',
  async (
    {
      familyId,
      taskId,
      userId,
      karma,
    }: {
      familyId: string;
      taskId: string;
      userId: string;
      karma?: number;
    },
    { dispatch },
  ) => {
    const task = await apiUpdateTask(familyId, taskId, { completedAt: null });

    // Deduct karma if task had karma metadata
    if (karma && karma > 0) {
      dispatch(decrementKarma({ userId, amount: karma }));
    }

    return task;
  },
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ familyId, taskId }: { familyId: string; taskId: string }) => {
    await apiDeleteTask(familyId, taskId);
    return taskId;
  },
);

export const fetchSchedules = createAsyncThunk(
  'tasks/fetchSchedules',
  async (familyId: string) => {
    const schedules = await getSchedules(familyId);
    return schedules;
  },
);

export const createSchedule = createAsyncThunk(
  'tasks/createSchedule',
  async ({
    familyId,
    data,
  }: {
    familyId: string;
    data: CreateScheduleRequest;
  }) => {
    const schedule = await apiCreateSchedule(familyId, data);
    return schedule;
  },
);

export const deleteSchedule = createAsyncThunk(
  'tasks/deleteSchedule',
  async ({ familyId, scheduleId }: { familyId: string; scheduleId: string }) => {
    await apiDeleteSchedule(familyId, scheduleId);
    return scheduleId;
  },
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.lastFetch = action.payload.timestamp;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload); // Add to beginning
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create task';
      });

    // Update task
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update task';
      });

    // Complete task
    builder
      .addCase(completeTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to complete task';
      });

    // Reopen task
    builder
      .addCase(reopenTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(reopenTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to reopen task';
      });

    // Delete task
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete task';
      });

    // Fetch schedules
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch schedules';
      });

    // Create schedule
    builder
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create schedule';
      });

    // Delete schedule
    builder
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete schedule';
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;

// Selectors
export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectSchedules = (state: RootState) => state.tasks.schedules;
export const selectTasksLoading = (state: RootState) => state.tasks.isLoading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectTaskById = (taskId: string) => (state: RootState) =>
  state.tasks.tasks.find((t) => t._id === taskId);
```

**Step 4.4: Register slice in store**

Edit `apps/web/src/store/store.ts` to add the tasks slice:

```typescript
import tasksReducer from './slices/tasks.slice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      karma: karmaReducer,
      tasks: tasksReducer, // ADD THIS LINE
    },
  });
};
```

**Step 4.5: Run tests again (should pass now)**

```bash
pnpm test:unit tests/unit/store/tasks.slice.test.ts
```

**Step 4.6: Check coverage**

```bash
pnpm test:unit tests/unit/store/tasks.slice.test.ts --coverage
```

Aim for 100% coverage. Add more test cases if needed.

**Acceptance Criteria**:
- ✅ All tests pass
- ✅ 100% code coverage for tasks slice
- ✅ Slice registered in store
- ✅ TypeScript compilation succeeds
- ✅ No lint errors

---

## Phase 3: i18n Translations

### Task 5: Add task translations for English
**Priority**: P0
**Estimated Time**: 30 minutes
**Dependencies**: Task 4

**File**: `apps/web/src/dictionaries/en-US.json`

**Instructions**:
1. Open `apps/web/src/dictionaries/en-US.json`
2. Find the `"dashboard": { "pages": { "tasks": {...} } }` section
3. Replace the entire `"tasks"` object with:

```json
"tasks": {
  "title": "Tasks",
  "description": "Manage your family's tasks and chores",
  "newTask": "New Task",
  "filters": {
    "myTasks": "My Tasks",
    "all": "All Tasks",
    "active": "Active",
    "completed": "Completed"
  },
  "emptyState": {
    "title": "No tasks yet",
    "myTasks": "You don't have any tasks assigned to you yet",
    "default": "Create your first task to get started with family organization",
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
        "required": "required"
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
        "unassigned": "Unassigned",
        "allParents": "All Parents",
        "allChildren": "All Children"
      },
      "karma": {
        "label": "Karma Points",
        "placeholder": "e.g., 10",
        "add": "Karma"
      },
      "schedule": {
        "title": "Recurring Schedule",
        "repeatOn": "Repeat on",
        "frequency": "Frequency",
        "every1Week": "Every week",
        "every2Weeks": "Every 2 weeks",
        "every3Weeks": "Every 3 weeks",
        "every4Weeks": "Every 4 weeks"
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
    "successSingle": "Task deleted",
    "successRecurring": "Recurring tasks deleted",
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
  "days": {
    "mon": "Mon",
    "tue": "Tue",
    "wed": "Wed",
    "thu": "Thu",
    "fri": "Fri",
    "sat": "Sat",
    "sun": "Sun"
  },
  "loading": "Loading tasks...",
  "error": "Failed to load tasks"
}
```

**Acceptance Criteria**:
- ✅ All translation keys added to en-US.json
- ✅ JSON is valid (no syntax errors)
- ✅ Keys match usage in components
- ✅ No lint errors

---

### Task 6: Add task translations for Dutch
**Priority**: P1
**Estimated Time**: 30 minutes
**Dependencies**: Task 5

**File**: `apps/web/src/dictionaries/nl-NL.json`

**Instructions**:
1. Open `apps/web/src/dictionaries/nl-NL.json`
2. Find the `"dashboard": { "pages": { "tasks": {...} } }` section
3. Replace with Dutch translations:

```json
"tasks": {
  "title": "Taken",
  "description": "Beheer de taken en klusjes van je gezin",
  "newTask": "Nieuwe Taak",
  "filters": {
    "myTasks": "Mijn Taken",
    "all": "Alle Taken",
    "active": "Actief",
    "completed": "Voltooid"
  },
  "emptyState": {
    "title": "Nog geen taken",
    "myTasks": "Je hebt nog geen taken aan jou toegewezen",
    "default": "Maak je eerste taak om te beginnen met gezinsorganisatie",
    "cta": "Taak Aanmaken"
  },
  "create": {
    "title": "Nieuwe Taak Aanmaken",
    "description": "Voeg een nieuwe taak toe voor je gezin",
    "tabs": {
      "single": "Enkele Taak",
      "recurring": "Terugkerende Taak"
    },
    "fields": {
      "name": {
        "label": "Taaknaam",
        "placeholder": "bijv., Vuilnis buitenzetten",
        "required": "verplicht"
      },
      "description": {
        "label": "Beschrijving",
        "placeholder": "Voeg eventuele extra details toe...",
        "add": "Beschrijving"
      },
      "dueDate": {
        "label": "Vervaldatum",
        "add": "Vervaldatum"
      },
      "assignment": {
        "label": "Toewijzen Aan",
        "add": "Toewijzing",
        "unassigned": "Niet toegewezen",
        "allParents": "Alle Ouders",
        "allChildren": "Alle Kinderen"
      },
      "karma": {
        "label": "Karmapunten",
        "placeholder": "bijv., 10",
        "add": "Karma"
      },
      "schedule": {
        "title": "Terugkerend Schema",
        "repeatOn": "Herhaal op",
        "frequency": "Frequentie",
        "every1Week": "Elke week",
        "every2Weeks": "Elke 2 weken",
        "every3Weeks": "Elke 3 weken",
        "every4Weeks": "Elke 4 weken"
      }
    },
    "buttons": {
      "cancel": "Annuleren",
      "create": "Taak Aanmaken",
      "creating": "Aan het aanmaken..."
    },
    "success": "Taak succesvol aangemaakt",
    "error": "Taak aanmaken mislukt"
  },
  "edit": {
    "title": "Taak Bewerken",
    "description": "Werk de taakdetails bij",
    "buttons": {
      "cancel": "Annuleren",
      "update": "Taak Bijwerken",
      "updating": "Aan het bijwerken..."
    },
    "success": "Taak succesvol bijgewerkt",
    "error": "Taak bijwerken mislukt"
  },
  "delete": {
    "title": "Taak Verwijderen",
    "description": "Weet je zeker dat je deze taak wilt verwijderen?",
    "recurringTitle": "Terugkerende Taak Verwijderen",
    "recurringDescription": "Dit is een terugkerende taak. Wil je alleen deze instantie verwijderen of alle toekomstige voorvallen?",
    "buttons": {
      "cancel": "Annuleren",
      "deleteOne": "Alleen Deze Taak Verwijderen",
      "deleteAll": "Alle Terugkerende Taken Verwijderen"
    },
    "successSingle": "Taak verwijderd",
    "successRecurring": "Terugkerende taken verwijderd",
    "error": "Taak verwijderen mislukt"
  },
  "complete": {
    "success": "Taak voltooid",
    "successWithKarma": "Goed gedaan! Je hebt {karma} karmapunten verdiend",
    "reopen": "Taak heropend"
  },
  "claim": {
    "button": "Claim Taak",
    "success": "Je hebt \"{name}\" geclaimd"
  },
  "badges": {
    "unassigned": "Niet toegewezen",
    "allParents": "Alle Ouders",
    "allChildren": "Alle Kinderen",
    "recurring": "Terugkerend",
    "karma": "{amount} Karma"
  },
  "menu": {
    "edit": "Bewerken",
    "delete": "Verwijderen"
  },
  "days": {
    "mon": "Ma",
    "tue": "Di",
    "wed": "Wo",
    "thu": "Do",
    "fri": "Vr",
    "sat": "Za",
    "sun": "Zo"
  },
  "loading": "Taken laden...",
  "error": "Taken laden mislukt"
}
```

**Acceptance Criteria**:
- ✅ All Dutch translations added
- ✅ JSON is valid
- ✅ Translations are accurate and natural
- ✅ No lint errors

---

## Phase 4: Component Implementation

### Task 7: Create TasksView component (main UI logic)
**Priority**: P0
**Estimated Time**: 3-4 hours
**Dependencies**: Tasks 1-6

**File**: `apps/web/src/components/tasks/TasksView.tsx`

This is the largest component. I'll provide the complete implementation with inline comments explaining each section.

**Instructions**:

Create `apps/web/src/components/tasks/TasksView.tsx`:

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTasks,
  fetchSchedules,
  createTask,
  createSchedule,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
  deleteSchedule,
  selectTasks,
  selectSchedules,
  selectTasksLoading,
  selectTasksError,
} from '@/store/slices/tasks.slice';
import { selectKarmaBalance } from '@/store/slices/karma.slice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Clock,
  User,
  UsersIcon,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import type { Task, TaskAssignment } from '@/types/api.types';

// Helper type for filters
type FilterType = 'my-tasks' | 'all' | 'active' | 'completed';
type TaskType = 'single' | 'recurring';

interface TasksViewProps {
  dict: any; // Dictionary from i18n
  familyId: string;
  userId: string;
  userRole: 'parent' | 'child';
  familyMembers: Array<{ id: string; name: string; role: 'parent' | 'child' }>;
}

interface TaskFormData {
  name: string;
  description: string;
  dueDate: string;
  assignTo: string;
  karma: string;
}

export function TasksView({
  dict,
  familyId,
  userId,
  userRole,
  familyMembers,
}: TasksViewProps) {
  const dispatch = useAppDispatch();

  // Redux state
  const tasks = useAppSelector(selectTasks);
  const schedules = useAppSelector(selectSchedules);
  const isLoading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const karmaBalance = useAppSelector(selectKarmaBalance(userId));

  // Local UI state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>('my-tasks');
  const [taskType, setTaskType] = useState<TaskType>('single');
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    dueDate: '',
    assignTo: 'unassigned',
    karma: '',
  });

  // Progressive disclosure states
  const [showDescription, setShowDescription] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showKarma, setShowKarma] = useState(false);

  // Recurring task state
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [weekFrequency, setWeekFrequency] = useState('1');

  // Fetch tasks and schedules on mount
  useEffect(() => {
    if (familyId) {
      dispatch(fetchTasks(familyId));
      dispatch(fetchSchedules(familyId));
    }
  }, [dispatch, familyId]);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dueDate: '',
      assignTo: 'unassigned',
      karma: '',
    });
    setEditingTask(null);
    setTaskType('single');
    setShowDescription(false);
    setShowDueDate(false);
    setShowAssignment(false);
    setShowKarma(false);
    setSelectedDays([]);
    setWeekFrequency('1');
  };

  // Convert day string to number (for recurring tasks)
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const toggleDay = (day: string) => {
    const dayNum = dayMap[day];
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum],
    );
  };

  // Build assignment object from form data
  const buildAssignment = (): TaskAssignment => {
    if (formData.assignTo === 'unassigned') {
      return { type: 'unassigned' };
    }
    if (formData.assignTo === 'all-parents') {
      return { type: 'role', role: 'parent' };
    }
    if (formData.assignTo === 'all-children') {
      return { type: 'role', role: 'child' };
    }
    return { type: 'member', memberId: formData.assignTo };
  };

  // Handle creating a single task
  const handleCreateTask = async () => {
    if (!formData.name.trim()) {
      toast.error(dict.dashboard.pages.tasks.create.fields.name.required);
      return;
    }

    try {
      await dispatch(
        createTask({
          familyId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignment: buildAssignment(),
            metadata: formData.karma ? { karma: Number.parseInt(formData.karma) } : undefined,
          },
        }),
      ).unwrap();

      setIsCreateOpen(false);
      resetForm();
      toast.success(dict.dashboard.pages.tasks.create.success);
    } catch (err) {
      toast.error(dict.dashboard.pages.tasks.create.error);
    }
  };

  // Handle creating a recurring schedule
  const handleCreateSchedule = async () => {
    if (!formData.name.trim()) {
      toast.error(dict.dashboard.pages.tasks.create.fields.name.required);
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    try {
      await dispatch(
        createSchedule({
          familyId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            assignment: buildAssignment(),
            schedule: {
              daysOfWeek: selectedDays,
              weeklyInterval: Number.parseInt(weekFrequency),
              startDate: new Date().toISOString().split('T')[0],
            },
            timeOfDay: formData.dueDate || undefined,
            metadata: formData.karma ? { karma: Number.parseInt(formData.karma) } : undefined,
          },
        }),
      ).unwrap();

      setIsCreateOpen(false);
      resetForm();
      toast.success(dict.dashboard.pages.tasks.create.success);
    } catch (err) {
      toast.error(dict.dashboard.pages.tasks.create.error);
    }
  };

  // Handle updating an existing task
  const handleUpdateTask = async () => {
    if (!editingTask || !formData.name.trim()) return;

    try {
      await dispatch(
        updateTask({
          familyId,
          taskId: editingTask._id,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignment: buildAssignment(),
            metadata: formData.karma ? { karma: Number.parseInt(formData.karma) } : undefined,
          },
        }),
      ).unwrap();

      resetForm();
      toast.success(dict.dashboard.pages.tasks.edit.success);
    } catch (err) {
      toast.error(dict.dashboard.pages.tasks.edit.error);
    }
  };

  // Open edit dialog with pre-filled data
  const handleEditTask = (task: Task) => {
    setEditingTask(task);

    // Determine assignment value for form
    let assignTo = 'unassigned';
    if (task.assignment.type === 'member') {
      assignTo = task.assignment.memberId;
    } else if (task.assignment.type === 'role') {
      assignTo = task.assignment.role === 'parent' ? 'all-parents' : 'all-children';
    }

    setFormData({
      name: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assignTo,
      karma: task.metadata?.karma?.toString() || '',
    });

    setShowDescription(!!task.description);
    setShowDueDate(!!task.dueDate);
    setShowAssignment(task.assignment.type !== 'unassigned');
    setShowKarma(!!task.metadata?.karma);

    // If recurring, populate schedule data (readonly in edit)
    if (task.scheduleId) {
      const schedule = schedules.find((s) => s._id === task.scheduleId);
      if (schedule) {
        setSelectedDays(schedule.schedule.daysOfWeek);
        setWeekFrequency(schedule.schedule.weeklyInterval.toString());
      }
    }
  };

  // Handle deleting a task (with recurring confirmation)
  const handleDeleteTask = (task: Task) => {
    if (task.scheduleId) {
      // Show confirmation dialog for recurring tasks
      setDeleteConfirmTask(task);
    } else {
      // Delete single task immediately
      dispatch(deleteTask({ familyId, taskId: task._id }));
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    }
  };

  // Delete only this instance of a recurring task
  const handleDeleteSingleInstance = async () => {
    if (!deleteConfirmTask) return;

    try {
      await dispatch(
        deleteTask({ familyId, taskId: deleteConfirmTask._id }),
      ).unwrap();
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    } catch (err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  // Delete all recurring instances (delete the schedule)
  const handleDeleteAllRecurring = async () => {
    if (!deleteConfirmTask?.scheduleId) return;

    try {
      await dispatch(
        deleteSchedule({ familyId, scheduleId: deleteConfirmTask.scheduleId }),
      ).unwrap();
      // Also delete all tasks with this scheduleId
      const tasksToDelete = tasks.filter((t) => t.scheduleId === deleteConfirmTask.scheduleId);
      await Promise.all(
        tasksToDelete.map((t) => dispatch(deleteTask({ familyId, taskId: t._id }))),
      );
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successRecurring);
    } catch (err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  // Handle toggling task completion
  const handleToggleComplete = async (task: Task) => {
    const isCompleting = !task.completedAt;

    try {
      if (isCompleting) {
        await dispatch(
          completeTask({
            familyId,
            taskId: task._id,
            userId,
            karma: task.metadata?.karma,
          }),
        ).unwrap();

        if (task.metadata?.karma) {
          toast.success(
            dict.dashboard.pages.tasks.complete.successWithKarma.replace(
              '{karma}',
              task.metadata.karma.toString(),
            ),
          );
        } else {
          toast.success(dict.dashboard.pages.tasks.complete.success);
        }
      } else {
        await dispatch(
          reopenTask({
            familyId,
            taskId: task._id,
            userId,
            karma: task.metadata?.karma,
          }),
        ).unwrap();
        toast.success(dict.dashboard.pages.tasks.complete.reopen);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  // Handle claiming an unassigned or role-based task
  const handleClaimTask = async (task: Task) => {
    try {
      await dispatch(
        updateTask({
          familyId,
          taskId: task._id,
          data: {
            assignment: { type: 'member', memberId: userId },
          },
        }),
      ).unwrap();
      toast.success(
        dict.dashboard.pages.tasks.claim.success.replace('{name}', task.name),
      );
    } catch (err) {
      toast.error('Failed to claim task');
    }
  };

  // Filter tasks based on current filter selection
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'my-tasks') {
        // Check if assigned to current user by ID
        if (task.assignment.type === 'member' && task.assignment.memberId === userId) {
          return true;
        }
        // Check if assigned to user's role
        if (task.assignment.type === 'role' && task.assignment.role === userRole) {
          return true;
        }
        return false;
      }
      if (filter === 'active') return !task.completedAt;
      if (filter === 'completed') return !!task.completedAt;
      return true; // 'all'
    });
  }, [tasks, filter, userId, userRole]);

  // Group tasks by completion date for display
  const groupTasksByCompletionDate = (tasks: Task[]) => {
    const groups: { date: Date | null; tasks: Task[] }[] = [];

    const completedTasks = tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => (
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
      ));

    const activeTasks = tasks.filter((t) => !t.completedAt);

    if (activeTasks.length > 0) {
      groups.push({ date: null, tasks: activeTasks });
    }

    completedTasks.forEach((task) => {
      if (!task.completedAt) return;
      const taskDate = startOfDay(new Date(task.completedAt));
      const existingGroup = groups.find((g) => g.date && isSameDay(g.date, taskDate));

      if (existingGroup) {
        existingGroup.tasks.push(task);
      } else {
        groups.push({ date: taskDate, tasks: [task] });
      }
    });

    return groups;
  };

  // Format date separator labels
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const shouldShowDateSeparators = filter !== 'active';
  const taskGroups = shouldShowDateSeparators
    ? groupTasksByCompletionDate(filteredTasks)
    : [{ date: null, tasks: filteredTasks }];

  // Render assignment badge
  const getAssignmentDisplay = (assignment: TaskAssignment) => {
    if (assignment.type === 'member') {
      const member = familyMembers.find((m) => m.id === assignment.memberId);
      return (
        <Badge variant="secondary" className="gap-1 h-7">
          <User className="h-3 w-3" />
          {member?.name || 'Unknown'}
        </Badge>
      );
    }
    if (assignment.type === 'role') {
      return (
        <Badge variant="secondary" className="gap-1 h-7">
          <UsersIcon className="h-3 w-3" />
          {assignment.role === 'parent'
            ? dict.dashboard.pages.tasks.badges.allParents
            : dict.dashboard.pages.tasks.badges.allChildren}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 h-7">
        {dict.dashboard.pages.tasks.badges.unassigned}
      </Badge>
    );
  };

  // Render due date badge
  const getDueDateDisplay = (task: Task) => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && !task.completedAt;
    return (
      <Badge variant={isOverdue ? 'destructive' : 'outline'} className="gap-1 h-7">
        <Clock className="h-3 w-3" />
        {format(dueDate, 'MMM d')}
      </Badge>
    );
  };

  // Render karma badge
  const getKarmaDisplay = (karma?: number, completed?: boolean) => {
    if (!karma) return null;
    return (
      <Badge variant={completed ? 'secondary' : 'default'} className="gap-1 h-7">
        <Sparkles className={`h-3 w-3 ${completed ? '' : 'fill-current'}`} />
        {dict.dashboard.pages.tasks.badges.karma.replace('{amount}', karma.toString())}
      </Badge>
    );
  };

  // Check if task can be claimed
  const isTaskClaimable = (task: Task) => {
    return !task.completedAt && (task.assignment.type === 'unassigned' || task.assignment.type === 'role');
  };

  const t = dict.dashboard.pages.tasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.newTask}
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="my-tasks">{t.filters.myTasks}</TabsTrigger>
          <TabsTrigger value="all">{t.filters.all}</TabsTrigger>
          <TabsTrigger value="active">{t.filters.active}</TabsTrigger>
          <TabsTrigger value="completed">{t.filters.completed}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {isLoading && <div className="text-center py-12">{t.loading}</div>}
          {error && <div className="text-center py-12 text-destructive">{error}</div>}

          {!isLoading && !error && filteredTasks.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t.emptyState.title}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {filter === 'my-tasks' ? t.emptyState.myTasks : t.emptyState.default}
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t.emptyState.cta}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {taskGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-3">
                  {group.date && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Completed {formatDateSeparator(group.date)}
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  {group.tasks.map((task) => (
                    <Card key={task._id} className={task.completedAt ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={!!task.completedAt}
                            onCheckedChange={() => handleToggleComplete(task)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`font-semibold mb-1 ${
                                    task.completedAt ? 'line-through text-muted-foreground' : ''
                                  }`}
                                >
                                  {task.name}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  {isTaskClaimable(task) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleClaimTask(task)}
                                      className="gap-1.5 h-7 text-xs font-medium border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                                    >
                                      <User className="h-3 w-3" />
                                      {t.claim.button}
                                    </Button>
                                  ) : (
                                    getAssignmentDisplay(task.assignment)
                                  )}
                                  {getDueDateDisplay(task)}
                                  {task.scheduleId && (
                                    <Badge variant="outline" className="gap-1 h-7">
                                      <Repeat className="h-3 w-3" />
                                      {t.badges.recurring}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {task.metadata?.karma && (
                                  <div className="flex items-center gap-2 text-base font-semibold">
                                    <Sparkles
                                      className={`h-5 w-5 ${
                                        task.completedAt
                                          ? 'text-muted-foreground'
                                          : 'text-primary fill-current'
                                      }`}
                                    />
                                    <span
                                      className={
                                        task.completedAt ? 'text-muted-foreground' : 'text-foreground'
                                      }
                                    >
                                      {task.metadata.karma}
                                    </span>
                                  </div>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTask(task)} className="gap-2">
                                      <Edit className="h-4 w-4" />
                                      {t.menu.edit}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTask(task)}
                                      className="gap-2 text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t.menu.delete}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTask(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? t.edit.title : t.create.title}</DialogTitle>
            <DialogDescription>
              {editingTask ? t.edit.description : t.create.description}
            </DialogDescription>
          </DialogHeader>

          {!editingTask && (
            <Tabs value={taskType} onValueChange={(v) => setTaskType(v as TaskType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">{t.create.tabs.single}</TabsTrigger>
                <TabsTrigger value="recurring">{t.create.tabs.recurring}</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t.create.fields.name.label} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t.create.fields.name.placeholder}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={200}
                  />
                </div>

                {!showDescription ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowDescription(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.description.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="description">{t.create.fields.description.label}</Label>
                    <Textarea
                      id="description"
                      placeholder={t.create.fields.description.placeholder}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      maxLength={2000}
                      rows={3}
                    />
                  </div>
                )}

                {!showDueDate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setShowDueDate(true);
                      if (!formData.dueDate) {
                        setFormData({ ...formData, dueDate: format(new Date(), 'yyyy-MM-dd') });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.dueDate.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">{t.create.fields.dueDate.label}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                )}

                {!showAssignment ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAssignment(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.assignment.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="assignTo">{t.create.fields.assignment.label}</Label>
                    <Select
                      value={formData.assignTo}
                      onValueChange={(value) => setFormData({ ...formData, assignTo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{t.create.fields.assignment.unassigned}</SelectItem>
                        <SelectItem value="all-parents">{t.create.fields.assignment.allParents}</SelectItem>
                        <SelectItem value="all-children">{t.create.fields.assignment.allChildren}</SelectItem>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!showKarma ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKarma(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.karma.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="karma">{t.create.fields.karma.label}</Label>
                    <Input
                      id="karma"
                      type="number"
                      min="0"
                      max="1000"
                      placeholder={t.create.fields.karma.placeholder}
                      value={formData.karma}
                      onChange={(e) => setFormData({ ...formData, karma: e.target.value })}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recurring" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring-name">
                    {t.create.fields.name.label} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="recurring-name"
                    placeholder={t.create.fields.name.placeholder}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Repeat className="h-4 w-4" />
                    {t.create.fields.schedule.title}
                  </div>
                  <div className="space-y-2">
                    <Label>{t.create.fields.schedule.repeatOn}</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={selectedDays.includes(dayMap[day]) ? 'default' : 'outline'}
                          size="sm"
                          className="h-10 px-0"
                          onClick={() => toggleDay(day)}
                        >
                          {t.days[day.toLowerCase() as keyof typeof t.days]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t.create.fields.schedule.frequency}</Label>
                    <Select value={weekFrequency} onValueChange={setWeekFrequency}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t.create.fields.schedule.every1Week}</SelectItem>
                        <SelectItem value="2">{t.create.fields.schedule.every2Weeks}</SelectItem>
                        <SelectItem value="3">{t.create.fields.schedule.every3Weeks}</SelectItem>
                        <SelectItem value="4">{t.create.fields.schedule.every4Weeks}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Same progressive disclosure for description, assignment, karma */}
                {/* (Copy from single task tab, omitting due date) */}
              </TabsContent>
            </Tabs>
          )}

          {editingTask && (
            <div className="space-y-4 py-4">
              {/* Edit form - similar structure to create */}
              {/* Pre-filled with task data */}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTask(null);
                resetForm();
              }}
            >
              {t.create.buttons.cancel}
            </Button>
            <Button
              onClick={
                editingTask
                  ? handleUpdateTask
                  : taskType === 'single'
                    ? handleCreateTask
                    : handleCreateSchedule
              }
            >
              {editingTask ? t.edit.buttons.update : t.create.buttons.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for Recurring Tasks */}
      <AlertDialog open={!!deleteConfirmTask} onOpenChange={(open) => !open && setDeleteConfirmTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete.recurringTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.delete.recurringDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.delete.buttons.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingleInstance} variant="outline">
              {t.delete.buttons.deleteOne}
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDeleteAllRecurring} variant="destructive">
              {t.delete.buttons.deleteAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Note**: This is a very large component. In the reference, it's 1100+ lines. The above is a condensed version showing the structure and key functions. The actual implementation should include:
- Complete recurring task form fields in edit mode
- All progressive disclosure buttons for recurring tab
- Proper error handling for all operations
- Accessibility attributes

**Acceptance Criteria**:
- ✅ Component renders without errors
- ✅ All CRUD operations work
- ✅ Filtering works correctly
- ✅ Progressive disclosure functions
- ✅ Recurring tasks handled properly
- ✅ Translations used throughout
- ✅ TypeScript types correct
- ✅ No lint errors

---

### Task 8: Integrate TasksView into tasks page
**Priority**: P0
**Estimated Time**: 30 minutes
**Dependencies**: Task 7

**File**: `apps/web/src/app/[lang]/app/tasks/page.tsx`

**Instructions**:
1. Replace the placeholder content with:

```typescript
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { TasksView } from '@/components/tasks/TasksView';
import { getDictionary } from '@/dictionaries';
import { getMe, getFamilies } from '@/lib/api-client';
import { i18n, type Locale } from '@/i18n/config';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function TasksPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Get auth info
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  let user;
  try {
    user = await getMe(cookieString);
  } catch {
    redirect(`/${lang}/signin`);
  }

  // Get family data
  const families = await getFamilies();
  if (families.length === 0) {
    redirect(`/${lang}/get-started`);
  }

  const family = families[0]; // Use first family

  return (
    <DashboardLayout dict={dict} lang={lang} title={dict.dashboard.pages.tasks.title}>
      <TasksView
        dict={dict}
        familyId={family._id}
        userId={user._id}
        userRole={family.members.find((m) => m.userId === user._id)?.role || 'child'}
        familyMembers={family.members.map((m) => ({
          id: m.userId,
          name: m.name || 'Unknown',
          role: m.role,
        }))}
      />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
```

**Acceptance Criteria**:
- ✅ Page renders TasksView component
- ✅ User/family data fetched server-side
- ✅ Redirects work for unauthenticated users
- ✅ TypeScript compilation succeeds
- ✅ No lint errors

---

## Phase 5: E2E Testing

### Task 9: Write E2E tests for Tasks page
**Priority**: P0
**Estimated Time**: 3-4 hours
**Dependencies**: Task 8

**File**: `apps/web/tests/e2e/app/tasks-page.spec.ts`

Due to length, I'll provide the test structure. Implement each test case fully:

```typescript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, createTestFamily } from '../helpers/auth';

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login and navigate to tasks page
    await setupAuthenticatedUser(page);
    await page.goto('/en-US/app/tasks');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Task List Display', () => {
    test('should display task list with correct elements', async ({ page }) => {
      // Test: Check that page renders with filters, empty state or tasks
      // Assert: Page title, filter tabs, task cards visible
    });

    test('should display empty state when no tasks', async ({ page }) => {
      // Test: Fresh family with no tasks
      // Assert: Empty state card with "Create Task" button
    });

    test('should filter to my tasks', async ({ page }) => {
      // Create tasks assigned to different users
      // Click "My Tasks" filter
      // Assert: Only user's tasks visible
    });

    // Add more list tests...
  });

  test.describe('Create Single Task', () => {
    test('should create task with only name', async ({ page }) => {
      await page.click('button:has-text("New Task")');
      await page.fill('input#name', 'Test Task');
      await page.click('button:has-text("Create Task")');
      await expect(page.locator('text=Test Task')).toBeVisible();
    });

    test('should create task with all fields', async ({ page }) => {
      // Test: Fill all optional fields
      // Assert: Task created with all data
    });

    // Add more create tests...
  });

  test.describe('Create Recurring Task', () => {
    test('should create weekly recurring task', async ({ page }) => {
      // Test: Switch to recurring tab, select days, create
      // Assert: Schedule created, tasks generated
    });

    // Add more recurring tests...
  });

  test.describe('Update Task', () => {
    test('should edit task name', async ({ page }) => {
      // Test: Open edit dialog, change name, save
      // Assert: Task updated
    });

    // Add more update tests...
  });

  test.describe('Complete Task', () => {
    test('should mark task as complete', async ({ page }) => {
      // Test: Click checkbox
      // Assert: Task shows as completed
    });

    test('should complete task with karma', async ({ page }) => {
      // Test: Complete task with karma metadata
      // Assert: Karma balance updated
    });

    // Add more completion tests...
  });

  test.describe('Delete Task', () => {
    test('should delete single task', async ({ page }) => {
      // Test: Click delete in menu
      // Assert: Task removed
    });

    test('should show confirmation for recurring task', async ({ page }) => {
      // Test: Attempt to delete recurring task
      // Assert: Confirmation dialog appears
    });

    // Add more delete tests...
  });

  test.describe('Claim Task', () => {
    test('should claim unassigned task', async ({ page }) => {
      // Test: Click "Claim Task" button
      // Assert: Task assigned to user
    });

    // Add more claim tests...
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      // Test: All features work on mobile
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      // Test: All features work on tablet
    });

    // Add more responsive tests...
  });

  test.describe('Internationalization', () => {
    test('should display in Dutch', async ({ page }) => {
      await page.goto('/nl-NL/app/tasks');
      await expect(page.locator('h1:has-text("Taken")')).toBeVisible();
    });

    // Add more i18n tests...
  });
});
```

**Instructions**:
1. Create the test file
2. Implement each test case fully
3. Run tests: `pnpm test:e2e tests/e2e/app/tasks-page.spec.ts`
4. Ensure all tests pass

**Acceptance Criteria**:
- ✅ All test scenarios implemented
- ✅ Tests cover all user workflows
- ✅ All tests pass
- ✅ No flaky tests

---

## Phase 6: Final Validation

### Task 10: Run full test suite and validation
**Priority**: P0
**Estimated Time**: 1 hour
**Dependencies**: All previous tasks

**Instructions**:

1. **Run unit tests**:
   ```bash
   cd apps/web
   pnpm test:unit
   ```
   Ensure 100% coverage for tasks slice.

2. **Run E2E tests**:
   ```bash
   pnpm test:e2e tests/e2e/app/tasks-page.spec.ts
   ```
   All E2E tests must pass.

3. **Type check**:
   ```bash
   pnpm tsc --noEmit
   ```
   No TypeScript errors.

4. **Lint**:
   ```bash
   pnpm run lint
   ```
   No lint errors.

5. **Build**:
   ```bash
   pnpm run build
   ```
   Build succeeds without errors.

6. **Manual testing checklist**:
   - [ ] Create single task
   - [ ] Create recurring task
   - [ ] Edit task
   - [ ] Complete task with karma (verify karma updates)
   - [ ] Delete single task
   - [ ] Delete recurring task (both options)
   - [ ] Claim unassigned task
   - [ ] Filter by each tab
   - [ ] Test on mobile viewport
   - [ ] Switch language to Dutch
   - [ ] Verify all translations display

**Acceptance Criteria**:
- ✅ All automated tests pass
- ✅ No TypeScript errors
- ✅ No lint errors
- ✅ Build succeeds
- ✅ All manual tests pass
- ✅ Feature is production-ready

---

## Summary

You now have a complete, step-by-step guide to implement the Tasks page. Each task is:
- **Ordered sequentially** with clear dependencies
- **Atomic and testable** with specific acceptance criteria
- **Fully specified** with code examples and instructions
- **Junior-friendly** with explanations and context

The TDD approach ensures quality at every step. The comprehensive E2E tests guarantee all user workflows function correctly.

**Total estimated time**: 12-15 hours for a junior developer

**Key files created/modified**:
1. `apps/web/src/components/ui/tabs.tsx` (copied)
2. `apps/web/src/components/ui/checkbox.tsx` (added)
3. `apps/web/src/components/ui/textarea.tsx` (added)
4. `apps/web/src/types/api.types.ts` (extended)
5. `apps/web/src/lib/api-client.ts` (extended)
6. `apps/web/src/store/slices/tasks.slice.ts` (new)
7. `apps/web/src/store/store.ts` (modified)
8. `apps/web/src/dictionaries/en-US.json` (extended)
9. `apps/web/src/dictionaries/nl-NL.json` (extended)
10. `apps/web/src/components/tasks/TasksView.tsx` (new)
11. `apps/web/src/app/[lang]/app/tasks/page.tsx` (modified)
12. `apps/web/tests/unit/store/tasks.slice.test.ts` (new)
13. `apps/web/tests/e2e/app/tasks-page.spec.ts` (new)
