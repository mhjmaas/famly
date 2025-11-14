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

// ============= Tasks Types =============

export type TaskAssignment =
  | { type: "unassigned" }
  | { type: "member"; memberId: string }
  | { type: "role"; role: "parent" | "child" };

export interface Task {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  dueDate?: string; // ISO 8601
  assignment: TaskAssignment;
  completedAt?: string; // ISO 8601
  completedBy?: string; // User who received credit for completion
  scheduleId?: string;
  metadata?: {
    karma?: number;
    claimId?: string;
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
    daysOfWeek: number[]; // 0-6 (Sun-Sat)
    weeklyInterval: number; // 1-4
    startDate: string;
    endDate?: string;
  };
  timeOfDay?: string; // HH:mm
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

// ============= Rewards Types =============

export interface Reward {
  _id: string;
  familyId: string;
  name: string;
  karmaCost: number;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Metadata (computed per user)
  claimCount?: number;
  isFavourite?: boolean;
}

export interface Claim {
  _id: string;
  familyId: string;
  rewardId: string;
  memberId: string;
  status: "pending" | "completed" | "cancelled";
  karmaCost: number;
  autoTaskId?: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  // Populated fields
  reward?: Reward;
  member?: FamilyMember;
}

export interface CreateRewardRequest {
  name: string;
  karmaCost: number;
  description?: string;
  imageUrl?: string;
}

export interface UpdateRewardRequest {
  name?: string;
  karmaCost?: number;
  description?: string | null;
  imageUrl?: string | null;
}
