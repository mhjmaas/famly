import { ObjectId } from "mongodb";
import type { RewardClaim } from "@/modules/rewards/domain/reward";
import { ClaimRepository } from "@/modules/rewards/repositories/claim.repository";

// Mock logger to avoid env config errors
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ClaimRepository", () => {
  let repository: ClaimRepository;
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

    repository = new ClaimRepository(mockClient);
  });

  describe("create", () => {
    it("should create a new claim with pending status", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const result = await repository.create(rewardId, familyId, memberId);

      expect(result.rewardId).toBe(rewardId);
      expect(result.familyId).toBe(familyId);
      expect(result.memberId).toBe(memberId);
      expect(result.status).toBe("pending");
      expect(result.autoTaskId).toBeUndefined();
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should find claim by ID", async () => {
      const claimId = new ObjectId();
      const mockClaim: RewardClaim = {
        _id: claimId,
        rewardId,
        familyId,
        memberId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockClaim);

      const result = await repository.findById(claimId);

      expect(result).toEqual(mockClaim);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: claimId });
    });

    it("should return null when claim not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findById(new ObjectId());

      expect(result).toBeNull();
    });
  });

  describe("findByMember", () => {
    it("should return all claims for a member", async () => {
      const mockClaims: RewardClaim[] = [
        {
          _id: new ObjectId(),
          rewardId,
          familyId,
          memberId,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          rewardId: new ObjectId(),
          familyId,
          memberId,
          status: "completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockClaims);

      const result = await repository.findByMember(familyId, memberId);

      expect(result).toEqual(mockClaims);
      expect(mockCollection.find).toHaveBeenCalledWith({
        familyId,
        memberId,
      });
    });
  });

  describe("findByFamily", () => {
    it("should return all claims for a family", async () => {
      const mockClaims: RewardClaim[] = [
        {
          _id: new ObjectId(),
          rewardId,
          familyId,
          memberId: new ObjectId(),
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockClaims);

      const result = await repository.findByFamily(familyId);

      expect(result).toEqual(mockClaims);
      expect(mockCollection.find).toHaveBeenCalledWith({ familyId });
    });
  });

  describe("updateStatus", () => {
    it("should update claim status to completed", async () => {
      const claimId = new ObjectId();
      const completedBy = new ObjectId();
      const completedAt = new Date();
      const updatedClaim: RewardClaim = {
        _id: claimId,
        rewardId,
        familyId,
        memberId,
        status: "completed",
        completedBy,
        completedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedClaim);

      const result = await repository.updateStatus(claimId, "completed", {
        completedBy,
        completedAt,
      });

      expect(result?.status).toBe("completed");
      expect(result?.completedBy).toBe(completedBy);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should update claim status to cancelled", async () => {
      const claimId = new ObjectId();
      const cancelledBy = new ObjectId();
      const cancelledAt = new Date();

      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: claimId,
        status: "cancelled",
        cancelledBy,
        cancelledAt,
      });

      await repository.updateStatus(claimId, "cancelled", {
        cancelledBy,
        cancelledAt,
      });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("status", "cancelled");
    });
  });

  describe("findPendingByRewardAndMember", () => {
    it("should find pending claim for member and reward", async () => {
      const claimId = new ObjectId();
      const mockClaim: RewardClaim = {
        _id: claimId,
        rewardId,
        familyId,
        memberId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockClaim);

      const result = await repository.findPendingByRewardAndMember(
        rewardId,
        memberId,
      );

      expect(result).toEqual(mockClaim);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        rewardId,
        memberId,
        status: "pending",
      });
    });

    it("should return null when no pending claim exists", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findPendingByRewardAndMember(
        rewardId,
        memberId,
      );

      expect(result).toBeNull();
    });
  });

  describe("updateAutoTaskId", () => {
    it("should update claim with auto-task ID", async () => {
      const claimId = new ObjectId();
      const autoTaskId = new ObjectId();
      const updatedClaim: RewardClaim = {
        _id: claimId,
        rewardId,
        familyId,
        memberId,
        status: "pending",
        autoTaskId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedClaim);

      const result = await repository.updateAutoTaskId(claimId, autoTaskId);

      expect(result?.autoTaskId).toBe(autoTaskId);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: claimId },
        expect.objectContaining({
          $set: expect.objectContaining({
            autoTaskId,
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe("findByAutoTaskId", () => {
    it("should find claim by auto-task ID", async () => {
      const autoTaskId = new ObjectId();
      const claimId = new ObjectId();
      const mockClaim: RewardClaim = {
        _id: claimId,
        rewardId,
        familyId,
        memberId,
        status: "pending",
        autoTaskId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockClaim);

      const result = await repository.findByAutoTaskId(autoTaskId);

      expect(result).toEqual(mockClaim);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ autoTaskId });
    });

    it("should return null when claim not found by task ID", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.findByAutoTaskId(new ObjectId());

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete claim", async () => {
      const claimId = new ObjectId();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete(claimId);

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: claimId });
    });

    it("should return false when claim not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await repository.delete(new ObjectId());

      expect(result).toBe(false);
    });
  });
});
