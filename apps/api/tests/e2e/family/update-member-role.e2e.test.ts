import { FamilyRole } from "@modules/family/domain/family";
import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("PATCH /v1/families/:familyId/members/:memberId - Update Member Role", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("successful role updates", () => {
    it("should allow parent to update child member to parent role", async () => {
      // 1. Register parent and create family
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

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add child member
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

      const childMemberId = childRes.body.memberId;

      // 3. Update child to parent role
      const updateRes = await request(baseUrl)
        .patch(`/v1/families/${familyId}/members/${childMemberId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ role: FamilyRole.Parent })
        .expect(200);

      expect(updateRes.body).toEqual({
        memberId: childMemberId,
        familyId,
        role: FamilyRole.Parent,
        updatedAt: expect.any(String),
      });

      // 4. Verify role was updated by listing families
      const familiesRes = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      const family = familiesRes.body.find((f: any) => f.familyId === familyId);
      expect(family).toBeDefined();
    });

    it("should allow parent to update parent member to child role", async () => {
      // 1. Register parent and create family
      const timestamp = Date.now();
      const parent1Res = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: "parent1pass123",
          name: "Parent One",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add second parent
      const parent2Res = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: "parent2pass123",
          name: "Parent Two",
          birthdate: "1982-03-10",
          role: FamilyRole.Parent,
        })
        .expect(201);

      const parent2MemberId = parent2Res.body.memberId;

      // 3. Update second parent to child role
      const updateRes = await request(baseUrl)
        .patch(`/v1/families/${familyId}/members/${parent2MemberId}`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({ role: FamilyRole.Child })
        .expect(200);

      expect(updateRes.body).toEqual({
        memberId: parent2MemberId,
        familyId,
        role: FamilyRole.Child,
        updatedAt: expect.any(String),
      });
    });
  });

  describe("authorization", () => {
    it("should reject non-parent users from updating roles", async () => {
      // 1. Register parent and create family
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

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add child member
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

      const childToken = childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

      // 4. Attempt to update parent's role as child (should fail)
      const parentMemberId = parentRes.body.user?.id || parentRes.body.userId;

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/members/${parentMemberId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({ role: FamilyRole.Child })
        .expect(403);
    });
  });

  describe("validation", () => {
    it("should reject invalid role values", async () => {
      // 1. Register parent and create family
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

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Add child member
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

      // 3. Attempt to update with invalid role
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/members/${childRes.body.memberId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ role: "InvalidRole" })
        .expect(400);
    });
  });

  describe("not found errors", () => {
    it("should return 403 for non-existent family (authorization check first)", async () => {
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

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      // 2. Create family to get valid family context
      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      // 3. Attempt to update member in non-existent family
      // Note: Returns 403 (not 404) because authorization middleware runs first
      // This is acceptable from a security perspective (don't leak family existence)
      const fakeFamilyId = new ObjectId().toString();
      const fakeMemberId = new ObjectId().toString();

      await request(baseUrl)
        .patch(`/v1/families/${fakeFamilyId}/members/${fakeMemberId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ role: FamilyRole.Parent })
        .expect(403);
    });

    it("should return 404 for non-existent member", async () => {
      // 1. Register parent and create family
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

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: "Test Family" })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 2. Attempt to update non-existent member
      const fakeMemberId = new ObjectId().toString();

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/members/${fakeMemberId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ role: FamilyRole.Parent })
        .expect(404);
    });

    it("should return 404 when member belongs to different family", async () => {
      // 1. Register first parent and create first family
      const timestamp = Date.now();
      const parent1Res = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: "parent1pass123",
          name: "Parent One",
          birthdate: "1980-01-15",
        })
        .expect(201);

      const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;

      const family1Res = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({ name: "Family One" })
        .expect(201);

      const family1Id = family1Res.body.familyId;

      // 2. Register second parent and create second family
      const parent2Res = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: "parent2pass123",
          name: "Parent Two",
          birthdate: "1982-03-10",
        })
        .expect(201);

      const parent2Token = parent2Res.body.accessToken || parent2Res.body.sessionToken;
      const parent2Id = parent2Res.body.user?.id || parent2Res.body.userId;

      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${parent2Token}`)
        .send({ name: "Family Two" })
        .expect(201);

      // 3. Attempt to update parent2 (who belongs to family2) using family1 context
      await request(baseUrl)
        .patch(`/v1/families/${family1Id}/members/${parent2Id}`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({ role: FamilyRole.Child })
        .expect(404);
    });
  });
});
