import { FamilyRole } from "@modules/family/domain/family";
import request from "supertest";
import { loginTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("DELETE /v1/families/:familyId/members/:memberId - Non-parent authorization", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it("returns 403 when a child attempts to remove a family member", async () => {
    const timestamp = Date.now();

    const { token: parentToken, familyId } = await setupTestFamily(
      baseUrl,
      timestamp,
      {
        userName: "Parent User",
        familyName: "Authorization Family",
        prefix: "parent",
      },
    );
    const childEmail = `child-${timestamp}@example.com`;

    const addChildRes = await request(baseUrl)
      .post(`/v1/families/${familyId}/members`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        email: childEmail,
        password: "childpass123",
        name: "Child User",
        birthdate: "2010-05-20",
        role: FamilyRole.Child,
      })
      .expect(201);

    const childId = addChildRes.body.memberId;

    const { token: childToken } = await loginTestUser(
      baseUrl,
      childEmail,
      "childpass123",
    );

    const forbiddenRes = await request(baseUrl)
      .delete(`/v1/families/${familyId}/members/${childId}`)
      .set("Authorization", `Bearer ${childToken}`)
      .expect(403);

    expect(forbiddenRes.body).toHaveProperty("error");
    expect(forbiddenRes.body.error).toMatch(/parent/i);

    const parentRoster = await request(baseUrl)
      .get("/v1/families")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(200);

    const family = parentRoster.body.find(
      (entry: { familyId: string }) => entry.familyId === familyId,
    );
    expect(family).toBeDefined();
    expect(family.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: childId, role: FamilyRole.Child }),
      ]),
    );
  });
});
