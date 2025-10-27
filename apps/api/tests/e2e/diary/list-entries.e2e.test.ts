import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/diary - List Entries", () => {
  let baseUrl: string;
  let authToken: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const user = await registerTestUser(baseUrl, testCounter, "listuser", {
      name: "List User",
      birthdate: "1988-03-20",
    });

    authToken = user.token;
  });

  describe("Success Cases", () => {
    it("should return empty array for user with no entries", async () => {
      const response = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should list all user's diary entries", async () => {
      // Create multiple entries
      const dates = ["2025-10-23", "2025-10-22", "2025-10-21"];
      const createdEntries = [];

      for (const date of dates) {
        const createResponse = await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });

        createdEntries.push(createResponse.body);
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body).toHaveLength(3);

      // Verify each entry is in the response
      for (const createdEntry of createdEntries) {
        expect(listResponse.body).toContainEqual(
          expect.objectContaining({
            _id: createdEntry._id,
            date: createdEntry.date,
            entry: createdEntry.entry,
          }),
        );
      }
    });

    it("should return entries sorted by date descending (newest first)", async () => {
      // Create entries in arbitrary order
      const dates = ["2025-10-21", "2025-10-23", "2025-10-22"];

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(3);

      // Verify sorting: newest first
      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      expect(returnedDates).toEqual(["2025-10-23", "2025-10-22", "2025-10-21"]);
    });

    it("should include all required fields in each entry", async () => {
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry for field validation",
        });

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);

      const entry = listResponse.body[0];
      expect(entry).toHaveProperty("_id");
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("entry");
      expect(entry).toHaveProperty("isPersonal", true);
      expect(entry).toHaveProperty("createdBy");
      expect(entry).toHaveProperty("createdAt");
      expect(entry).toHaveProperty("updatedAt");
    });

    it("should filter by startDate only", async () => {
      // Create entries with different dates
      const dates = ["2025-10-10", "2025-10-20", "2025-10-30"];

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ startDate: "2025-10-20" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(2);

      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      expect(returnedDates).toEqual(["2025-10-30", "2025-10-20"]);
    });

    it("should filter by endDate only", async () => {
      // Create entries with different dates
      const dates = ["2025-10-10", "2025-10-20", "2025-10-30"];

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ endDate: "2025-10-20" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(2);

      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      expect(returnedDates).toEqual(["2025-10-20", "2025-10-10"]);
    });

    it("should filter by both startDate and endDate", async () => {
      // Create entries with different dates
      const dates = [
        "2025-10-10",
        "2025-10-15",
        "2025-10-20",
        "2025-10-25",
        "2025-10-30",
      ];

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ startDate: "2025-10-15", endDate: "2025-10-25" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(3);

      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      expect(returnedDates).toEqual(["2025-10-25", "2025-10-20", "2025-10-15"]);
    });

    it("should return matching entries only when filtering by date range", async () => {
      // Create entries across multiple months
      const dates = ["2025-09-30", "2025-10-10", "2025-10-20", "2025-11-10"];

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ startDate: "2025-10-01", endDate: "2025-10-31" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(2);

      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      expect(returnedDates).toContain("2025-10-10");
      expect(returnedDates).toContain("2025-10-20");
    });
  });

  describe("Data Isolation", () => {
    it("should only show entries created by the authenticated user", async () => {
      // Create entry as first user
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      // Register and create entry as second user
      testCounter++;
      const user2 = await registerTestUser(baseUrl, testCounter, "listuser", {
        name: "Second User",
        birthdate: "1992-07-15",
      });
      const user2Token = user2.token;

      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 2 entry",
        });

      // List entries as first user
      const user1ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(user1ListResponse.status).toBe(200);
      expect(user1ListResponse.body).toHaveLength(1);
      expect(user1ListResponse.body[0].entry).toBe("User 1 entry");

      // List entries as second user
      const user2ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2ListResponse.status).toBe(200);
      expect(user2ListResponse.body).toHaveLength(1);
      expect(user2ListResponse.body[0].entry).toBe("User 2 entry");
    });

    it("should not leak other users' entries in filtered results", async () => {
      // Create entry as first user
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-20",
          entry: "User 1 entry",
        });

      // Register second user and create entry
      testCounter++;
      const user2 = await registerTestUser(baseUrl, testCounter, "listuser", {
        name: "Second User",
        birthdate: "1995-11-25",
      });
      const user2Token = user2.token;

      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-25",
          entry: "User 2 entry in same date range",
        });

      // List as user1 with date range that would include both if not filtered
      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ startDate: "2025-10-01", endDate: "2025-10-31" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].entry).toBe("User 1 entry");
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const response = await request(baseUrl).get("/v1/diary");

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", "Bearer invalid-token-xyz");

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed Authorization header with 401", async () => {
      const response = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", "InvalidBearer token");

      expect(response.status).toBe(401);
    });
  });

  describe("Query Parameter Handling", () => {
    it("should handle valid date format in query parameters correctly", async () => {
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry",
        });

      const response = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ startDate: "2025-10-23", endDate: "2025-10-23" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe("Large Dataset Handling", () => {
    it("should handle multiple entries efficiently", async () => {
      // Create 10 entries
      const dates = Array.from(
        { length: 10 },
        (_, i) => new Date(2025, 9, i + 1).toISOString().split("T")[0],
      );

      for (const date of dates) {
        await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date,
            entry: `Entry for ${date}`,
          });
      }

      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(10);

      // Verify sorting is still correct
      const returnedDates = listResponse.body.map(
        (entry: { date: string }) => entry.date,
      );
      const expectedDates = dates.sort().reverse();
      expect(returnedDates).toEqual(expectedDates);
    });
  });
});
