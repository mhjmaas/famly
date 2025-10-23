import { ObjectId } from "mongodb";
import type { DiaryEntry } from "../../../src/modules/diary/domain/diary-entry";
import { toDiaryEntryDTO } from "../../../src/modules/diary/lib/diary-entry.mapper";

describe("Diary Entry Mapper", () => {
  describe("toDiaryEntryDTO", () => {
    it("should convert DiaryEntry to DiaryEntryDTO", () => {
      const entryId = new ObjectId();
      const userId = new ObjectId();
      const now = new Date("2025-01-15T10:30:00Z");

      const entry: DiaryEntry = {
        _id: entryId,
        date: "2025-01-15",
        entry: "Today was a great day!",
        isPersonal: true,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto._id).toBe(entryId.toString());
      expect(dto.date).toBe("2025-01-15");
      expect(dto.entry).toBe("Today was a great day!");
      expect(dto.isPersonal).toBe(true);
      expect(dto.createdBy).toBe(userId.toString());
      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T10:30:00.000Z");
    });

    it("should convert _id ObjectId to string", () => {
      const entryId = new ObjectId("507f1f77bcf86cd799439011");
      const userId = new ObjectId();

      const entry: DiaryEntry = {
        _id: entryId,
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(typeof dto._id).toBe("string");
    });

    it("should convert createdBy ObjectId to string", () => {
      const userId = new ObjectId("507f1f77bcf86cd799439012");

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.createdBy).toBe("507f1f77bcf86cd799439012");
      expect(typeof dto.createdBy).toBe("string");
    });

    it("should convert createdAt Date to ISO string", () => {
      const createdAt = new Date("2025-01-15T14:45:30.123Z");

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt,
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.createdAt).toBe("2025-01-15T14:45:30.123Z");
      expect(typeof dto.createdAt).toBe("string");
    });

    it("should convert updatedAt Date to ISO string", () => {
      const updatedAt = new Date("2025-01-15T16:20:00.456Z");

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt,
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.updatedAt).toBe("2025-01-15T16:20:00.456Z");
      expect(typeof dto.updatedAt).toBe("string");
    });

    it("should preserve date field as string", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.date).toBe("2025-01-15");
      expect(typeof dto.date).toBe("string");
    });

    it("should preserve entry text", () => {
      const entryText =
        "This is a longer diary entry with multiple sentences. It has special characters! @#$%^&*()";

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: entryText,
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.entry).toBe(entryText);
      expect(typeof dto.entry).toBe("string");
    });

    it("should preserve isPersonal flag as true", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Personal entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.isPersonal).toBe(true);
      expect(typeof dto.isPersonal).toBe("boolean");
    });

    it("should preserve isPersonal flag as false", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Family entry",
        isPersonal: false,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.isPersonal).toBe(false);
      expect(typeof dto.isPersonal).toBe("boolean");
    });

    it("should have all required fields in output DTO", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto).toHaveProperty("_id");
      expect(dto).toHaveProperty("date");
      expect(dto).toHaveProperty("entry");
      expect(dto).toHaveProperty("isPersonal");
      expect(dto).toHaveProperty("createdBy");
      expect(dto).toHaveProperty("createdAt");
      expect(dto).toHaveProperty("updatedAt");
    });

    it("should have correct field types in output DTO", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Test entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(typeof dto._id).toBe("string");
      expect(typeof dto.date).toBe("string");
      expect(typeof dto.entry).toBe("string");
      expect(typeof dto.isPersonal).toBe("boolean");
      expect(typeof dto.createdBy).toBe("string");
      expect(typeof dto.createdAt).toBe("string");
      expect(typeof dto.updatedAt).toBe("string");
    });

    it("should handle very long entry text", () => {
      const longEntry = "a".repeat(10000);

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: longEntry,
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.entry).toBe(longEntry);
      expect(dto.entry.length).toBe(10000);
    });

    it("should handle very short entry text", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "A",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.entry).toBe("A");
      expect(dto.entry.length).toBe(1);
    });

    it("should handle dates with special characters and formatting", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2020-02-29",
        entry: "Leap year entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.date).toBe("2020-02-29");
    });

    it("should handle different times on same date", () => {
      const createdAt = new Date("2025-01-15T08:00:00.000Z");
      const updatedAt = new Date("2025-01-15T20:30:45.789Z");

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Updated later in the day",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt,
        updatedAt,
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.createdAt).toBe("2025-01-15T08:00:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T20:30:45.789Z");
      expect(dto.createdAt).not.toBe(dto.updatedAt);
    });

    it("should handle entry text with unicode and special characters", () => {
      const entryText =
        "Entry with emoji 🎉 and foreign text: 日本語, 中文, Ελληνικά";

      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: entryText,
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toDiaryEntryDTO(entry);

      expect(dto.entry).toBe(entryText);
      expect(dto.entry).toContain("🎉");
      expect(dto.entry).toContain("日本語");
    });

    it("should not modify original entry object", () => {
      const entry: DiaryEntry = {
        _id: new ObjectId(),
        date: "2025-01-15",
        entry: "Original entry",
        isPersonal: true,
        createdBy: new ObjectId(),
        createdAt: new Date("2025-01-15T10:00:00Z"),
        updatedAt: new Date("2025-01-15T10:00:00Z"),
      };

      const originalId = entry._id.toHexString();
      const originalDate = entry.date;
      const originalEntry = entry.entry;

      toDiaryEntryDTO(entry);

      expect(entry._id.toHexString()).toBe(originalId);
      expect(entry.date).toBe(originalDate);
      expect(entry.entry).toBe(originalEntry);
    });
  });
});
