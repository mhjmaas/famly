/**
 * API client types for backend communication
 */

// Authentication types
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

// Family types
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

export interface FamilyMember {
  memberId: string;
  name: string;
  birthdate: string;
  role: "Parent" | "Child";
  linkedAt: string;
  addedBy?: string;
}

export interface FamilyWithMembers {
  familyId: string;
  name: string;
  role: "Parent" | "Child";
  linkedAt: string;
  members: FamilyMember[];
}

export interface UpdateMemberRoleRequest {
  role: "Parent" | "Child";
}

export interface UpdateMemberRoleResponse {
  memberId: string;
  familyId: string;
  role: "Parent" | "Child";
  updatedAt: string;
}

export interface GrantKarmaRequest {
  userId: string;
  amount: number; // -100000 to 100000
  description?: string; // max 500 chars
}

export interface GrantKarmaResponse {
  eventId: string;
  familyId: string;
  userId: string;
  amount: number;
  totalKarma: number;
  description: string;
  grantedBy: string;
  createdAt: string;
}

export interface AddFamilyMemberRequest {
  email: string;
  password: string;
  role: "Parent" | "Child";
  name: string;
  birthdate: string; // ISO YYYY-MM-DD
}

export interface AddFamilyMemberResponse {
  memberId: string;
  familyId: string;
  role: "Parent" | "Child";
  linkedAt: string;
  addedBy: string;
}

// Profile types
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

export interface UpdateProfileRequest {
  name: string;
  birthdate: string; // ISO 8601 format YYYY-MM-DD
}

export interface UpdateProfileResponse {
  user: UserProfile;
}

// Karma types
export interface KarmaBalance {
  userId: string;
  familyId: string;
  totalKarma: number;
  lastUpdated: string;
}

// Activity Events types
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

// Client options
export interface ApiClientOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Server-side only: Cookie string to forward (from Next.js cookies())
   * Format: "name1=value1; name2=value2"
   */
  cookie?: string;
}
