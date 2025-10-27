import { createChatSchema } from "@modules/chat/validators/create-chat.validator";
import { ObjectId } from "mongodb";

describe("Unit: createChatSchema Validator", () => {
  const validUserId1 = new ObjectId().toString();
  const validUserId2 = new ObjectId().toString();
  const validUserId3 = new ObjectId().toString();

  describe("DM Validation", () => {
    it("should accept valid DM with exactly 1 member", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [validUserId1],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("dm");
        expect(result.data.memberIds).toHaveLength(1);
      }
    });

    it("should reject DM with no members", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one member");
      }
    });

    it("should reject DM with 2 members", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [validUserId1, validUserId2],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Invalid member count",
        );
      }
    });

    it("should reject DM with duplicate member IDs", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [validUserId1, validUserId1],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Member IDs must be unique",
        );
      }
    });

    it("should reject DM with title", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [validUserId1],
        title: "Private Chat",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Title is not allowed for direct messages",
        );
      }
    });

    it("should accept DM with null title", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: [validUserId1],
        title: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeNull();
      }
    });

    it("should reject DM with invalid member ID format", () => {
      const result = createChatSchema.safeParse({
        type: "dm",
        memberIds: ["not-a-valid-id"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Invalid user ID format",
        );
      }
    });
  });

  describe("Group Validation", () => {
    it("should accept valid group with 1 member", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1],
        title: "Family Group",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("group");
        expect(result.data.memberIds).toHaveLength(1);
        expect(result.data.title).toBe("Family Group");
      }
    });

    it("should accept valid group with multiple members", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1, validUserId2, validUserId3],
        title: "Family Dinner Planning",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memberIds).toHaveLength(3);
        expect(result.data.title).toBe("Family Dinner Planning");
      }
    });

    it("should accept group without title", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1, validUserId2],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeUndefined();
      }
    });

    it("should accept group with null title", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1, validUserId2],
        title: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeNull();
      }
    });

    it("should reject group with no members", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [],
        title: "Empty Group",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one member");
      }
    });

    it("should reject group with duplicate member IDs", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1, validUserId2, validUserId1],
        title: "Family Group",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Member IDs must be unique",
        );
      }
    });

    it("should reject group with invalid member ID format", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: [validUserId1, "invalid-id"],
        title: "Family Group",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Invalid user ID format",
        );
      }
    });
  });

  describe("Type Validation", () => {
    it("should reject invalid chat type", () => {
      const result = createChatSchema.safeParse({
        type: "channel",
        memberIds: [validUserId1],
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const result = createChatSchema.safeParse({
        memberIds: [validUserId1],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Member IDs Validation", () => {
    it("should reject missing memberIds", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        title: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("should reject memberIds as non-array", () => {
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: validUserId1,
        title: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("should accept array of valid ObjectId strings", () => {
      const ids = [new ObjectId().toString(), new ObjectId().toString()];
      const result = createChatSchema.safeParse({
        type: "group",
        memberIds: ids,
        title: "Test",
      });

      expect(result.success).toBe(true);
    });
  });
});
