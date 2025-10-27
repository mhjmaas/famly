import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should return empty array when user has no families", async () => {
      const { token: authToken } = await registerTestUser(
        baseUrl,
        Date.now(),
        "nofamilies",
      );

      const response = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual([]);
    });

    it("should return family after creating one", async () => {
      const { token: authToken } = await setupTestFamily(baseUrl, Date.now(), {
        userName: "One Family User",
        familyName: "Test Family",
        prefix: "onefamily",
      });

      // List families
      const listResponse = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        name: "Test Family",
        role: "Parent",
      });
      expect(listResponse.body[0]).toHaveProperty("familyId");
      expect(listResponse.body[0]).toHaveProperty("linkedAt");
      expect(Array.isArray(listResponse.body[0].members)).toBe(true);
      expect(listResponse.body[0].members).toHaveLength(1);
      expect(listResponse.body[0].members[0]).toMatchObject({
        memberId: expect.any(String),
        role: "Parent",
        name: "One Family User",
      });
      expect(listResponse.body[0].members[0]).toHaveProperty("birthdate");
      expect(listResponse.body[0].members[0]).toHaveProperty("linkedAt");
    });

    it("should return multiple families in correct order (newest first)", async () => {
      const { token: authToken } = await registerTestUser(
        baseUrl,
        Date.now(),
        "multifamily",
        {
          name: "Multi Family User",
        },
      );

      // Create three families with small delays to ensure ordering
      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "First Family" });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Second Family" });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Third Family" });

      // List families
      const listResponse = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(3);

      // Verify ordering (newest first)
      expect(listResponse.body[0].name).toBe("Third Family");
      expect(listResponse.body[1].name).toBe("Second Family");
      expect(listResponse.body[2].name).toBe("First Family");

      // All should be Parent role with member details including name and birthdate
      interface FamilyMember {
        name: string;
        birthdate: string;
      }
      interface Family {
        role: string;
        members: FamilyMember[];
      }
      listResponse.body.forEach((family: Family) => {
        expect(family.role).toBe("Parent");
        expect(Array.isArray(family.members)).toBe(true);
        expect(family.members.length).toBeGreaterThan(0);
        family.members.forEach((member: FamilyMember) => {
          expect(member).toHaveProperty("name");
          expect(member).toHaveProperty("birthdate");
        });
      });
    });

    it("should handle families with null names", async () => {
      const { token: authToken } = await registerTestUser(
        baseUrl,
        Date.now(),
        "nullname",
        {
          name: "Null Name User",
        },
      );

      // Create family without name
      await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // List families
      const listResponse = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].name).toBeNull();
      expect(Array.isArray(listResponse.body[0].members)).toBe(true);
      expect(listResponse.body[0].members.length).toBeGreaterThan(0);
      expect(listResponse.body[0].members[0]).toHaveProperty("name");
      expect(listResponse.body[0].members[0]).toHaveProperty("birthdate");
    });
  });

  describe("Members Array", () => {
    it("should include all family members with correct details", async () => {
      const timestamp = Date.now();

      const {
        token: parentToken,
        userId: parentId,
        familyId,
      } = await setupTestFamily(baseUrl, timestamp, {
        userName: "Parent User",
        familyName: "Test Family",
        prefix: "parent",
        userBirthdate: "1980-01-15",
      });

      // 2. Add a child member
      const childRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: "childpass123",
          name: "Child User",
          birthdate: "2010-05-20",
          role: "Child",
        });

      const childId = childRes.body.memberId;

      // 3. Add a co-parent
      const coParentRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `coparent-${timestamp}@example.com`,
          password: "coparentpass123",
          name: "Co-Parent User",
          birthdate: "1982-06-20",
          role: "Parent",
        });

      const coParentId = coParentRes.body.memberId;

      // 4. List families and verify members array
      const listResponse = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${parentToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);

      const family = listResponse.body[0];

      // Verify family structure
      expect(family).toMatchObject({
        familyId,
        name: "Test Family",
        role: "Parent",
        linkedAt: expect.any(String),
      });

      // Verify members array exists and has correct length
      expect(Array.isArray(family.members)).toBe(true);
      expect(family.members).toHaveLength(3);

      // Verify all members have required fields including name and birthdate
      interface FamilyDetailMember {
        memberId: string;
        role: string;
        linkedAt: string;
        name: string;
        birthdate: string;
      }
      family.members.forEach((member: FamilyDetailMember) => {
        expect(member).toMatchObject({
          memberId: expect.any(String),
          role: expect.stringMatching(/^(Parent|Child)$/),
          linkedAt: expect.any(String),
          name: expect.any(String),
        });
        expect(member).toHaveProperty("birthdate");
      });

      // Verify specific member details
      const parentMember = family.members.find(
        (m: FamilyDetailMember) => m.memberId === parentId,
      );
      const childMember = family.members.find(
        (m: FamilyDetailMember) => m.memberId === childId,
      );
      const coParentMember = family.members.find(
        (m: FamilyDetailMember) => m.memberId === coParentId,
      );

      expect(parentMember).toBeDefined();
      expect(parentMember.role).toBe("Parent");
      expect(parentMember.name).toBe("Parent User");
      expect(parentMember.birthdate).toBe("1980-01-15");
      expect(parentMember).not.toHaveProperty("addedBy"); // Original creator has no addedBy

      expect(childMember).toBeDefined();
      expect(childMember.role).toBe("Child");
      expect(childMember.name).toBe("Child User");
      expect(childMember.birthdate).toBe("2010-05-20");
      expect(childMember.addedBy).toBe(parentId);

      expect(coParentMember).toBeDefined();
      expect(coParentMember.role).toBe("Parent");
      expect(coParentMember.name).toBe("Co-Parent User");
      expect(coParentMember.birthdate).toBe("1982-06-20");
      expect(coParentMember.addedBy).toBe(parentId);

      // Verify ISO date format for linkedAt
      family.members.forEach((member: FamilyDetailMember) => {
        expect(new Date(member.linkedAt).toISOString()).toBe(member.linkedAt);
      });
    });
  });

  describe("Payload Consistency", () => {
    it("should return consistent payload structure matching create response", async () => {
      const { token: authToken, family: createdFamily } = await setupTestFamily(
        baseUrl,
        Date.now(),
        {
          userName: "Consistency User",
          familyName: "Consistency Family",
          prefix: "consistency",
        },
      );

      // List families
      const listResponse = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${authToken}`);

      const listedFamily = listResponse.body[0];

      // Verify base payload matches create response and members array is included
      const { members, ...familyWithoutMembers } = listedFamily;
      expect(familyWithoutMembers).toEqual(createdFamily);
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
      expect(members[0]).toHaveProperty("name");
      expect(members[0]).toHaveProperty("birthdate");
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get("/v1/families");

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", "Bearer invalid-token-12345");

      expect(response.status).toBe(401);
    });

    it("should isolate families by user", async () => {
      const timestamp = Date.now();

      const { token: user1Token } = await setupTestFamily(baseUrl, timestamp, {
        userName: "User One",
        familyName: "User 1 Family",
        prefix: "user1",
      });

      const { token: user2Token } = await setupTestFamily(
        baseUrl,
        timestamp + 1,
        {
          userName: "User Two",
          familyName: "User 2 Family",
          prefix: "user2",
        },
      );

      // Verify User 1 only sees their family
      const user1List = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(user1List.body).toHaveLength(1);
      expect(user1List.body[0].name).toBe("User 1 Family");
      expect(user1List.body[0].members[0]).toHaveProperty("name", "User One");
      expect(user1List.body[0].members[0]).toHaveProperty("birthdate");

      // Verify User 2 only sees their family
      const user2List = await request(baseUrl)
        .get("/v1/families")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2List.body).toHaveLength(1);
      expect(user2List.body[0].name).toBe("User 2 Family");
      expect(user2List.body[0].members[0]).toHaveProperty("name", "User Two");
      expect(user2List.body[0].members[0]).toHaveProperty("birthdate");
    });
  });
});
