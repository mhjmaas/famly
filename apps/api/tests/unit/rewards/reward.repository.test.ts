import { ObjectId } from "mongodb";
import type { Reward } from "@/modules/rewards/domain/reward";
import { RewardRepository } from "@/modules/rewards/repositories/reward.repository";

// Mock logger to avoid env config errors
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe("RewardRepository", () => {
  let repository: RewardRepository;
  let mockCollection: any;
  let mockClient: any;
  let familyId: ObjectId;
  let userId: ObjectId;

  beforeEach(() => {
    familyId = new ObjectId();
    userId = new ObjectId();

    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockClient = {
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      }),
    };

    repository = new RewardRepository(mockClient);
  });

  describe("create", () => {
    it("should create a reward with all fields", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const input = {
        name: "Extra screen time",
        description: "30 minutes extra",
        karmaCost: 50,
        imageUrl: "https://example.com/reward.png",
      };

      const result = await repository.create(familyId, input, userId);

      expect(result.name).toBe(input.name);
      expect(result.description).toBe(input.description);
      expect(result.karmaCost).toBe(input.karmaCost);
      expect(result.imageUrl).toBe(input.imageUrl);
      expect(result.familyId).toBe(familyId);
      expect(result.createdBy).toBe(userId);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it("should create reward without optional fields", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const input = {
        name: "Simple reward",
        karmaCost: 25,
      };

      const result = await repository.create(familyId, input, userId);

      expect(result.name).toBe("Simple reward");
      expect(result.description).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.karmaCost).toBe(25);
    });
  });

  describe("findById", () => {
    it("should find reward by ID", async () => {
      const rewardId = new ObjectId();
      const mockReward: Reward = {
        _id: rewardId,
        familyId,
        name: "Test reward",
        karmaCost: 50,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockReward);

      const result = await repository.findById(rewardId);

      expect(result).toEqual(mockReward);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: rewardId });
    });

    it("should return null when reward not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById(new ObjectId());

      expect(result).toBeNull();
    });
  });

  describe("findByFamily", () => {
    it("should return all rewards for a family", async () => {
      const mockRewards: Reward[] = [
        {
          _id: new ObjectId(),
          familyId,
          name: "Reward 1",
          karmaCost: 50,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId,
          name: "Reward 2",
          karmaCost: 100,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockRewards);

      const result = await repository.findByFamily(familyId);

      expect(result).toEqual(mockRewards);
      expect(mockCollection.find).toHaveBeenCalledWith({ familyId });
      expect(mockCollection.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("should return empty array when no rewards exist", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await repository.findByFamily(familyId);

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update reward with all fields", async () => {
      const rewardId = new ObjectId();
      const updatedReward: Reward = {
        _id: rewardId,
        familyId,
        name: "Updated reward",
        description: "Updated description",
        karmaCost: 75,
        imageUrl: "https://example.com/new.png",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedReward);

      const input = {
        name: "Updated reward",
        description: "Updated description",
        karmaCost: 75,
        imageUrl: "https://example.com/new.png",
      };

      const result = await repository.update(rewardId, input);

      expect(result).toEqual(updatedReward);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should update only provided fields", async () => {
      const rewardId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({ _id: rewardId });

      await repository.update(rewardId, { name: "New name" });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("name", "New name");
      expect(updateCall[1].$set).toHaveProperty("updatedAt");
    });

    it("should return null when reward not found", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await repository.update(new ObjectId(), { name: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete reward", async () => {
      const rewardId = new ObjectId();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete(rewardId);

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: rewardId });
    });

    it("should return false when reward not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await repository.delete(new ObjectId());

      expect(result).toBe(false);
    });
  });

  describe("hasPendingClaims", () => {
    it("should return true when reward has pending claims", async () => {
      mockCollection.countDocuments.mockResolvedValue(1);

      const rewardId = new ObjectId();
      const result = await repository.hasPendingClaims(rewardId);

      expect(result).toBe(true);
    });

    it("should return false when reward has no pending claims", async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await repository.hasPendingClaims(new ObjectId());

      expect(result).toBe(false);
    });
  });
});
