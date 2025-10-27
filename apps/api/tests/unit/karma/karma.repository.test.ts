import { ObjectId } from "mongodb";
import type {
  KarmaEvent,
  MemberKarma,
} from "../../../src/modules/karma/domain/karma";

// Mock the MongoDB client and logger
jest.mock("../../../src/infra/mongo/client", () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn((name: string) => {
      if (name === "member_karma") {
        return mockMemberKarmaCollection;
      }
      if (name === "karma_events") {
        return mockKarmaEventsCollection;
      }
      return null;
    }),
  })),
}));

jest.mock("../../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

const mockMemberKarmaCollection = {
  createIndex: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockKarmaEventsCollection = {
  createIndex: jest.fn(),
  insertOne: jest.fn(),
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      limit: jest.fn(() => ({
        toArray: jest.fn(),
      })),
    })),
  })),
};

// Import after mocks
import { KarmaRepository } from "../../../src/modules/karma/repositories/karma.repository";

describe("KarmaRepository", () => {
  let repository: KarmaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new KarmaRepository();
  });

  describe("ensureIndexes", () => {
    it("should create all indexes", async () => {
      mockMemberKarmaCollection.createIndex.mockResolvedValue("index_created");
      mockKarmaEventsCollection.createIndex.mockResolvedValue("index_created");

      await repository.ensureIndexes();

      // Member karma indexes
      expect(mockMemberKarmaCollection.createIndex).toHaveBeenCalledWith(
        { familyId: 1, userId: 1 },
        { unique: true, name: "idx_member_karma_unique" },
      );
      expect(mockMemberKarmaCollection.createIndex).toHaveBeenCalledWith(
        { familyId: 1 },
        { name: "idx_member_karma_family" },
      );

      // Karma events indexes
      expect(mockKarmaEventsCollection.createIndex).toHaveBeenCalledWith(
        { familyId: 1, userId: 1, createdAt: -1 },
        { name: "idx_karma_events_user_time" },
      );
      expect(mockKarmaEventsCollection.createIndex).toHaveBeenCalledWith(
        { createdAt: -1 },
        { name: "idx_karma_events_time" },
      );
    });
  });

  describe("createKarmaEvent", () => {
    it("should create a karma event", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();

      mockKarmaEventsCollection.insertOne.mockResolvedValue({
        insertedId: new ObjectId(),
      });

      const result = await repository.createKarmaEvent({
        familyId,
        userId,
        amount: 25,
        source: "task_completion",
        description: "Completed task",
        metadata: { taskId: "123" },
      });

      expect(mockKarmaEventsCollection.insertOne).toHaveBeenCalled();
      expect(result._id).toBeInstanceOf(ObjectId);
      expect(result.familyId).toEqual(familyId);
      expect(result.userId).toEqual(userId);
      expect(result.amount).toBe(25);
      expect(result.source).toBe("task_completion");
      expect(result.description).toBe("Completed task");
      expect(result.metadata).toEqual({ taskId: "123" });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should create event without metadata", async () => {
      const insertedId = new ObjectId();

      mockKarmaEventsCollection.insertOne.mockResolvedValue({
        insertedId,
      });

      const result = await repository.createKarmaEvent({
        familyId: new ObjectId(),
        userId: new ObjectId(),
        amount: 10,
        source: "manual_grant",
        description: "Manual grant",
      });

      expect(result.metadata).toBeUndefined();
    });
  });

  describe("upsertMemberKarma", () => {
    it("should increment existing member karma", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const existingKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 100,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      };

      mockMemberKarmaCollection.findOneAndUpdate.mockResolvedValue(
        existingKarma,
      );

      const result = await repository.upsertMemberKarma(familyId, userId, 25);

      expect(mockMemberKarmaCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { familyId, userId },
        expect.objectContaining({
          $inc: { totalKarma: 25 },
          $set: { updatedAt: expect.any(Date) },
        }),
        { upsert: true, returnDocument: "after" },
      );
      expect(result).toEqual(existingKarma);
    });

    it("should create new member karma if not exists", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const newKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMemberKarmaCollection.findOneAndUpdate.mockResolvedValue(newKarma);

      const result = await repository.upsertMemberKarma(familyId, userId, 50);

      expect(mockMemberKarmaCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { familyId, userId },
        expect.objectContaining({
          $inc: { totalKarma: 50 },
          $setOnInsert: expect.objectContaining({
            _id: expect.any(ObjectId),
            familyId,
            userId,
            createdAt: expect.any(Date),
          }),
        }),
        { upsert: true, returnDocument: "after" },
      );
      expect(result).toEqual(newKarma);
    });
  });

  describe("findMemberKarma", () => {
    it("should find member karma by family and user", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const memberKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMemberKarmaCollection.findOne.mockResolvedValue(memberKarma);

      const result = await repository.findMemberKarma(familyId, userId);

      expect(mockMemberKarmaCollection.findOne).toHaveBeenCalledWith({
        familyId,
        userId,
      });
      expect(result).toEqual(memberKarma);
    });

    it("should return null if not found", async () => {
      mockMemberKarmaCollection.findOne.mockResolvedValue(null);

      const result = await repository.findMemberKarma(
        new ObjectId(),
        new ObjectId(),
      );

      expect(result).toBeNull();
    });
  });

  describe("findKarmaEvents", () => {
    it("should find karma events with pagination", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const events: KarmaEvent[] = [
        {
          _id: new ObjectId(),
          familyId,
          userId,
          amount: 25,
          source: "task_completion",
          description: "Event 1",
          createdAt: new Date("2024-01-15"),
        },
        {
          _id: new ObjectId(),
          familyId,
          userId,
          amount: 50,
          source: "manual_grant",
          description: "Event 2",
          createdAt: new Date("2024-01-14"),
        },
      ];

      const mockToArray = jest.fn().mockResolvedValue(events);
      const mockLimit = jest.fn(() => ({ toArray: mockToArray }));
      const mockSort = jest.fn(() => ({ limit: mockLimit }));
      mockKarmaEventsCollection.find.mockReturnValue({ sort: mockSort });

      const result = await repository.findKarmaEvents(familyId, userId, 10);

      expect(mockKarmaEventsCollection.find).toHaveBeenCalledWith({
        familyId,
        userId,
      });
      expect(mockSort).toHaveBeenCalledWith({ _id: -1 });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(events);
    });

    it("should find karma events with cursor pagination", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const cursorId = new ObjectId();

      const mockToArray = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ toArray: mockToArray }));
      const mockSort = jest.fn(() => ({ limit: mockLimit }));
      mockKarmaEventsCollection.find.mockReturnValue({ sort: mockSort });

      await repository.findKarmaEvents(
        familyId,
        userId,
        10,
        cursorId.toString(),
      );

      expect(mockKarmaEventsCollection.find).toHaveBeenCalledWith({
        familyId,
        userId,
        _id: { $lt: cursorId },
      });
    });

    it("should handle empty results", async () => {
      const mockToArray = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ toArray: mockToArray }));
      const mockSort = jest.fn(() => ({ limit: mockLimit }));
      mockKarmaEventsCollection.find.mockReturnValue({ sort: mockSort });

      const result = await repository.findKarmaEvents(
        new ObjectId(),
        new ObjectId(),
        10,
      );

      expect(result).toEqual([]);
    });
  });
});
