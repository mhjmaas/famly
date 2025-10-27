import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { ObjectId } from "mongodb";
import type {
  AwardKarmaInput,
  KarmaEvent,
  KarmaHistoryResponse,
  MemberKarma,
} from "../domain/karma";
import { toKarmaEventDTO } from "../lib/karma.mapper";
import type { KarmaRepository } from "../repositories/karma.repository";

export class KarmaService {
  constructor(
    private karmaRepository: KarmaRepository,
    private membershipRepository: FamilyMembershipRepository,
  ) {}

  /**
   * Award karma to a user
   * Creates a karma event and updates the member's total karma
   *
   * @param input - Award karma input with familyId, userId, amount, source, description, metadata
   * @returns The created karma event
   * @throws HttpError if user is not a family member
   */
  async awardKarma(input: AwardKarmaInput): Promise<KarmaEvent> {
    try {
      // Verify user is a family member
      const membership = await this.membershipRepository.findByFamilyAndUser(
        input.familyId,
        input.userId,
      );

      if (!membership) {
        throw HttpError.forbidden("User is not a member of this family");
      }

      logger.info("Awarding karma", {
        familyId: input.familyId.toString(),
        userId: input.userId.toString(),
        amount: input.amount,
        source: input.source,
      });

      // Create karma event
      const karmaEvent = await this.karmaRepository.createKarmaEvent({
        familyId: input.familyId,
        userId: input.userId,
        amount: input.amount,
        source: input.source,
        description: input.description,
        metadata: input.metadata,
      });

      // Update member karma total atomically
      await this.karmaRepository.upsertMemberKarma(
        input.familyId,
        input.userId,
        input.amount,
      );

      logger.info("Karma awarded successfully", {
        eventId: karmaEvent._id.toString(),
        familyId: input.familyId.toString(),
        userId: input.userId.toString(),
        amount: input.amount,
      });

      return karmaEvent;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to award karma", {
        familyId: input.familyId.toString(),
        userId: input.userId.toString(),
        error,
      });

      throw error;
    }
  }

  /**
   * Get member karma for a user in a family
   *
   * @param familyId - The family ID
   * @param userId - The user ID whose karma to retrieve
   * @param requestingUserId - The user ID making the request
   * @returns The member karma record (or record with 0 karma if none exists)
   * @throws HttpError if requesting user is not a family member
   */
  async getMemberKarma(
    familyId: ObjectId,
    userId: ObjectId,
    requestingUserId: ObjectId,
  ): Promise<MemberKarma> {
    try {
      // Verify requesting user is a family member
      const membership = await this.membershipRepository.findByFamilyAndUser(
        familyId,
        requestingUserId,
      );

      if (!membership) {
        throw HttpError.forbidden("User is not a member of this family");
      }

      logger.debug("Fetching member karma", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        requestingUserId: requestingUserId.toString(),
      });

      // Fetch member karma
      const memberKarma = await this.karmaRepository.findMemberKarma(
        familyId,
        userId,
      );

      // Return existing karma or create a zero-karma record
      if (memberKarma) {
        return memberKarma;
      }

      // Return zero karma for new members
      const now = new Date();
      return {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 0,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to get member karma", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });

      throw error;
    }
  }

  /**
   * Get karma history for a user in a family with pagination
   *
   * @param familyId - The family ID
   * @param userId - The user ID whose history to retrieve
   * @param requestingUserId - The user ID making the request
   * @param limit - Maximum number of events to return
   * @param cursor - Optional cursor for pagination
   * @returns Karma history response with events and pagination metadata
   * @throws HttpError if requesting user is not a family member
   */
  async getKarmaHistory(
    familyId: ObjectId,
    userId: ObjectId,
    requestingUserId: ObjectId,
    limit: number,
    cursor?: string,
  ): Promise<KarmaHistoryResponse> {
    try {
      // Verify requesting user is a family member
      const membership = await this.membershipRepository.findByFamilyAndUser(
        familyId,
        requestingUserId,
      );

      if (!membership) {
        throw HttpError.forbidden("User is not a member of this family");
      }

      logger.debug("Fetching karma history", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        limit,
        cursor,
      });

      // Fetch events (limit + 1 to check if there are more)
      const events = await this.karmaRepository.findKarmaEvents(
        familyId,
        userId,
        limit + 1,
        cursor,
      );

      // Check if there are more events
      const hasMore = events.length > limit;
      const returnEvents = hasMore ? events.slice(0, limit) : events;

      // Calculate next cursor (last event's ID)
      const nextCursor =
        hasMore && returnEvents.length > 0
          ? returnEvents[returnEvents.length - 1]._id.toString()
          : undefined;

      return {
        events: returnEvents.map(toKarmaEventDTO),
        pagination: {
          hasMore,
          nextCursor,
        },
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to get karma history", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });

      throw error;
    }
  }

  /**
   * Manually grant karma to a user (parent-only operation)
   *
   * @param familyId - The family ID
   * @param userId - The user ID to grant karma to
   * @param amount - The amount of karma to grant
   * @param description - Optional description for the grant
   * @param grantedBy - The user ID of the granter (must be parent)
   * @returns The created karma event
   * @throws HttpError if granter is not a parent or recipient is not a family member
   */
  async grantKarma(
    familyId: ObjectId,
    userId: ObjectId,
    amount: number,
    description: string | undefined,
    grantedBy: ObjectId,
  ): Promise<KarmaEvent> {
    try {
      // Verify granter is a parent in the family
      const granterMembership =
        await this.membershipRepository.findByFamilyAndUser(
          familyId,
          grantedBy,
        );

      if (!granterMembership) {
        throw HttpError.forbidden("User is not a member of this family");
      }

      if (granterMembership.role !== FamilyRole.Parent) {
        throw HttpError.forbidden("Only parents can grant karma");
      }

      // Verify recipient is a family member
      const recipientMembership =
        await this.membershipRepository.findByFamilyAndUser(familyId, userId);

      if (!recipientMembership) {
        throw HttpError.forbidden("Recipient is not a member of this family");
      }

      logger.info("Manually granting karma", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        amount,
        grantedBy: grantedBy.toString(),
      });

      // Award karma with manual_grant source
      return this.awardKarma({
        familyId,
        userId,
        amount,
        source: "manual_grant",
        description: description || "Manual karma grant",
        metadata: {
          grantedBy: grantedBy.toString(),
        },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to grant karma", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        grantedBy: grantedBy.toString(),
        error,
      });

      throw error;
    }
  }
}
