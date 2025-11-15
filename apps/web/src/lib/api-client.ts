/**
 * API client for backend communication
 * Handles authentication, error handling, and cookie forwarding
 *
 * Cookie handling:
 * - Client-side: Uses credentials: "include" to automatically send cookies
 * - Server-side: Pass cookie string via options.cookie parameter
 */

import type {
  ActivityEvent,
  AddFamilyMemberRequest,
  AddFamilyMemberResponse,
  ApiClientOptions,
  AuthResponse,
  Claim,
  CreateFamilyRequest,
  CreateFamilyResponse,
  CreateRewardRequest,
  CreateScheduleRequest,
  CreateTaskRequest,
  FamilySettings,
  FamilyWithMembers,
  GrantKarmaRequest,
  GrantKarmaResponse,
  KarmaBalance,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  Reward,
  Task,
  TaskQueryParams,
  TaskSchedule,
  UpdateFamilySettingsRequest,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdateRewardRequest,
  UpdateScheduleRequest,
  UpdateTaskRequest,
} from "@/types/api.types";

// Use different API URLs for server-side vs client-side
// Server-side (Server Components, API routes): Direct connection to API service
// Client-side (Browser): Through reverse proxy
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Check if this error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }
}

async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, cookie } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Forward cookies for session management (client-side)
  };

  // Server-side: explicitly forward cookies via Cookie header
  if (cookie) {
    config.headers = {
      ...config.headers,
      Cookie: cookie,
    };
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      const errorMessage =
        typeof errorData === "object" && errorData !== null
          ? (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            "An error occurred"
          : String(errorData) || "An error occurred";

      throw new ApiError(errorMessage, response.status, errorData);
    }

    return isJson ? await response.json() : ({} as T);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred",
      0,
    );
  }
}

// Authentication API

export type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types/api.types";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/v1/auth/login", {
    method: "POST",
    body: data,
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/v1/auth/register", {
    method: "POST",
    body: data,
  });
}

export async function logout(): Promise<void> {
  return apiClient<void>("/v1/auth/sign-out", {
    method: "POST",
  });
}

// Family API

export type {
  AddFamilyMemberRequest,
  AddFamilyMemberResponse,
  CreateFamilyRequest,
  CreateFamilyResponse,
  FamilyMember,
  FamilyWithMembers,
  GrantKarmaRequest,
  GrantKarmaResponse,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
} from "@/types/api.types";

export async function createFamily(
  data: CreateFamilyRequest,
): Promise<CreateFamilyResponse> {
  return apiClient<CreateFamilyResponse>("/v1/families", {
    method: "POST",
    body: data,
  });
}

export async function getFamilies(
  cookie?: string,
): Promise<FamilyWithMembers[]> {
  return apiClient<FamilyWithMembers[]>("/v1/families", { cookie });
}

export async function updateMemberRole(
  familyId: string,
  memberId: string,
  data: UpdateMemberRoleRequest,
): Promise<UpdateMemberRoleResponse> {
  return apiClient<UpdateMemberRoleResponse>(
    `/v1/families/${familyId}/members/${memberId}`,
    {
      method: "PATCH",
      body: data,
    },
  );
}

export async function removeMember(
  familyId: string,
  memberId: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function grantKarma(
  familyId: string,
  data: GrantKarmaRequest,
): Promise<GrantKarmaResponse> {
  return apiClient<GrantKarmaResponse>(`/v1/families/${familyId}/karma/grant`, {
    method: "POST",
    body: data,
  });
}

export async function addFamilyMember(
  familyId: string,
  data: AddFamilyMemberRequest,
): Promise<AddFamilyMemberResponse> {
  return apiClient<AddFamilyMemberResponse>(
    `/v1/families/${familyId}/members`,
    {
      method: "POST",
      body: data,
    },
  );
}

// Family Settings API

export type {
  FamilySettings,
  UpdateFamilySettingsRequest,
} from "@/types/api.types";

export async function getFamilySettings(
  familyId: string,
  cookie?: string,
): Promise<FamilySettings> {
  return apiClient<FamilySettings>(`/v1/families/${familyId}/settings`, {
    cookie,
  });
}

export async function updateFamilySettings(
  familyId: string,
  data: UpdateFamilySettingsRequest,
): Promise<FamilySettings> {
  return apiClient<FamilySettings>(`/v1/families/${familyId}/settings`, {
    method: "PUT",
    body: data,
  });
}

// Profile API

export type {
  MeResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfile,
} from "@/types/api.types";

export async function getMe(cookie?: string): Promise<MeResponse> {
  return apiClient<MeResponse>("/v1/auth/me", { cookie });
}

export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  return apiClient<UpdateProfileResponse>("/v1/auth/me", {
    method: "PATCH",
    body: data,
  });
}

// Karma API

export type { KarmaBalance } from "@/types/api.types";

export async function getKarmaBalance(
  familyId: string,
  userId: string,
  cookie?: string,
): Promise<KarmaBalance> {
  return apiClient<KarmaBalance>(
    `/v1/families/${familyId}/karma/balance/${userId}`,
    { cookie },
  );
}

// Activity Events API

export type {
  ActivityEvent,
  ActivityEventType,
} from "@/types/api.types";

export async function getActivityEvents(
  startDate?: string,
  endDate?: string,
  cookie?: string,
): Promise<ActivityEvent[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const queryString = params.toString();
  const endpoint = `/v1/activity-events${queryString ? `?${queryString}` : ""}`;

  return apiClient<ActivityEvent[]>(endpoint, { cookie });
}

// ============= Tasks API =============

export type {
  CreateScheduleRequest,
  CreateTaskRequest,
  Task,
  TaskAssignment,
  TaskQueryParams,
  TaskSchedule,
  UpdateScheduleRequest,
  UpdateTaskRequest,
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
  return apiClient<Task>(`/v1/families/${familyId}/tasks/${taskId}`, {
    cookie,
  });
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
  return apiClient<TaskSchedule[]>(`/v1/families/${familyId}/tasks/schedules`, {
    cookie,
  });
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

// ============= Rewards API =============

export type {
  Claim,
  CreateRewardRequest,
  Reward,
  UpdateRewardRequest,
} from "@/types/api.types";

export async function getRewards(
  familyId: string,
  cookie?: string,
): Promise<Reward[]> {
  return apiClient<Reward[]>(`/v1/families/${familyId}/rewards`, { cookie });
}

export async function createReward(
  familyId: string,
  data: CreateRewardRequest,
  cookie?: string,
): Promise<Reward> {
  return apiClient<Reward>(`/v1/families/${familyId}/rewards`, {
    method: "POST",
    body: data,
    cookie,
  });
}

export async function updateReward(
  familyId: string,
  rewardId: string,
  data: UpdateRewardRequest,
  cookie?: string,
): Promise<Reward> {
  return apiClient<Reward>(`/v1/families/${familyId}/rewards/${rewardId}`, {
    method: "PATCH",
    body: data,
    cookie,
  });
}

export async function deleteReward(
  familyId: string,
  rewardId: string,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/rewards/${rewardId}`, {
    method: "DELETE",
    cookie,
  });
}

export async function toggleRewardFavourite(
  familyId: string,
  rewardId: string,
  isFavourite: boolean,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/families/${familyId}/rewards/${rewardId}/favourite`,
    {
      method: "POST",
      body: { isFavourite },
      cookie,
    },
  );
}

/**
 * Upload an image file for a reward
 * @param familyId - The family ID
 * @param file - The image file to upload
 * @returns The relative URL to access the uploaded image
 */
export async function uploadRewardImage(
  familyId: string,
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/v1/families/${familyId}/rewards/upload-image`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      typeof errorData === "object" && errorData !== null
        ? (errorData as { error?: string }).error || "Upload failed"
        : "Upload failed";
    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
}

// ============= Claims API =============

export async function getClaims(
  familyId: string,
  status?: "pending" | "completed" | "cancelled",
  cookie?: string,
): Promise<Claim[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const queryString = params.toString();
  const endpoint = `/v1/families/${familyId}/claims${queryString ? `?${queryString}` : ""}`;

  return apiClient<Claim[]>(endpoint, { cookie });
}

export async function claimReward(
  familyId: string,
  rewardId: string,
  cookie?: string,
): Promise<Claim> {
  return apiClient<Claim>(
    `/v1/families/${familyId}/rewards/${rewardId}/claim`,
    {
      method: "POST",
      cookie,
    },
  );
}

export async function cancelClaim(
  familyId: string,
  claimId: string,
  cookie?: string,
): Promise<Claim> {
  return apiClient<Claim>(`/v1/families/${familyId}/claims/${claimId}`, {
    method: "DELETE",
    cookie,
  });
}

// ============= Status API =============

export type {
  DeploymentMode,
  DeploymentStatus,
} from "@/lib/utils/status-utils";

/**
 * Fetch deployment status (mode and onboarding completion)
 * This is an unauthenticated endpoint
 *
 * Uses force-cache for SSR optimization - status rarely changes
 * Next.js will revalidate on each request in development
 * Revalidates every 24 hours in production for freshness
 */
export async function fetchDeploymentStatus(): Promise<{
  mode: "saas" | "standalone";
  onboardingCompleted: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/v1/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Use force-cache for SSR optimization - status rarely changes
    // Next.js will revalidate on each request in development
    cache: "force-cache",
    next: {
      // Revalidate every 24 hours in production
      // This balances freshness with performance
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const errorData = isJson ? await response.json() : await response.text();
    const errorMessage =
      typeof errorData === "object" && errorData !== null
        ? (errorData as { message?: string }).message ||
          (errorData as { error?: string }).error ||
          "Failed to fetch deployment status"
        : String(errorData) || "Failed to fetch deployment status";

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
}
