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
  AddDeductionRequest,
  AddFamilyMemberRequest,
  AddFamilyMemberResponse,
  AddShoppingListItemRequest,
  ApiClientOptions,
  AuthResponse,
  ChangePasswordRequest,
  ChatDTO,
  Claim,
  ContributionGoal,
  CreateChatRequest,
  CreateContributionGoalRequest,
  CreateFamilyRequest,
  CreateFamilyResponse,
  CreateMessageRequest,
  CreateRewardRequest,
  CreateScheduleRequest,
  CreateShoppingListRequest,
  CreateTaskRequest,
  FamilySettings,
  FamilyWithMembers,
  GrantKarmaRequest,
  GrantKarmaResponse,
  KarmaBalance,
  ListChatsResponse,
  ListMessagesResponse,
  LoginRequest,
  MeResponse,
  MessageDTO,
  RegisterRequest,
  Reward,
  ShoppingList,
  Task,
  TaskQueryParams,
  TaskSchedule,
  UpdateContributionGoalRequest,
  UpdateFamilySettingsRequest,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdateRewardRequest,
  UpdateScheduleRequest,
  UpdateShoppingListItemRequest,
  UpdateShoppingListRequest,
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
  ChangePasswordRequest,
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

export async function logout(cookie?: string): Promise<void> {
  return apiClient<void>("/v1/auth/sign-out", {
    method: "POST",
    cookie,
  });
}

export async function changePassword(
  data: ChangePasswordRequest,
  cookie?: string,
): Promise<void> {
  return apiClient<void>("/v1/auth/change-password", {
    method: "POST",
    body: data,
    cookie,
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
  cookie?: string,
): Promise<CreateFamilyResponse> {
  return apiClient<CreateFamilyResponse>("/v1/families", {
    method: "POST",
    body: data,
    cookie,
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
  cookie?: string,
): Promise<UpdateMemberRoleResponse> {
  return apiClient<UpdateMemberRoleResponse>(
    `/v1/families/${familyId}/members/${memberId}`,
    {
      method: "PATCH",
      body: data,
      cookie,
    },
  );
}

export async function removeMember(
  familyId: string,
  memberId: string,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
    cookie,
  });
}

export async function grantKarma(
  familyId: string,
  data: GrantKarmaRequest,
  cookie?: string,
): Promise<GrantKarmaResponse> {
  return apiClient<GrantKarmaResponse>(`/v1/families/${familyId}/karma/grant`, {
    method: "POST",
    body: data,
    cookie,
  });
}

export async function addFamilyMember(
  familyId: string,
  data: AddFamilyMemberRequest,
  cookie?: string,
): Promise<AddFamilyMemberResponse> {
  return apiClient<AddFamilyMemberResponse>(
    `/v1/families/${familyId}/members`,
    {
      method: "POST",
      body: data,
      cookie,
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
  cookie?: string,
): Promise<FamilySettings> {
  return apiClient<FamilySettings>(`/v1/families/${familyId}/settings`, {
    method: "PUT",
    body: data,
    cookie,
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
  cookie?: string,
): Promise<UpdateProfileResponse> {
  return apiClient<UpdateProfileResponse>("/v1/auth/me", {
    method: "PATCH",
    body: data,
    cookie,
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

export async function getFamilyMemberActivityEvents(
  familyId: string,
  memberId: string,
  startDate?: string,
  endDate?: string,
  cookie?: string,
): Promise<ActivityEvent[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const queryString = params.toString();
  const endpoint = `/v1/families/${familyId}/members/${memberId}/activity-events${queryString ? `?${queryString}` : ""}`;

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
  cookie?: string,
): Promise<Task> {
  return apiClient<Task>(`/v1/families/${familyId}/tasks`, {
    method: "POST",
    body: data,
    cookie,
  });
}

export async function updateTask(
  familyId: string,
  taskId: string,
  data: UpdateTaskRequest,
  cookie?: string,
): Promise<Task> {
  return apiClient<Task>(`/v1/families/${familyId}/tasks/${taskId}`, {
    method: "PATCH",
    body: data,
    cookie,
  });
}

export async function deleteTask(
  familyId: string,
  taskId: string,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/tasks/${taskId}`, {
    method: "DELETE",
    cookie,
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
  cookie?: string,
): Promise<TaskSchedule> {
  return apiClient<TaskSchedule>(`/v1/families/${familyId}/tasks/schedules`, {
    method: "POST",
    body: data,
    cookie,
  });
}

export async function updateSchedule(
  familyId: string,
  scheduleId: string,
  data: UpdateScheduleRequest,
  cookie?: string,
): Promise<TaskSchedule> {
  return apiClient<TaskSchedule>(
    `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
    {
      method: "PATCH",
      body: data,
      cookie,
    },
  );
}

export async function deleteSchedule(
  familyId: string,
  scheduleId: string,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
    {
      method: "DELETE",
      cookie,
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
 * @param cookie - Optional cookie string for server-side requests
 * @returns The relative URL to access the uploaded image
 */
export async function uploadRewardImage(
  familyId: string,
  file: File,
  cookie?: string,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/families/${familyId}/rewards/upload-image`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
      headers,
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
export async function fetchDeploymentStatus(options?: {
  cacheMode?: RequestCache;
  nextRevalidateSeconds?: number;
}): Promise<{
  mode: "saas" | "standalone";
  onboardingCompleted: boolean;
}> {
  const cacheMode = options?.cacheMode ?? "no-store";
  const nextRevalidateSeconds = options?.nextRevalidateSeconds;

  const requestInit: RequestInit & {
    next?: { revalidate: number };
  } = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: cacheMode,
  };

  if (nextRevalidateSeconds !== undefined) {
    requestInit.next = {
      revalidate: nextRevalidateSeconds,
    };
  }

  const response = await fetch(`${API_BASE_URL}/v1/status`, requestInit);

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

// ============================================================================
// Contribution Goals
// ============================================================================

/**
 * Create a new contribution goal for a family member
 */
export async function createContributionGoal(
  familyId: string,
  data: CreateContributionGoalRequest,
  options?: ApiClientOptions & { cookie?: string },
): Promise<ContributionGoal> {
  return apiClient<ContributionGoal>(
    `/v1/families/${familyId}/contribution-goals`,
    {
      method: "POST",
      body: data,
      ...options,
    },
  );
}

/**
 * Get a contribution goal for a family member
 */
export async function getContributionGoal(
  familyId: string,
  memberId: string,
  options?: ApiClientOptions & { cookie?: string },
): Promise<ContributionGoal> {
  return apiClient<ContributionGoal>(
    `/v1/families/${familyId}/contribution-goals/${memberId}`,
    {
      method: "GET",
      ...options,
    },
  );
}

/**
 * Update a contribution goal
 */
export async function updateContributionGoal(
  familyId: string,
  memberId: string,
  data: UpdateContributionGoalRequest,
  options?: ApiClientOptions & { cookie?: string },
): Promise<ContributionGoal> {
  return apiClient<ContributionGoal>(
    `/v1/families/${familyId}/contribution-goals/${memberId}`,
    {
      method: "PUT",
      body: data,
      ...options,
    },
  );
}

/**
 * Delete a contribution goal
 */
export async function deleteContributionGoal(
  familyId: string,
  memberId: string,
  options?: ApiClientOptions & { cookie?: string },
): Promise<void> {
  return apiClient<void>(
    `/v1/families/${familyId}/contribution-goals/${memberId}`,
    {
      method: "DELETE",
      ...options,
    },
  );
}

/**
 * Add a deduction to a contribution goal
 */
export async function addDeduction(
  familyId: string,
  memberId: string,
  data: AddDeductionRequest,
  options?: ApiClientOptions & { cookie?: string },
): Promise<ContributionGoal> {
  return apiClient<ContributionGoal>(
    `/v1/families/${familyId}/contribution-goals/${memberId}/deductions`,
    {
      method: "POST",
      body: data,
      ...options,
    },
  );
}

// ===== Chat API =====

/**
 * Get all chats for the current user
 */
export async function getChats(
  cursor?: string,
  limit?: number,
  options?: ApiClientOptions,
): Promise<ListChatsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append("cursor", cursor);
  if (limit) params.append("limit", limit.toString());

  const query = params.toString();
  return apiClient<ListChatsResponse>(
    `/v1/chats${query ? `?${query}` : ""}`,
    options,
  );
}

/**
 * Get a specific chat by ID
 */
export async function getChat(
  chatId: string,
  options?: ApiClientOptions,
): Promise<ChatDTO> {
  return apiClient<ChatDTO>(`/v1/chats/${chatId}`, options);
}

/**
 * Create a new chat (DM or group)
 */
export async function createChat(
  data: CreateChatRequest,
  options?: ApiClientOptions,
): Promise<ChatDTO> {
  return apiClient<ChatDTO>("/v1/chats", {
    method: "POST",
    body: data,
    ...options,
  });
}

/**
 * Get messages in a chat
 */
export async function getMessages(
  chatId: string,
  before?: string,
  limit?: number,
  options?: ApiClientOptions,
): Promise<ListMessagesResponse> {
  const params = new URLSearchParams();
  if (before) params.append("before", before);
  if (limit) params.append("limit", limit.toString());

  const query = params.toString();
  return apiClient<ListMessagesResponse>(
    `/v1/chats/${chatId}/messages${query ? `?${query}` : ""}`,
    options,
  );
}

/**
 * Send a message in a chat
 */
export async function sendMessage(
  chatId: string,
  data: CreateMessageRequest,
  options?: ApiClientOptions,
): Promise<MessageDTO> {
  return apiClient<MessageDTO>(`/v1/chats/${chatId}/messages`, {
    method: "POST",
    body: data,
    ...options,
  });
}

/**
 * Update the read cursor for a chat (mark messages as read)
 * @param chatId - The chat ID
 * @param messageId - The ID of the last read message
 */
export async function updateReadCursor(
  chatId: string,
  messageId: string,
  options?: ApiClientOptions,
): Promise<void> {
  return apiClient<void>(`/v1/chats/${chatId}/read-cursor`, {
    method: "PUT",
    body: { messageId },
    ...options,
  });
}

/**
 * Clear all messages in an AI chat
 * @param chatId - The chat ID (must be an AI chat)
 * @returns { deletedCount: number }
 */
export async function clearChatMessages(
  chatId: string,
  options?: ApiClientOptions,
): Promise<{ deletedCount: number }> {
  return apiClient<{ deletedCount: number }>(`/v1/chats/${chatId}/messages`, {
    method: "DELETE",
    ...options,
  });
}

// ============= Shopping Lists API =============

export type {
  AddShoppingListItemRequest,
  CreateShoppingListRequest,
  ShoppingList,
  ShoppingListItem,
  UpdateShoppingListItemRequest,
  UpdateShoppingListRequest,
} from "@/types/api.types";

/**
 * Get all shopping lists for a family
 */
export async function getShoppingLists(
  familyId: string,
  cookie?: string,
): Promise<ShoppingList[]> {
  return apiClient<ShoppingList[]>(`/v1/families/${familyId}/shopping-lists`, {
    cookie,
  });
}

/**
 * Get a specific shopping list by ID
 */
export async function getShoppingList(
  familyId: string,
  listId: string,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(
    `/v1/families/${familyId}/shopping-lists/${listId}`,
    { cookie },
  );
}

/**
 * Create a new shopping list
 */
export async function createShoppingList(
  familyId: string,
  data: CreateShoppingListRequest,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(`/v1/families/${familyId}/shopping-lists`, {
    method: "POST",
    body: data,
    cookie,
  });
}

/**
 * Update a shopping list
 */
export async function updateShoppingList(
  familyId: string,
  listId: string,
  data: UpdateShoppingListRequest,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(
    `/v1/families/${familyId}/shopping-lists/${listId}`,
    {
      method: "PATCH",
      body: data,
      cookie,
    },
  );
}

/**
 * Delete a shopping list
 */
export async function deleteShoppingList(
  familyId: string,
  listId: string,
  cookie?: string,
): Promise<void> {
  return apiClient<void>(`/v1/families/${familyId}/shopping-lists/${listId}`, {
    method: "DELETE",
    cookie,
  });
}

/**
 * Add an item to a shopping list
 */
export async function addShoppingListItem(
  familyId: string,
  listId: string,
  data: AddShoppingListItemRequest,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(
    `/v1/families/${familyId}/shopping-lists/${listId}/items`,
    {
      method: "POST",
      body: data,
      cookie,
    },
  );
}

/**
 * Update an item in a shopping list
 */
export async function updateShoppingListItem(
  familyId: string,
  listId: string,
  itemId: string,
  data: UpdateShoppingListItemRequest,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(
    `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
    {
      method: "PATCH",
      body: data,
      cookie,
    },
  );
}

/**
 * Delete an item from a shopping list
 */
export async function deleteShoppingListItem(
  familyId: string,
  listId: string,
  itemId: string,
  cookie?: string,
): Promise<ShoppingList> {
  return apiClient<ShoppingList>(
    `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
    {
      method: "DELETE",
      cookie,
    },
  );
}
