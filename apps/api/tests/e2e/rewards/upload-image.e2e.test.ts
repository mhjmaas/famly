import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Reward Image Upload", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /v1/families/:familyId/rewards/upload-image", () => {
    it("should upload image successfully as parent", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Upload Test Family")
        .build();

      // Create a small test image buffer (1x1 PNG)
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("imageUrl");
      expect(response.body.imageUrl).toMatch(/^\/api\/images\/.+\/.+\.png$/);
      expect(response.body.imageUrl).toContain(family.familyId);
    });

    it("should upload JPEG image", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("JPEG Upload Family")
        .build();

      // Minimal JPEG header
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", jpegBuffer, "test.jpg");

      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toMatch(/\.jpg$/);
    });

    it("should upload GIF image", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("GIF Upload Family")
        .build();

      // Minimal GIF header
      const gifBuffer = Buffer.from(
        "GIF89a\x01\x00\x01\x00\x00\x00\x00;",
        "binary",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", gifBuffer, "test.gif");

      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toMatch(/\.gif$/);
    });

    it("should upload WebP image", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("WebP Upload Family")
        .build();

      // Minimal WebP RIFF header
      const webpBuffer = Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ", "binary");

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", webpBuffer, "test.webp");

      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toMatch(/\.webp$/);
    });

    it("should reject file exceeding 5MB limit", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Large File Family")
        .build();

      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", largeBuffer, "large.png");

      expect(response.status).toBe(413);
    });

    it("should reject invalid file type (PDF)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Invalid Type Family")
        .build();

      const pdfBuffer = Buffer.from("%PDF-1.4", "binary");

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", pdfBuffer, "document.pdf");

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/only.*images.*allowed/i);
    });

    it("should reject invalid file type (TXT)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Text File Family")
        .build();

      const txtBuffer = Buffer.from("Hello, world!");

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", txtBuffer, "document.txt");

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/only.*images.*allowed/i);
    });

    it("should reject request without file", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("No File Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/file.*required/i);
    });

    it("should reject child user (403)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Child Upload Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${childToken}`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/parent/i);
    });

    it("should reject non-member user (403)", async () => {
      const family1 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 1")
        .build();

      const family2 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 2")
        .build();

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      // Try to upload to family1 with family2's token
      const response = await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family2.parentToken}`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated request (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Test Family")
        .build();

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .attach("file", pngBuffer, "test.png");

      expect(response.status).toBe(401);
    });

    it("should generate unique filenames for multiple uploads", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Multi Upload Family")
        .build();

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      const response1 = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", pngBuffer, "test1.png");

      const response2 = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .attach("file", pngBuffer, "test2.png");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.imageUrl).not.toBe(response2.body.imageUrl);
    });

    it("should scope uploads to family", async () => {
      const family1 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 1")
        .build();

      const family2 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 2")
        .build();

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );

      const response1 = await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family1.parentToken}`)
        .attach("file", pngBuffer, "test.png");

      const response2 = await request(baseUrl)
        .post(`/v1/families/${family2.familyId}/rewards/upload-image`)
        .set("Authorization", `Bearer ${family2.parentToken}`)
        .attach("file", pngBuffer, "test.png");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.imageUrl).toContain(family1.familyId);
      expect(response2.body.imageUrl).toContain(family2.familyId);
      expect(response1.body.imageUrl).not.toContain(family2.familyId);
      expect(response2.body.imageUrl).not.toContain(family1.familyId);
    });
  });
});
