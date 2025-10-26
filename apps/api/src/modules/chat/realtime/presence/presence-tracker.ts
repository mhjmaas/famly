/**
 * In-memory presence tracker for managing user online/offline status
 * Tracks which users are connected and manages throttling for presence broadcasts
 */

export interface PresenceState {
  socketIds: Set<string>;
  lastBroadcastAt: number;
}

export class PresenceTracker {
  private presence: Map<string, PresenceState> = new Map();
  private readonly throttleMs: number;

  constructor(throttleMs: number = 2000) {
    this.throttleMs = throttleMs;
  }

  /**
   * Add a socket for a user
   * Returns true if user transitioned from offline→online
   *
   * @param userId The user ID
   * @param socketId The socket ID to add
   * @returns true if user was offline and is now online, false otherwise
   */
  addSocket(userId: string, socketId: string): boolean {
    let presence = this.presence.get(userId);

    if (!presence) {
      // User was offline, now coming online
      presence = {
        socketIds: new Set([socketId]),
        lastBroadcastAt: Date.now(),
      };
      this.presence.set(userId, presence);
      return true;
    }

    // User was already online, just add another socket
    presence.socketIds.add(socketId);
    return false;
  }

  /**
   * Remove a socket for a user
   * Returns true if user transitioned from online→offline
   *
   * @param userId The user ID
   * @param socketId The socket ID to remove
   * @returns true if user had this socket and is now offline, false otherwise
   */
  removeSocket(userId: string, socketId: string): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    presence.socketIds.delete(socketId);

    // If no more sockets, user is offline
    if (presence.socketIds.size === 0) {
      this.presence.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Check if a user is currently online
   *
   * @param userId The user ID
   * @returns true if user has at least one connected socket
   */
  isOnline(userId: string): boolean {
    const presence = this.presence.get(userId);
    return presence !== undefined && presence.socketIds.size > 0;
  }

  /**
   * Check if a presence broadcast should be throttled
   * Returns false if a broadcast was sent recently (within throttleMs)
   *
   * @param userId The user ID
   * @returns true if broadcast should be sent, false if throttled
   */
  shouldBroadcast(userId: string): boolean {
    const presence = this.presence.get(userId);

    if (!presence) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastBroadcast = now - presence.lastBroadcastAt;

    if (timeSinceLastBroadcast >= this.throttleMs) {
      presence.lastBroadcastAt = now;
      return true;
    }

    return false;
  }

  /**
   * Get the number of active sockets for a user
   *
   * @param userId The user ID
   * @returns The number of connected sockets for the user
   */
  getSocketCount(userId: string): number {
    const presence = this.presence.get(userId);
    return presence ? presence.socketIds.size : 0;
  }

  /**
   * Get all online user IDs
   *
   * @returns Array of user IDs that are currently online
   */
  getOnlineUsers(): string[] {
    return Array.from(this.presence.keys());
  }

  /**
   * Reset all presence data (useful for testing)
   */
  reset(): void {
    this.presence.clear();
  }

  /**
   * Get raw presence data for debugging
   */
  debug(): {
    userId: string;
    socketCount: number;
    lastBroadcastAt: number;
  }[] {
    return Array.from(this.presence.entries()).map(([userId, state]) => ({
      userId,
      socketCount: state.socketIds.size,
      lastBroadcastAt: state.lastBroadcastAt,
    }));
  }
}

// Global singleton instance
let presenceTrackerInstance: PresenceTracker | null = null;

/**
 * Get or create the global presence tracker instance
 */
export function getPresenceTracker(): PresenceTracker {
  if (!presenceTrackerInstance) {
    presenceTrackerInstance = new PresenceTracker();
  }
  return presenceTrackerInstance;
}

/**
 * Reset the global presence tracker (useful for testing)
 */
export function resetPresenceTracker(): void {
  presenceTrackerInstance = null;
}
