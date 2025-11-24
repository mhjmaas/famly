import { fromObjectId } from "@lib/objectid-utils";
import type { ActivityEvent, ActivityEventDTO } from "../domain/activity-event";

/**
 * Convert ActivityEvent entity to ActivityEventDTO for API responses
 */
export function toActivityEventDTO(event: ActivityEvent): ActivityEventDTO {
  return {
    id: fromObjectId(event._id),
    userId: fromObjectId(event.userId),
    type: event.type,
    ...(event.detail && { detail: event.detail }),
    title: event.title,
    description: event.description ?? null,
    metadata: event.metadata
      ? {
          karma: event.metadata.karma,
          ...(event.metadata.triggeredBy && {
            triggeredBy: fromObjectId(event.metadata.triggeredBy),
          }),
        }
      : null,
    ...(event.templateKey && { templateKey: event.templateKey }),
    ...(event.templateParams && { templateParams: event.templateParams }),
    ...(event.locale && { locale: event.locale }),
    createdAt: event.createdAt.toISOString(),
  };
}
