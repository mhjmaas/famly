/**
 * API client for backend communication
 * Handles authentication, error handling, and cookie forwarding
 *
 * Cookie handling:
 * - Client-side: Uses credentials: "include" to automatically send cookies
 * - Server-side: Pass cookie string via options.cookie parameter
 */

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

interface ApiClientOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Server-side only: Cookie string to forward (from Next.js cookies())
   * Format: "name1=value1; name2=value2"
   */
  cookie?: string;
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

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  birthdate: string; // ISO 8601 format YYYY-MM-DD
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    birthdate?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    families?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  };
  session: {
    expiresAt: string;
  };
  accessToken: string | null;
  sessionToken: string | null;
}

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

export interface CreateFamilyRequest {
  name: string;
}

export interface CreateFamilyResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function createFamily(
  data: CreateFamilyRequest,
): Promise<CreateFamilyResponse> {
  return apiClient<CreateFamilyResponse>("/v1/families", {
    method: "POST",
    body: data,
  });
}

// Profile API

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  birthdate?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  families: Array<{
    familyId: string;
    name: string;
    role: string;
    linkedAt: string;
  }>;
}

export interface MeResponse {
  user: UserProfile;
  authType: "cookie" | "bearer-jwt" | "bearer-session";
}

export async function getMe(cookie?: string): Promise<MeResponse> {
  return apiClient<MeResponse>("/v1/auth/me", { cookie });
}

export interface UpdateProfileRequest {
  name: string;
  birthdate: string; // ISO 8601 format YYYY-MM-DD
}

export interface UpdateProfileResponse {
  user: UserProfile;
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

export interface KarmaBalance {
  userId: string;
  familyId: string;
  balance: number;
  lastUpdated: string;
}

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

export type ActivityEventType =
  | "TASK"
  | "SHOPPING_LIST"
  | "KARMA"
  | "RECIPE"
  | "DIARY"
  | "FAMILY_DIARY"
  | "REWARD";

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityEventType;
  title: string;
  description: string | null;
  metadata: {
    karma?: number;
  } | null;
  createdAt: string; // ISO 8601 timestamp
}

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
