import { ObjectId } from "mongodb";
import type { RewardMetadata } from "@/modules/rewards/domain/reward";
import { MetadataRepository } from "@/modules/rewards/repositories/metadata.repository";

// Mock logger to avoid env config errors
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe("MetadataRepository", () => {
  let repository: MetadataRepository;
  let mockCollection: any;
  let mockClient: any;
  let familyId: ObjectId;
  let rewardId: ObjectId;
  let memberId: ObjectId;

  beforeEach(() => {
    familyId = new ObjectId();
    rewardId = new ObjectId();
    memberId = new ObjectId();

    mockCollection = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockClient = {
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      }),
    };

    repository = new MetadataRepository(mockClient);
  });

  describe("upsertFavourite", () => {
    it("should create new metadata with favourite flag", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: true,
        claimCount: 0,
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockMetadata);

      const result = await repository.upsertFavourite(
        familyId,
        rewardId,
        memberId,
        true,
      );

      expect(result.isFavourite).toBe(true);
      expect(result.claimCount).toBe(0);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should update existing metadata", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: false,
        claimCount: 5,
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockMetadata);

      const result = await repository.upsertFavourite(
        familyId,
        rewardId,
        memberId,
        false,
      );

      expect(result.isFavourite).toBe(false);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            isFavourite: false,
          }),
        }),
        expect.any(Object),
      );
    });

    it("should be idempotent", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: true,
        claimCount: 3,
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockMetadata);

      // Call twice with same values
      await repository.upsertFavourite(familyId, rewardId, memberId, true);
      const result = await repository.upsertFavourite(
        familyId,
        rewardId,
        memberId,
        true,
      );

      expect(result.claimCount).toBe(3); // Should not change
    });
  });

  describe("incrementClaimCount", () => {
    it("should increment claim count for existing metadata", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: false,
        claimCount: 6,
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockMetadata);

      const result = await repository.incrementClaimCount(
        familyId,
        rewardId,
        memberId,
      );

      expect(result?.claimCount).toBe(6);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $inc: { claimCount: 1 },
        }),
        expect.any(Object),
      );
    });

    it("should create metadata with count 1 if not exists", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: false,
        claimCount: 1,
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockMetadata);

      const result = await repository.incrementClaimCount(
        familyId,
        rewardId,
        memberId,
      );

      expect(result?.claimCount).toBe(1);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            isFavourite: false,
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe("findByRewardAndMember", () => {
    it("should find metadata by reward and member", async () => {
      const mockMetadata: RewardMetadata = {
        _id: `${familyId}_${rewardId}_${memberId}`,
        familyId,
        rewardId,
        memberId,
        isFavourite: true,
        claimCount: 3,
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockMetadata);

      const result = await repository.findByRewardAndMember(rewardId, memberId);

      expect(result).toEqual(mockMetadata);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        rewardId,
        memberId,
      });
    });

    it("should return null when metadata not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByRewardAndMember(rewardId, memberId);

      expect(result).toBeNull();
    });
  });

  describe("findFavouritesByMember", () => {
    it("should return all favourites for a member", async () => {
      const mockMetadata: RewardMetadata[] = [
        {
          _id: `${familyId}_${rewardId}_${memberId}`,
          familyId,
          rewardId,
          memberId,
          isFavourite: true,
          claimCount: 2,
          updatedAt: new Date(),
        },
        {
          _id: `${familyId}_${new ObjectId()}_${memberId}`,
          familyId,
          rewardId: new ObjectId(),
          memberId,
          isFavourite: true,
          claimCount: 1,
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockMetadata);

      const result = await repository.findFavouritesByMember(
        familyId,
        memberId,
      );

      expect(result).toEqual(mockMetadata);
      expect(mockCollection.find).toHaveBeenCalledWith({
        familyId,
        memberId,
        isFavourite: true,
      });
    });

    it("should return empty array when no favourites exist", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await repository.findFavouritesByMember(
        familyId,
        memberId,
      );

      expect(result).toEqual([]);
    });
  });

  describe("getTotalClaimCount", () => {
    it("should return total claim count for reward", async () => {
      mockCollection.toArray.mockResolvedValue([{ _id: null, total: 25 }]);

      const result = await repository.getTotalClaimCount(rewardId);

      expect(result).toBe(25);
      expect(mockCollection.aggregate).toHaveBeenCalled();
    });

    it("should return 0 when reward has no claims", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await repository.getTotalClaimCount(rewardId);

      expect(result).toBe(0);
    });
  });

  describe("getTotalFavouriteCount", () => {
    it("should return count of members who marked as favourite", async () => {
      mockCollection.countDocuments.mockResolvedValue(8);

      const result = await repository.getTotalFavouriteCount(rewardId);

      expect(result).toBe(8);
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        rewardId,
        isFavourite: true,
      });
    });

    it("should return 0 when no one marked as favourite", async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await repository.getTotalFavouriteCount(rewardId);

      expect(result).toBe(0);
    });
  });

  describe("findByReward", () => {
    it("should return all metadata for a reward", async () => {
      const mockMetadata: RewardMetadata[] = [
        {
          _id: `${familyId}_${rewardId}_${memberId}`,
          familyId,
          rewardId,
          memberId,
          isFavourite: true,
          claimCount: 2,
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockMetadata);

      const result = await repository.findByReward(rewardId);

      expect(result).toEqual(mockMetadata);
      expect(mockCollection.find).toHaveBeenCalledWith({ rewardId });
    });

    it("should return empty array when reward has no metadata", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await repository.findByReward(rewardId);

      expect(result).toEqual([]);
    });
  });
});
