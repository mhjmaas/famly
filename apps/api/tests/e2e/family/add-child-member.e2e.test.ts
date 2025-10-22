import request from "supertest";
import { ObjectId } from "mongodb";
import { getTestApp } from "../helpers/test-app";
import { cleanDatabase } from "../helpers/database";
import { FamilyRole } from "@modules/family/domain/family";

describe("POST /v1/families/:familyId/members - Add Child Member", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("successful child member creation", () => {
    it("should allow parent to add child member to their family", async () => {
      // 1. Register parent
      const timestamp = Date.now();
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

      // 3. Add child to family
      const childRes = await request(baseUrl)
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

      // 4. Verify response structure
      expect(childRes.body).toMatchObject({
        memberId: expect.any(String),
        familyId,
        role: FamilyRole.Child,
        linkedAt: expect.any(String),
        addedBy: expect.any(String),
      });

      expect(ObjectId.isValid(childRes.body.memberId)).toBe(true);
      expect(ObjectId.isValid(childRes.body.addedBy)).toBe(true);

      // 5. Verify no auth tokens issued for child
      expect(childRes.body).not.toHaveProperty("session");
      expect(childRes.body).not.toHaveProperty("token");
      expect(childRes.headers["set-cookie"]).toBeUndefined();
    });

    it("should include addedBy field matching parent user ID", async () => {
      const timestamp = Date.now();
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
      const parentId = parentRes.body.user.id;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const childRes = await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(201);

      expect(childRes.body.addedBy).toBe(parentId);
    });
  });

  describe("validation errors", () => {
    it("should reject request with invalid email", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({ name: "Test Family" })
        .expect(201);

      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: "not-an-email",
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(400);
    });

    it("should reject request with password shorter than 8 characters", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({ name: "Test Family" })
        .expect(201);

      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          password: "short",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(400);
    });

    it("should reject request with invalid role", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({ name: "Test Family" })
        .expect(201);

      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: "InvalidRole",
        })
        .expect(400);
    });

    it("should reject request with missing required fields", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({ name: "Test Family" })
        .expect(201);

      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          // Missing password, role, name, and birthdate
        })
        .expect(400);
    });
  });

  describe("duplicate prevention", () => {
    it("should reject adding child with email already in same family", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({ name: "Test Family" })
        .expect(201);

      // Add child first time
      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(201);

      // Try to add same child again
      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          password: "differentpass",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(409);
    });
  });

  describe("authentication and authorization", () => {
    it("should reject unauthenticated requests", async () => {
      const familyId = new ObjectId().toString();

      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .send({
          email: "child@example.com",
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(401);
    });

    it("should reject request with invalid familyId format", async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent-${timestamp}@example.com`,
          password: "parentpass123",
          name: "Parent User",
          birthdate: "1980-01-15",
        })
        .expect(201);

      await request(baseUrl)
        .post("/v1/families/invalid-id/members")
        .set(
          "Authorization",
          `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`,
        )
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: FamilyRole.Child,
        })
        .expect(400);
    });
  });
});
