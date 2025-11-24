/**
 * Tests for notification templates with actual translations
 * Verifies that notifications are created with correct localized content for en-US and nl-NL
 */

jest.mock("@config/env", () => ({
  getEnv: () => ({
    MONGODB_URI: "mongodb://localhost:27017/test",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "http://localhost:3000",
    CLIENT_URL: "http://localhost:3000",
    MINIO_ENDPOINT: "localhost",
    MINIO_ROOT_USER: "minio",
    MINIO_ROOT_PASSWORD: "miniopass",
    MINIO_BUCKET: "test",
  }),
}));

import {
  createChatMessageNotification,
  createContributionGoalAwardedNotification,
  createContributionGoalZeroKarmaNotification,
  createFamilyMemberAddedNotification,
  createKarmaGrantNotification,
  createRewardClaimNotification,
  createTaskCompletionNotification,
} from "@modules/notifications/lib/notification-templates";

describe("Notification Templates - Translations", () => {
  describe("Task Completion Notifications", () => {
    it("creates task completion notification in en-US with correct translations", () => {
      const notification = createTaskCompletionNotification(
        "en-US",
        "Clean the kitchen",
        "parent-user",
      );

      expect(notification.title).toBe("Your Task Was Completed");
      expect(notification.body).toContain("Clean the kitchen");
      expect(notification.body).toContain("was marked complete");
      expect(notification.data?.type).toBe("task_completion");
    });

    it("creates task completion notification in nl-NL with correct translations", () => {
      const notification = createTaskCompletionNotification(
        "nl-NL",
        "Keuken schoonmaken",
        "parent-user",
      );

      expect(notification.title).toBe("Je Taak is Voltooid");
      expect(notification.body).toContain("Keuken schoonmaken");
      expect(notification.body).toContain("is voltooid gemarkeerd");
      expect(notification.data?.type).toBe("task_completion");
    });

    it("creates task completion with karma notification in en-US", () => {
      const notification = createTaskCompletionNotification(
        "en-US",
        "Do homework",
        "parent-user",
        25,
      );

      expect(notification.title).toBe("Your Task Was Completed");
      expect(notification.body).toContain("Do homework");
      expect(notification.body).toContain("earned 25 karma");
    });

    it("creates task completion with karma notification in nl-NL", () => {
      const notification = createTaskCompletionNotification(
        "nl-NL",
        "Huiswerk maken",
        "parent-user",
        25,
      );

      expect(notification.title).toBe("Je Taak is Voltooid");
      expect(notification.body).toContain("Huiswerk maken");
      expect(notification.body).toContain("leverde 25 karma op");
    });
  });

  describe("Karma Grant Notifications", () => {
    it("creates karma grant notification in en-US with correct translations", () => {
      const notification = createKarmaGrantNotification(
        "en-US",
        50,
        "parent-user",
        "helping with dinner",
      );

      expect(notification.title).toBe("Karma Awarded!");
      expect(notification.body).toContain("50 karma");
      expect(notification.body).toContain("helping with dinner");
      expect(notification.data?.type).toBe("karma_grant");
    });

    it("creates karma grant notification in nl-NL with correct translations", () => {
      const notification = createKarmaGrantNotification(
        "nl-NL",
        50,
        "parent-user",
        "helpen met eten",
      );

      expect(notification.title).toBe("Karma Beloond!");
      expect(notification.body).toContain("50 karma");
      expect(notification.body).toContain("helpen met eten");
      expect(notification.data?.type).toBe("karma_grant");
    });

    it("creates karma grant notification without reason in en-US", () => {
      const notification = createKarmaGrantNotification(
        "en-US",
        30,
        "parent-user",
      );

      expect(notification.title).toBe("Karma Awarded!");
      expect(notification.body).toContain("30 karma");
    });

    it("creates karma grant notification without reason in nl-NL", () => {
      const notification = createKarmaGrantNotification(
        "nl-NL",
        30,
        "parent-user",
      );

      expect(notification.title).toBe("Karma Beloond!");
      expect(notification.body).toContain("30 karma");
    });
  });

  describe("Reward Claim Notifications", () => {
    it("creates reward claim notification in en-US with correct translations", () => {
      const notification = createRewardClaimNotification(
        "en-US",
        "Movie Night",
        "John",
        100,
      );

      expect(notification.title).toBe("Reward Claimed!");
      expect(notification.body).toContain("Movie Night");
      expect(notification.body).toContain("You claimed");
      expect(notification.data?.type).toBe("reward_claim");
    });

    it("creates reward claim notification in nl-NL with correct translations", () => {
      const notification = createRewardClaimNotification(
        "nl-NL",
        "Filmavond",
        "Johan",
        100,
      );

      expect(notification.title).toBe("Beloning Geclaimd!");
      expect(notification.body).toContain("Filmavond");
      expect(notification.body).toContain("Je hebt");
      expect(notification.data?.type).toBe("reward_claim");
    });
  });

  describe("Contribution Goal Notifications", () => {
    it("creates contribution goal awarded notification in en-US", () => {
      const notification = createContributionGoalAwardedNotification(
        "en-US",
        75,
        "Weekly Chores",
      );

      expect(notification.title).toBe("Contribution Goal Progress");
      expect(notification.body).toContain("75 karma");
      expect(notification.body).toContain("toward their goal");
      expect(notification.data?.type).toBe("contribution_goal_awarded");
    });

    it("creates contribution goal awarded notification in nl-NL", () => {
      const notification = createContributionGoalAwardedNotification(
        "nl-NL",
        75,
        "Wekelijkse Taken",
      );

      expect(notification.title).toBe("Gezinsbijdrage-doelvoortgang");
      expect(notification.body).toContain("75 karma");
      expect(notification.body).toContain("verdiend naar hun doel");
      expect(notification.data?.type).toBe("contribution_goal_awarded");
    });

    it("creates zero karma goal notification in en-US", () => {
      const notification = createContributionGoalZeroKarmaNotification(
        "en-US",
        "Weekend Tasks",
      );

      expect(notification.title).toBe("Weekly Goal Ended");
      expect(notification.body).toContain("Weekend Tasks");
      expect(notification.body).toContain("no karma");
      expect(notification.data?.type).toBe("contribution_goal_zero_karma");
    });

    it("creates zero karma goal notification in nl-NL", () => {
      const notification = createContributionGoalZeroKarmaNotification(
        "nl-NL",
        "Weekend Taken",
      );

      expect(notification.title).toBe("Wekelijks Doel Beëindigd");
      expect(notification.body).toContain("Weekend Taken");
      expect(notification.body).toContain("zonder karma");
      expect(notification.data?.type).toBe("contribution_goal_zero_karma");
    });
  });

  describe("Chat Message Notifications", () => {
    it("creates chat message notification in en-US with correct translations", () => {
      const notification = createChatMessageNotification(
        "en-US",
        "Alice",
        "Hey, how are you?",
        "chat-123",
      );

      expect(notification.title).toContain("Alice");
      expect(notification.body).toContain("Hey, how are you?");
      expect(notification.data?.type).toBe("chat_message");
      expect(notification.data?.chatId).toBe("chat-123");
    });

    it("creates chat message notification in nl-NL with correct translations", () => {
      const notification = createChatMessageNotification(
        "nl-NL",
        "Alice",
        "Hoe gaat het?",
        "chat-123",
      );

      expect(notification.title).toContain("Alice");
      expect(notification.body).toContain("Hoe gaat het?");
      expect(notification.data?.type).toBe("chat_message");
      expect(notification.data?.chatId).toBe("chat-123");
    });
  });

  describe("Family Member Notifications", () => {
    it("creates family member added notification in en-US", () => {
      const notification = createFamilyMemberAddedNotification(
        "en-US",
        "Emma",
        "Dad",
      );

      expect(notification.title).toBe("New Family Member");
      expect(notification.body).toContain("Emma");
      expect(notification.body).toContain("has joined the family");
      expect(notification.data?.type).toBe("family_member_added");
    });

    it("creates family member added notification in nl-NL", () => {
      const notification = createFamilyMemberAddedNotification(
        "nl-NL",
        "Emma",
        "Pap",
      );

      expect(notification.title).toBe("Nieuw Gezinslid");
      expect(notification.body).toContain("Emma");
      expect(notification.body).toContain("is lid van het gezin geworden");
      expect(notification.data?.type).toBe("family_member_added");
    });
  });

  describe("Fallback to en-US for unsupported locales", () => {
    it("creates notifications in en-US when unsupported locale is provided", () => {
      const notification = createKarmaGrantNotification(
        "fr-FR",
        25,
        "parent-user",
      );

      expect(notification.title).toBe("Karma Awarded!");
      expect(notification.body).toContain("25 karma");
    });

    it("creates notifications in en-US when undefined locale is provided", () => {
      const notification = createTaskCompletionNotification(
        undefined,
        "Test Task",
        "parent-user",
      );

      expect(notification.title).toBe("Your Task Was Completed");
    });
  });

  describe("Icon and URL generation", () => {
    it("includes icon URLs in notifications", () => {
      const notification = createKarmaGrantNotification(
        "en-US",
        50,
        "parent-user",
      );

      expect(notification.icon).toBeDefined();
      expect(notification.badge).toBeDefined();
      expect(notification.icon).toContain("web-app-manifest");
    });

    it("includes correct data URLs for different notification types", () => {
      const taskNotif = createTaskCompletionNotification(
        "en-US",
        "Test",
        "parent-user",
      );
      expect(taskNotif.data?.url).toContain("/tasks");

      const rewardNotif = createRewardClaimNotification(
        "en-US",
        "Test",
        "John",
        100,
      );
      expect(rewardNotif.data?.url).toContain("/rewards");

      const chatNotif = createChatMessageNotification(
        "en-US",
        "Alice",
        "Hi",
        "chat-123",
      );
      expect(chatNotif.data?.url).toContain("/chat");
    });
  });
});
