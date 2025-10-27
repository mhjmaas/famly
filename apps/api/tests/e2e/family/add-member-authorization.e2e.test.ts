import { FamilyRole } from "@modules/family/domain/family";
import { ObjectId } from "mongodb";
import request from "supertest";
import {
  addChildMember,
  registerTestUser,
  setupTestFamily,
} from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("POST /v1/families/:familyId/members - Authorization (Non-Parent)", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("non-parent authorization rejection", () => {
    it("should reject request from child member with 403 Forbidden", async () => {
      let testCounter = 0;
      testCounter++;

      // 1. Setup family with parent and child
      const setup = await setupTestFamily(baseUrl, testCounter);
      const { familyId, parentToken } = setup;

      // 2. Add a child member
      const child = await addChildMember(
        baseUrl,
        familyId,
        parentToken,
        testCounter,
      );
      const childToken = child.childToken;

      // 3. Try to add a new member as a child - should get 403
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `newmember-${testCounter}@example.com`,
          password: "newmemberpass123",
          name: "New Member",
          birthdate: "2008-03-10",
          role: FamilyRole.Child,
        })
        .expect(403);
    });

    it("should reject request from user not in family with 403 Forbidden", async () => {
      let testCounter = 0;
      // 1. Setup family1 with parent1
      testCounter++;
      const family1 = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent One",
        familyName: "Family One",
      });

      // 2. Register parent2 (not in family1)
      testCounter++;
      const parent2 = await registerTestUser(baseUrl, testCounter, "parent", {
        name: "Parent Two",
      });

      // 3. Try to add member to family1 as parent2 (not in family1) - should get 403
      await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/members`)
        .set("Authorization", `Bearer ${parent2.token}`)
        .send({
          email: `newmember-${testCounter}@example.com`,
          password: "newmemberpass123",
          name: "New Member",
          birthdate: "2007-08-25",
          role: FamilyRole.Child,
        })
        .expect(403);
    });

    it("should return 403 with clear error message for authorization failure", async () => {
      let testCounter = 0;
      testCounter++;

      // 1. Setup family with parent and child
      const setup = await setupTestFamily(baseUrl, testCounter);
      const { familyId, parentToken } = setup;

      // 2. Add a child member
      const child = await addChildMember(
        baseUrl,
        familyId,
        parentToken,
        testCounter,
      );
      const childToken = child.childToken;

      // 3. Verify 403 response structure
      const forbiddenRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `newmember-${testCounter}@example.com`,
          password: "newmemberpass123",
          name: "New Member",
          birthdate: "2008-03-10",
          role: FamilyRole.Child,
        })
        .expect(403);

      expect(forbiddenRes.body).toHaveProperty("error");
      expect(forbiddenRes.body.error).toMatch(/parent|role/i);
    });

    it("should not create any side effects when authorization fails", async () => {
      let testCounter = 0;
      testCounter++;

      // 1. Setup family with parent and child
      const setup = await setupTestFamily(baseUrl, testCounter);
      const { familyId, parentToken } = setup;

      // 2. Add a child member
      const child = await addChildMember(
        baseUrl,
        familyId,
        parentToken,
        testCounter,
      );
      const childToken = child.childToken;

      // 3. Try to add member with email that would be unique - should fail
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `unique-email-${testCounter}@example.com`,
          password: "uniquepass123",
          name: "Unique User",
          birthdate: "2006-11-30",
          role: FamilyRole.Child,
        })
        .expect(403);

      // 4. Verify the email wasn't created (attempt to register with same email should succeed)
      const signupRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `unique-email-${testCounter}@example.com`,
          password: "differentpass123",
          name: "New User",
          birthdate: "2005-04-12",
        })
        .expect(201); // Should succeed because user wasn't created in previous attempt

      expect(signupRes.body.user.id).toBeDefined();
    });
  });

  describe("authentication requirements", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const familyId = new ObjectId().toString();

      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .send({
          email: "member@example.com",
          password: "memberpass123",
          role: FamilyRole.Child,
        })
        .expect(401);
    });

    it("should reject requests with invalid token with 401", async () => {
      const familyId = new ObjectId().toString();

      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", "Bearer invalid-token")
        .send({
          email: "member@example.com",
          password: "memberpass123",
          role: FamilyRole.Child,
        })
        .expect(401);
    });
  });
});
