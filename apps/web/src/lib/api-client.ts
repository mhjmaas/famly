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
  CreateFamilyRequest,
  CreateFamilyResponse,
  FamilyWithMembers,
  GrantKarmaRequest,
  GrantKarmaResponse,
  KarmaBalance,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@/types/api.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export async function getFamilies(): Promise<FamilyWithMembers[]> {
  return apiClient<FamilyWithMembers[]>("/v1/families");
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
