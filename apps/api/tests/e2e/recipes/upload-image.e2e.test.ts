import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/recipes/upload-image", () => {
  let baseUrl: string;
  let testCounter = 0;

  // Test image buffers
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  const jpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);

  const textBuffer = Buffer.from("This is not an image");

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("Success Cases", () => {
    it("should upload JPEG image and return imageUrl", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .set("Authorization", `Bearer ${family.token}`)
        .attach("file", jpegBuffer, "test.jpg");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("imageUrl");
      expect(response.body.imageUrl).toMatch(/^\/api\/images\/.+\/.+\.jpe?g$/);
      expect(response.body.imageUrl).toContain(family.familyId);
    });

    it("should upload PNG image and return imageUrl", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .set("Authorization", `Bearer ${family.token}`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("imageUrl");
      expect(response.body.imageUrl).toMatch(/^\/api\/images\/.+\/.+\.png$/);
      expect(response.body.imageUrl).toContain(family.familyId);
    });
  });

  describe("Validation", () => {
    it("should reject request without file", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(400);
    });

    it("should reject unsupported file type", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .set("Authorization", `Bearer ${family.token}`)
        .attach("file", textBuffer, "test.txt");

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject unauthenticated request", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(401);
    });

    it("should reject non-family member", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/upload-image`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(403);
    });
  });
});
