import { FamilyRole } from "@modules/family/domain/family";
import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("DELETE /v1/families/:familyId/members/:memberId - Remove Family Member", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it("allows a parent to remove a child and updates roster access immediately", async () => {
    const timestamp = Date.now();

    // 1. Register parent and create a family
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

    const familyId = familyRes.body.familyId;

    // 2. Add a child member so the parent can remove them
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
    expect(ObjectId.isValid(childId)).toBe(true);
    expect(addChildRes.body.addedBy).toBe(parentId);

    // 3. Child logs in to obtain credentials prior to removal
    const childLoginRes = await request(baseUrl)
      .post("/v1/auth/login")
      .send({
        email: childEmail,
        password: "childpass123",
      })
      .expect(200);

    const childToken =
      childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

    // 4. Parent removes the child member
    await request(baseUrl)
      .delete(`/v1/families/${familyId}/members/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(204);

    // 5. Parent fetches roster and confirms removed member no longer present
    const parentFamiliesRes = await request(baseUrl)
      .get("/v1/families")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(200);

    const updatedFamily = parentFamiliesRes.body.find(
      (family: { familyId: string }) => family.familyId === familyId,
    );

    expect(updatedFamily).toBeDefined();
    expect(updatedFamily.members).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ memberId: childId }),
      ]),
    );

    // 6. Removed child can no longer see the family in their roster
    const childFamiliesRes = await request(baseUrl)
      .get("/v1/families")
      .set("Authorization", `Bearer ${childToken}`)
      .expect(200);

    expect(childFamiliesRes.body).toEqual([]);
  });
});
