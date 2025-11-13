"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { fetchFamilies } from "@/store/slices/family.slice";
import type { FamilyEventPayloads } from "./types";

/**
 * Hook for subscribing to family member realtime events
 * Handles family.member.added, family.member.removed, family.member.role.updated events
 *
 * @param socket Socket.IO instance
 * @param familyId Current family ID
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useFamilyEvents(
  socket: Socket | null,
  familyId: string | null,
  userId: string | null,
  enabled = true,
): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !familyId || !userId || !enabled) {
      return;
    }

    // Handler for family.member.added event
    const handleMemberAdded = (
      event: FamilyEventPayloads["family.member.added"],
    ) => {
      console.log("[Realtime] Family member added:", event.name);

      // Refresh family members list
      dispatch(fetchFamilies());

      // Show notification
      toast.success("New Family Member", {
        description: `${event.name} has joined the family`,
      });
    };

    // Handler for family.member.removed event
    const handleMemberRemoved = (
      event: FamilyEventPayloads["family.member.removed"],
    ) => {
      console.log("[Realtime] Family member removed:", event.name);

      // Refresh family members list
      dispatch(fetchFamilies());

      // Show notification
      toast.info("Member Removed", {
        description: `${event.name} has been removed from the family`,
      });
    };

    // Handler for family.member.role.updated event
    const handleMemberRoleUpdated = (
      event: FamilyEventPayloads["family.member.role.updated"],
    ) => {
      console.log("[Realtime] Family member role updated:", event.name);

      // Refresh family members list
      dispatch(fetchFamilies());

      // Show notification with role change
      toast.info("Role Updated", {
        description: `${event.name} is now a ${event.newRole}`,
      });
    };

    // Subscribe to family events
    socket.on("family.member.added", handleMemberAdded);
    socket.on("family.member.removed", handleMemberRemoved);
    socket.on("family.member.role.updated", handleMemberRoleUpdated);

    // Cleanup
    return () => {
      socket.off("family.member.added", handleMemberAdded);
      socket.off("family.member.removed", handleMemberRemoved);
      socket.off("family.member.role.updated", handleMemberRoleUpdated);
    };
  }, [socket, familyId, userId, enabled, dispatch]);
}
