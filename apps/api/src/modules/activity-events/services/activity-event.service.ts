import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type {
  ActivityEvent,
  ActivityEventType,
} from "../domain/activity-event";
import { emitActivityCreated } from "../events/activity-events";
import type { ActivityEventRepository } from "../repositories/activity-event.repository";

export interface RecordEventInput {
  userId: ObjectIdString;
  type: ActivityEventType;
  detail?: string;
  title: string;
  description?: string;
  metadata?: {
    karma?: number;
    triggeredBy?: ObjectIdString;
  };
}

export class ActivityEventService {
  constructor(
    private activityEventRepository: ActivityEventRepository,
    private membershipRepository?: FamilyMembershipRepository,
  ) {}

  /**
   * Record a new activity event
   * Utility method for other modules to easily create activity events
   *
   * @param input - Event details including userId, type, title, description, and metadata
   * @returns The created activity event
   */
  async recordEvent(input: RecordEventInput): Promise<ActivityEvent> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(input.userId, "userId");
      const userObjectId = toObjectId(normalizedUserId, "userId");

      logger.debug("Recording activity event", {
        userId: normalizedUserId,
        type: input.type,
        detail: input.detail,
        title: input.title,
      });

      // Convert triggeredBy if present
      let triggeredByObjectId: ObjectIdString | undefined;
      if (input.metadata?.triggeredBy) {
        triggeredByObjectId = validateObjectId(
          input.metadata.triggeredBy,
          "triggeredBy",
        );
      }

      // Only include metadata if there's actual data
      const metadata: Record<string, any> | undefined =
        input.metadata?.karma || triggeredByObjectId
          ? {
              karma: input.metadata?.karma,
              triggeredBy: triggeredByObjectId
                ? toObjectId(triggeredByObjectId, "triggeredBy")
                : undefined,
            }
          : undefined;

      const event = await this.activityEventRepository.recordEvent({
        userId: userObjectId,
        type: input.type,
        detail: input.detail,
        title: input.title,
        description: input.description,
        metadata,
      });

      logger.info("Activity event recorded successfully", {
        eventId: event._id.toString(),
        userId: normalizedUserId,
        type: input.type,
        detail: input.detail,
      });

      // Emit activity created event
      emitActivityCreated(event);

      return event;
    } catch (error) {
      logger.error("Failed to record activity event", {
        userId: normalizedUserId ?? input.userId,
        type: input.type,
        error,
      });
      throw error;
    }
  }

  /**
   * Get activity events for a user with optional date range filtering
   *
   * @param userId - The user ID whose events to retrieve
   * @param startDate - Optional start date in YYYY-MM-DD format
   * @param endDate - Optional end date in YYYY-MM-DD format
   * @returns Array of activity events (up to 100), sorted by most recent first
   */
  async getEventsForUser(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityEvent[]> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");
      const userObjectId = toObjectId(normalizedUserId, "userId");

      logger.debug("Fetching activity events for user", {
        userId: normalizedUserId,
        startDate,
        endDate,
      });

      const events = await this.activityEventRepository.findByUserInDateRange(
        userObjectId,
        startDate,
        endDate,
      );

      logger.debug("Activity events fetched successfully", {
        userId: normalizedUserId,
        count: events.length,
      });

      return events;
    } catch (error) {
      logger.error("Failed to fetch activity events", {
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get activity events for a specific family member
   * Validates that the requesting user is a member of the specified family
   * and that the target member is also in the same family
   *
   * @param requestingUserId - The ID of the user making the request
   * @param familyId - The family ID
   * @param memberId - The target member ID whose events to retrieve
   * @param startDate - Optional start date in YYYY-MM-DD format
   * @param endDate - Optional end date in YYYY-MM-DD format
   * @returns Array of activity events (up to 100), sorted by most recent first
   * @throws HttpError.badRequest if IDs are invalid
   * @throws HttpError.forbidden if requesting user is not a member of the family
   * @throws HttpError.notFound if family or member not found in family
   */
  async getEventsForFamilyMember(
    requestingUserId: string,
    familyId: string,
    memberId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityEvent[]> {
    let normalizedRequestingUserId: ObjectIdString | undefined;
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedMemberId: ObjectIdString | undefined;

    try {
      // Validate all IDs
      normalizedRequestingUserId = validateObjectId(
        requestingUserId,
        "requestingUserId",
      );
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedMemberId = validateObjectId(memberId, "memberId");

      logger.debug("Fetching activity events for family member", {
        requestingUserId: normalizedRequestingUserId,
        familyId: normalizedFamilyId,
        memberId: normalizedMemberId,
        startDate,
        endDate,
      });

      // Verify membership repository is available
      if (!this.membershipRepository) {
        throw HttpError.internalServerError(
          "Family membership repository not configured",
        );
      }

      // Verify requesting user is a member of the family
      const requestingUserMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedRequestingUserId,
        );

      if (!requestingUserMembership) {
        throw HttpError.forbidden("You are not a member of this family");
      }

      // Verify target member is in the same family
      const targetMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedMemberId,
        );

      if (!targetMembership) {
        throw HttpError.notFound("Family member not found");
      }

      // Retrieve activity events for the target member
      const memberObjectId = toObjectId(normalizedMemberId, "memberId");
      const events = await this.activityEventRepository.findByUserInDateRange(
        memberObjectId,
        startDate,
        endDate,
      );

      logger.debug("Activity events fetched successfully for family member", {
        requestingUserId: normalizedRequestingUserId,
        familyId: normalizedFamilyId,
        memberId: normalizedMemberId,
        count: events.length,
      });

      return events;
    } catch (error) {
      logger.error("Failed to fetch activity events for family member", {
        requestingUserId: normalizedRequestingUserId ?? requestingUserId,
        familyId: normalizedFamilyId ?? familyId,
        memberId: normalizedMemberId ?? memberId,
        error,
      });
      throw error;
    }
  }
}
