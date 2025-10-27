import type {
  KarmaEvent,
  KarmaEventDTO,
  MemberKarma,
  MemberKarmaDTO,
} from "../domain/karma";

/**
 * Convert MemberKarma domain model to DTO for API response
 *
 * @param karma - The member karma domain object
 * @returns Member karma DTO with string IDs and ISO timestamps
 */
export function toMemberKarmaDTO(karma: MemberKarma): MemberKarmaDTO {
  return {
    familyId: karma.familyId.toString(),
    userId: karma.userId.toString(),
    totalKarma: karma.totalKarma,
    createdAt: karma.createdAt.toISOString(),
    updatedAt: karma.updatedAt.toISOString(),
  };
}

/**
 * Convert KarmaEvent domain model to DTO for API response
 *
 * @param event - The karma event domain object
 * @returns Karma event DTO with string IDs and ISO timestamps
 */
export function toKarmaEventDTO(event: KarmaEvent): KarmaEventDTO {
  return {
    id: event._id.toString(),
    familyId: event.familyId.toString(),
    userId: event.userId.toString(),
    amount: event.amount,
    source: event.source,
    description: event.description,
    metadata: event.metadata,
    createdAt: event.createdAt.toISOString(),
  };
}
