/**
 * Event payload types for realtime WebSocket events
 * These should match the backend event payloads
 */

// Task Events
export interface TaskEventPayloads {
  "task.created": {
    taskId: string;
    familyId: string;
    task: {
      _id: string;
      familyId: string;
      name: string;
      description?: string;
      dueDate: string;
      assignment: {
        type: "unassigned" | "member" | "role";
        memberId?: string;
        role?: string;
      };
      completedAt?: string;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  "task.assigned": {
    taskId: string;
    familyId: string;
    task: {
      _id: string;
      familyId: string;
      name: string;
      description?: string;
      dueDate: string;
      assignment: {
        type: "unassigned" | "member" | "role";
        memberId?: string;
        role?: string;
      };
      completedAt?: string;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  "task.completed": {
    taskId: string;
    familyId: string;
    completedBy: string;
    task: {
      _id: string;
      familyId: string;
      name: string;
      description?: string;
      dueDate: string;
      assignment: {
        type: "unassigned" | "member" | "role";
        memberId?: string;
        role?: string;
      };
      completedAt: string;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  "task.deleted": {
    taskId: string;
    familyId: string;
  };
}

// Karma Events
export interface KarmaEventPayloads {
  "karma.awarded": {
    eventId: string;
    familyId: string;
    userId: string;
    amount: number;
    source: string;
    description: string;
  };
  "karma.deducted": {
    eventId: string;
    familyId: string;
    userId: string;
    amount: number;
    description: string;
  };
}

// Reward Events
export interface RewardEventPayloads {
  "claim.created": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    autoTaskId?: string;
  };
  "claim.completed": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    completedBy: string;
  };
  "claim.cancelled": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    cancelledBy: string;
  };
  "approval_task.created": {
    taskId: string;
    claimId: string;
    rewardId: string;
    familyId: string;
    assignedToParents: boolean;
  };
  "reward.created": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
  "reward.updated": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
  "reward.deleted": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
}

// Family Events
export interface FamilyEventPayloads {
  "family.member.added": {
    familyId: string;
    memberId: string;
    name: string;
    role: "Parent" | "Child";
    affectedUsers: string[];
  };
  "family.member.removed": {
    familyId: string;
    memberId: string;
    name: string;
    affectedUsers: string[];
  };
  "family.member.role.updated": {
    familyId: string;
    memberId: string;
    name: string;
    oldRole: "Parent" | "Child";
    newRole: "Parent" | "Child";
    affectedUsers: string[];
  };
}

// Activity Events
export interface ActivityEventPayloads {
  "activity.created": {
    eventId: string;
    userId: string;
    type:
      | "TASK"
      | "SHOPPING_LIST"
      | "KARMA"
      | "RECIPE"
      | "DIARY"
      | "FAMILY_DIARY"
      | "REWARD";
    title: string;
    description?: string;
    metadata?: {
      karma?: number;
    };
    createdAt: string;
  };
}

// Combined event payloads type
export type RealtimeEventPayloads = TaskEventPayloads &
  KarmaEventPayloads &
  RewardEventPayloads &
  FamilyEventPayloads &
  ActivityEventPayloads;

// Connection states
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

// Connection status
export interface ConnectionStatus {
  state: ConnectionState;
  error?: string;
}
