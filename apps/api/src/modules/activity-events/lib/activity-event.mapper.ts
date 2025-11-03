import type { ActivityEvent, ActivityEventDTO } from "../domain/activity-event";

/**
 * Convert ActivityEvent entity to ActivityEventDTO for API responses
 */
export function toActivityEventDTO(event: ActivityEvent): ActivityEventDTO {
  return {
    id: event._id.toString(),
    userId: event.userId.toString(),
    type: event.type,
    title: event.title,
    description: event.description ?? null,
    metadata: event.metadata ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}
