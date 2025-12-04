/**
 * API client types for backend communication
 */

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  language?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  birthdate: string; // ISO 8601 format YYYY-MM-DD
  language?: string;
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
    language?: string;
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
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

// Family Settings types
export interface FamilySettings {
  familyId: string;
  enabledFeatures: string[];
  aiSettings: {
    apiEndpoint: string;
    modelName: string;
    aiName: string;
    provider: "LM Studio" | "Ollama";
    apiSecret?: string;
  };
}

export interface UpdateFamilySettingsRequest {
  enabledFeatures: string[];
  aiSettings?: {
    apiEndpoint: string;
    apiSecret?: string;
    modelName: string;
    aiName: string;
    provider: "LM Studio" | "Ollama";
  };
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
  language?: string;
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
  name?: string;
  birthdate?: string; // ISO 8601 format YYYY-MM-DD
  language?: string;
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
  | "REWARD"
  | "CONTRIBUTION_GOAL";

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityEventType;
  detail?: string; // Granular action type (e.g., "CREATED", "COMPLETED")
  title: string;
  description: string | null;
  templateKey?: string;
  templateParams?: Record<string, string | number>;
  locale?: string;
  metadata: {
    karma?: number;
    triggeredBy?: string; // User who triggered the action if different from credited user
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

// Contribution Goal types
export interface Deduction {
  _id: string;
  amount: number;
  reason: string;
  deductedBy: string;
  createdAt: string;
}

export interface ContributionGoal {
  _id: string;
  familyId: string;
  memberId: string;
  weekStartDate: string;
  title: string;
  description: string;
  maxKarma: number;
  currentKarma: number;
  recurring: boolean;
  deductions: Deduction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContributionGoalRequest {
  memberId: string;
  title: string;
  description: string;
  maxKarma: number;
  recurring?: boolean;
}

export interface UpdateContributionGoalRequest {
  title?: string;
  description?: string;
  maxKarma?: number;
  recurring?: boolean;
}

export interface AddDeductionRequest {
  amount: number;
  reason: string;
}

// Chat types
export type ChatType = "dm" | "group" | "ai";

export interface ChatDTO {
  _id: string;
  type: ChatType;
  title: string | null;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LastMessagePreview {
  _id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ChatWithPreviewDTO extends ChatDTO {
  lastMessage?: LastMessagePreview;
  unreadCount: number;
}

export interface ListChatsResponse {
  chats: ChatWithPreviewDTO[];
  nextCursor?: string;
}

export interface MessageDTO {
  _id: string;
  chatId: string;
  senderId: string;
  body: string;
  clientId?: string;
  createdAt: string;
  editedAt?: string;
  deleted: boolean;
}

export interface ListMessagesResponse {
  messages: MessageDTO[];
  nextCursor?: string;
}

export interface CreateChatRequest {
  type: ChatType;
  memberIds: string[];
  title?: string | null;
}

export interface CreateMessageRequest {
  body: string;
  clientId?: string;
  /** Optional sender ID for AI messages (must be AI_SENDER_ID) */
  senderId?: string;
}

// ============= Shopping Lists Types =============

export interface ShoppingListItem {
  _id: string;
  name: string;
  checked: boolean;
  createdAt: string;
}

export interface ShoppingList {
  _id: string;
  familyId: string;
  name: string;
  tags: string[];
  items: ShoppingListItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingListRequest {
  name: string;
  tags?: string[];
  items?: Array<{ name: string }>;
}

export interface UpdateShoppingListRequest {
  name?: string;
  tags?: string[];
}

export interface AddShoppingListItemRequest {
  name: string;
}

export interface UpdateShoppingListItemRequest {
  name?: string;
  checked?: boolean;
}

// ============= Diary Types =============

export interface DiaryEntry {
  _id: string;
  date: string; // Format: YYYY-MM-DD
  entry: string;
  isPersonal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiaryEntryRequest {
  date: string; // Format: YYYY-MM-DD
  entry: string; // Min 1 char, max 10,000 chars
}

export interface UpdateDiaryEntryRequest {
  date?: string; // Format: YYYY-MM-DD
  entry?: string; // Max 10,000 chars
}

// ============= Recipe Types =============

export interface Recipe {
  _id: string;
  familyId: string;
  name: string;
  description: string;
  durationMinutes?: number;
  steps: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeRequest {
  name: string;
  description: string;
  durationMinutes?: number;
  steps: string[];
  tags?: string[];
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  durationMinutes?: number | null;
  steps?: string[];
  tags?: string[];
}

export interface SearchRecipesRequest {
  query: string;
  limit?: number;
  offset?: number;
}
