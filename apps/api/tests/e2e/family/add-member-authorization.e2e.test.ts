import { FamilyRole } from "@modules/family/domain/family";
import { ObjectId } from "mongodb";
import request from "supertest";
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
      const timestamp = Date.now();
      // 1. Register parent
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parentToken =
        parentRes.body.accessToken || parentRes.body.sessionToken;

      // 2. Create family
      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 3. Add a child member to the family
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(201);

      // 4. Get JWT token for the child (by making them login after parent creates account)
      const childLoginRes = await request(baseUrl)
        .post("/v1/auth/login")
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
        })
        .expect(200);

      const childToken =
        childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

      // 5. Try to add a new member as a child - should get 403
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `newmember-${timestamp}@example.com`,
          password: "newmemberpass123",
          name: "New Member",
          birthdate: "2008-03-10",
          role: FamilyRole.Child,
        })
        .expect(403);
    });

    it("should reject request from user not in family with 403 Forbidden", async () => {
      const timestamp = Date.now();
      // 1. Register parent1 and create family
      const parent1Res = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: "parent1pass123",
          name: "Parent One",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parent1Token =
        parent1Res.body.accessToken || parent1Res.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({ name: "Family One" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Register parent2 (not in family1)
      const parent2Res = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: "parent2pass123",
          name: "Parent Two",
          birthdate: "1982-06-20",
        })
        .expect(201);

      const parent2Token =
        parent2Res.body.accessToken || parent2Res.body.sessionToken;

      // 3. Try to add member to family1 as parent2 (not in family1) - should get 403
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parent2Token}`)
        .send({
          email: `newmember-${timestamp}@example.com`,
          password: "newmemberpass123",
          name: "New Member",
          birthdate: "2007-08-25",
          role: FamilyRole.Child,
        })
        .expect(403);
    });

    it("should return 403 with clear error message for authorization failure", async () => {
      const timestamp = Date.now();
      // 1. Register parent and create family
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parentToken =
        parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add a child
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(201);

      // 3. Login as child and try to add member
      const childLoginRes = await request(baseUrl)
        .post("/v1/auth/login")
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
        })
        .expect(200);

      const childToken =
        childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

      // 4. Verify 403 response structure
      const forbiddenRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `newmember-${timestamp}@example.com`,
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
      const timestamp = Date.now();
      // 1. Setup parent and family
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parentToken =
        parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add child
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(201);

      // 3. Login as child
      const childLoginRes = await request(baseUrl)
        .post("/v1/auth/login")
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
        })
        .expect(200);

      const childToken =
        childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

      // 4. Try to add member with email that would be unique - should fail
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          email: `unique-email-${timestamp}@example.com`,
          password: "uniquepass123",
          name: "Unique User",
          birthdate: "2006-11-30",
          role: FamilyRole.Child,
        })
        .expect(403);

      // 5. Verify the email wasn't created (attempt to register with same email should succeed)
      const signupRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `unique-email-${timestamp}@example.com`,
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
