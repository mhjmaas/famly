import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createSchedule as apiCreateSchedule,
  createTask as apiCreateTask,
  deleteSchedule as apiDeleteSchedule,
  deleteTask as apiDeleteTask,
  updateTask as apiUpdateTask,
  getSchedules,
  getTasks,
} from "@/lib/api-client";
import type {
  CreateScheduleRequest,
  CreateTaskRequest,
  Task,
  TaskSchedule,
  UpdateTaskRequest,
} from "@/types/api.types";
import type { RootState } from "../store";
import { decrementKarma, incrementKarma } from "./karma.slice";

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
  "tasks/fetchTasks",
  async (familyId: string) => {
    const tasks = await getTasks(familyId);
    return { tasks, timestamp: Date.now() };
  },
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async ({ familyId, data }: { familyId: string; data: CreateTaskRequest }) => {
    const task = await apiCreateTask(familyId, data);
    return task;
  },
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
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
  "tasks/completeTask",
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
  "tasks/reopenTask",
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
  "tasks/deleteTask",
  async ({ familyId, taskId }: { familyId: string; taskId: string }) => {
    await apiDeleteTask(familyId, taskId);
    return taskId;
  },
);

export const fetchSchedules = createAsyncThunk(
  "tasks/fetchSchedules",
  async (familyId: string) => {
    const schedules = await getSchedules(familyId);
    return schedules;
  },
);

export const createSchedule = createAsyncThunk(
  "tasks/createSchedule",
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
  "tasks/deleteSchedule",
  async ({
    familyId,
    scheduleId,
  }: {
    familyId: string;
    scheduleId: string;
  }) => {
    await apiDeleteSchedule(familyId, scheduleId);
    return scheduleId;
  },
);

const tasksSlice = createSlice({
  name: "tasks",
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
        state.error = action.error.message || "Failed to fetch tasks";
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
        state.error = action.error.message || "Failed to create task";
      });

    // Update task
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update task";
      });

    // Complete task
    builder
      .addCase(completeTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to complete task";
      });

    // Reopen task
    builder
      .addCase(reopenTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(reopenTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to reopen task";
      });

    // Delete task
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete task";
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
        state.error = action.error.message || "Failed to fetch schedules";
      });

    // Create schedule
    builder
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create schedule";
      });

    // Delete schedule
    builder
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter(
          (s) => s._id !== action.payload,
        );
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete schedule";
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
