import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: family member removal cascades to chats", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it("removes the member from all group chats", async () => {
    const unique = Date.now();
    const family = await TestDataFactory.family(baseUrl, unique)
      .addChild("Child One")
      .addChild("Child Two")
      .build();

    const childOne = family.members[0];
    const childTwo = family.members[1];

    // Parent creates a group chat with both children
    const createChatRes = await request(baseUrl)
      .post("/v1/chats")
      .set("Authorization", `Bearer ${family.parentToken}`)
      .send({
        type: "group",
        title: "Family Group",
        memberIds: [childOne.memberId, childTwo.memberId],
      })
      .expect(201);

    const chatId = createChatRes.body._id;

    // Remove first child from family (should cascade to chats)
    await request(baseUrl)
      .delete(`/v1/families/${family.familyId}/members/${childOne.memberId}`)
      .set("Authorization", `Bearer ${family.parentToken}`)
      .expect(204);

    // Parent still sees chat without removed member
    const parentChatRes = await request(baseUrl)
      .get(`/v1/chats/${chatId}`)
      .set("Authorization", `Bearer ${family.parentToken}`)
      .expect(200);

    expect(parentChatRes.body.memberIds).not.toContain(childOne.memberId);
    expect(parentChatRes.body.memberIds).toEqual(
      expect.arrayContaining([family.userId, childTwo.memberId]),
    );

    // Remaining child still sees chat and does not see removed member
    const childTwoChats = await request(baseUrl)
      .get("/v1/chats")
      .set("Authorization", `Bearer ${childTwo.token}`)
      .expect(200);

    const updatedChat = childTwoChats.body.chats.find(
      (chat: { _id: string }) => chat._id === chatId,
    );
    expect(updatedChat).toBeDefined();
    expect(updatedChat.memberIds).not.toContain(childOne.memberId);

    // Removed child no longer sees the chat
    const removedChildChats = await request(baseUrl)
      .get("/v1/chats")
      .set("Authorization", `Bearer ${childOne.token}`)
      .expect(200);

    expect(
      removedChildChats.body.chats.find(
        (chat: { _id: string }) => chat._id === chatId,
      ),
    ).toBeUndefined();
  });

  it("deletes any DM involving the removed member including messages", async () => {
    const unique = Date.now() + 1;
    const family = await TestDataFactory.family(baseUrl, unique)
      .addChild("DM One")
      .addChild("DM Two")
      .build();

    const dmOne = family.members[0];
    const dmTwo = family.members[1];

    // Create a DM between the two children
    const dmRes = await request(baseUrl)
      .post("/v1/chats")
      .set("Authorization", `Bearer ${dmOne.token}`)
      .send({
        type: "dm",
        memberIds: [dmTwo.memberId],
      })
      .expect(201);

    const dmChatId = dmRes.body._id;

    // Send a message into the DM to ensure messages exist
    await request(baseUrl)
      .post(`/v1/chats/${dmChatId}/messages`)
      .set("Authorization", `Bearer ${dmOne.token}`)
      .send({ body: "Hello before removal" })
      .expect(201);

    // Parent removes one DM participant
    await request(baseUrl)
      .delete(`/v1/families/${family.familyId}/members/${dmOne.memberId}`)
      .set("Authorization", `Bearer ${family.parentToken}`)
      .expect(204);

    // Remaining participant should no longer see the DM
    const remainingChats = await request(baseUrl)
      .get("/v1/chats")
      .set("Authorization", `Bearer ${dmTwo.token}`)
      .expect(200);

    expect(
      remainingChats.body.chats.find(
        (chat: { _id: string }) => chat._id === dmChatId,
      ),
    ).toBeUndefined();

    // Fetching the DM should now 404
    await request(baseUrl)
      .get(`/v1/chats/${dmChatId}`)
      .set("Authorization", `Bearer ${dmTwo.token}`)
      .expect(404);
  });
});
