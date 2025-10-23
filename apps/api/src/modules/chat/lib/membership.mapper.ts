import type { Membership, MembershipDTO } from "../domain/membership";

/**
 * Converts a Membership entity to a MembershipDTO for API responses
 * Converts all ObjectId fields to strings and Date to ISO8601 strings
 */
export function toMembershipDTO(membership: Membership): MembershipDTO {
  const dto: MembershipDTO = {
    _id: membership._id.toString(),
    chatId: membership.chatId.toString(),
    userId: membership.userId.toString(),
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };

  // Include optional lastReadMessageId if it exists
  if (membership.lastReadMessageId !== undefined) {
    dto.lastReadMessageId = membership.lastReadMessageId.toString();
  }

  return dto;
}
