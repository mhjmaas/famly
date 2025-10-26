import { ObjectId } from "mongodb";
import { getDb } from "@infra/mongo/client";

/**
 * Get all contact user IDs for a given user
 * A contact is any user who shares at least one chat with the given user
 * 
 * @param userId The user ID to find contacts for
 * @returns Array of unique contact user IDs (excluding the user themselves)
 */
export async function getContactUserIds(userId: string): Promise<string[]> {
  const db = getDb();
  const userObjectId = new ObjectId(userId);
  
  // Find all chats the user is a member of
  const userMemberships = await db
    .collection("chat_memberships")
    .find({ userId: userObjectId })
    .toArray();
  
  const chatIds = userMemberships.map(m => m.chatId);
  
  if (chatIds.length === 0) {
    return [];
  }
  
  // Find all memberships in those chats (excluding the user)
  const contactMemberships = await db
    .collection("chat_memberships")
    .find({
      chatId: { $in: chatIds },
      userId: { $ne: userObjectId }
    })
    .toArray();
  
  // Collect unique user IDs
  const contactIds = new Set<string>();
  for (const membership of contactMemberships) {
    contactIds.add(membership.userId.toString());
  }
  
  return Array.from(contactIds);
}
