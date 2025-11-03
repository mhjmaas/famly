// Export service for cross-module usage

// Export domain types
export type {
  ActivityEvent,
  ActivityEventDTO,
  ActivityEventType,
  RecordActivityEventInput,
} from "./domain/activity-event";
// Export repository
export { ActivityEventRepository } from "./repositories/activity-event.repository";
export type { RecordEventInput } from "./services/activity-event.service";
export { ActivityEventService } from "./services/activity-event.service";
