import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: AI Chat Feature", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter = 0;
  });

  describe("AI Chat Auto-Creation", () => {
    it("should include AI chat when aiIntegration is enabled", async () => {
      // Setup family with user
      const family = await setupTestFamily(baseUrl, testCounter++, {
        familyName: "AI Test Family",
      });

      // Enable aiIntegration feature
      const settingsResponse = await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
          aiSettings: {
            apiEndpoint: "https://api.example.com",
            apiSecret: "test-secret",
            modelName: "gpt-4",
            aiName: "Jarvis",
            provider: "LM Studio",
          },
        });

      expect(settingsResponse.status).toBe(200);

      // List chats - should include auto-created AI chat
      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.chats).toHaveLength(1);

      const aiChat = listResponse.body.chats[0];
      expect(aiChat.type).toBe("ai");
      expect(aiChat.title).toBe("Jarvis");
      expect(aiChat.memberIds).toContain(family.userId);
    });

    it("should not include AI chat when aiIntegration is disabled", async () => {
      // Setup family with user
      const family = await setupTestFamily(baseUrl, testCounter++, {
        familyName: "No AI Family",
      });

      // Disable aiIntegration feature (enable other features but not AI)
      const settingsResponse = await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            // aiIntegration NOT included
          ],
        });

      expect(settingsResponse.status).toBe(200);

      // List chats - should NOT include AI chat
      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.chats).toHaveLength(0);
    });

    it("should return existing AI chat on subsequent requests", async () => {
      // Setup family with aiIntegration enabled
      const family = await setupTestFamily(baseUrl, testCounter++);

      await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
          aiSettings: {
            apiEndpoint: "https://api.example.com",
            apiSecret: "test-secret",
            modelName: "gpt-4",
            aiName: "Assistant",
            provider: "LM Studio",
          },
        });

      // First request - creates AI chat
      const firstResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      expect(firstResponse.status).toBe(200);
      const firstAiChatId = firstResponse.body.chats[0]._id;

      // Second request - should return same AI chat
      const secondResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.chats[0]._id).toBe(firstAiChatId);
    });

    it("should use default AI name when not configured", async () => {
      // Setup family with aiIntegration enabled but no aiSettings
      const family = await setupTestFamily(baseUrl, testCounter++);

      await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
        });

      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      expect(listResponse.status).toBe(200);
      // Should use default AI name from settings (Jarvis) or fallback
      const aiChat = listResponse.body.chats.find((c: any) => c.type === "ai");
      expect(aiChat).toBeDefined();
      expect(aiChat.title).toBeTruthy(); // Has some title
    });
  });

  describe("AI Chat Messages", () => {
    it("should allow sending messages to AI chat", async () => {
      // Setup family with aiIntegration enabled
      const family = await setupTestFamily(baseUrl, testCounter++);

      await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
          aiSettings: {
            apiEndpoint: "https://api.example.com",
            apiSecret: "test-secret",
            modelName: "gpt-4",
            aiName: "TestAI",
            provider: "LM Studio",
          },
        });

      // Get AI chat
      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      const aiChat = listResponse.body.chats.find((c: any) => c.type === "ai");
      expect(aiChat).toBeDefined();

      // Send message to AI chat
      const messageResponse = await request(baseUrl)
        .post(`/v1/chats/${aiChat._id}/messages`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          body: "Hello AI!",
          clientId: "test-client-id",
        });

      expect(messageResponse.status).toBe(201);
      expect(messageResponse.body.body).toBe("Hello AI!");
      expect(messageResponse.body.chatId).toBe(aiChat._id);
    });

    it("should retrieve messages from AI chat", async () => {
      // Setup family with aiIntegration enabled
      const family = await setupTestFamily(baseUrl, testCounter++);

      await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
          aiSettings: {
            apiEndpoint: "https://api.example.com",
            apiSecret: "test-secret",
            modelName: "gpt-4",
            aiName: "TestAI",
            provider: "LM Studio",
          },
        });

      // Get AI chat
      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      const aiChat = listResponse.body.chats.find((c: any) => c.type === "ai");

      // Send a message
      await request(baseUrl)
        .post(`/v1/chats/${aiChat._id}/messages`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          body: "Test message",
          clientId: "test-client-id",
        });

      // Retrieve messages
      const messagesResponse = await request(baseUrl)
        .get(`/v1/chats/${aiChat._id}/messages`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(messagesResponse.status).toBe(200);
      expect(messagesResponse.body.messages).toHaveLength(1);
      expect(messagesResponse.body.messages[0].body).toBe("Test message");
    });
  });

  describe("AI Chat Isolation", () => {
    it("should create separate AI chats for each user", async () => {
      // Setup family with two members
      const family = await setupTestFamily(baseUrl, testCounter++);

      // Add another member to the family
      const member2Email = `member2-${testCounter}@example.com`;
      const member2Password = "SecurePassword123!";

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/members`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          email: member2Email,
          password: member2Password,
          name: "Member 2",
          birthdate: "1990-01-15",
          role: "Parent",
        });

      // Login as member 2
      const loginResponse = await request(baseUrl).post("/v1/auth/login").send({
        email: member2Email,
        password: member2Password,
      });

      const member2Token = loginResponse.body.accessToken;

      // Enable aiIntegration
      await request(baseUrl)
        .put(`/v1/families/${family.familyId}/settings`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          enabledFeatures: [
            "tasks",
            "rewards",
            "shoppingLists",
            "recipes",
            "locations",
            "memories",
            "diary",
            "chat",
            "aiIntegration",
          ],
          aiSettings: {
            apiEndpoint: "https://api.example.com",
            apiSecret: "test-secret",
            modelName: "gpt-4",
            aiName: "FamilyAI",
            provider: "LM Studio",
          },
        });

      // User 1 lists chats
      const user1Response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${family.token}`);

      // User 2 lists chats
      const user2Response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${member2Token}`);

      expect(user1Response.status).toBe(200);
      expect(user2Response.status).toBe(200);

      const user1AiChat = user1Response.body.chats.find(
        (c: any) => c.type === "ai",
      );
      const user2AiChat = user2Response.body.chats.find(
        (c: any) => c.type === "ai",
      );

      expect(user1AiChat).toBeDefined();
      expect(user2AiChat).toBeDefined();

      // Each user should have their own AI chat
      expect(user1AiChat._id).not.toBe(user2AiChat._id);
    });
  });
});
