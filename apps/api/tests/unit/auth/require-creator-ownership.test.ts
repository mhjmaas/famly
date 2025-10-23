import { HttpError } from "@lib/http-error";
import { requireCreatorOwnership } from "@modules/auth/lib/require-creator-ownership";
import { ObjectId } from "mongodb";

describe("requireCreatorOwnership", () => {
  describe("direct ownership check", () => {
    it("should return true when user is the creator", async () => {
      const userId = new ObjectId();
      const createdBy = userId;

      const result = await requireCreatorOwnership({
        userId,
        createdBy,
      });

      expect(result).toBe(true);
    });

    it("should throw HttpError.forbidden when user is not the creator", async () => {
      const userId = new ObjectId();
      const createdBy = new ObjectId();

      await expect(
        requireCreatorOwnership({
          userId,
          createdBy,
        }),
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        requireCreatorOwnership({
          userId,
          createdBy,
        }),
      ).rejects.toThrow("You do not have permission to access this resource");
    });
  });

  describe("repository lookup", () => {
    it("should return true when resource exists and user is creator", async () => {
      const userId = new ObjectId();
      const resourceId = new ObjectId();

      const mockLookupFn = jest.fn().mockResolvedValue({
        createdBy: userId,
      });

      const result = await requireCreatorOwnership({
        userId,
        resourceId,
        lookupFn: mockLookupFn,
      });

      expect(result).toBe(true);
      expect(mockLookupFn).toHaveBeenCalledWith(resourceId);
    });

    it("should throw HttpError.forbidden when resource exists but user is not creator", async () => {
      const userId = new ObjectId();
      const otherUserId = new ObjectId();
      const resourceId = new ObjectId();

      const mockLookupFn = jest.fn().mockResolvedValue({
        createdBy: otherUserId,
      });

      await expect(
        requireCreatorOwnership({
          userId,
          resourceId,
          lookupFn: mockLookupFn,
        }),
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        requireCreatorOwnership({
          userId,
          resourceId,
          lookupFn: mockLookupFn,
        }),
      ).rejects.toThrow("You do not have permission to access this resource");
    });

    it("should throw HttpError.notFound when resource does not exist", async () => {
      const userId = new ObjectId();
      const resourceId = new ObjectId();

      const mockLookupFn = jest.fn().mockResolvedValue(null);

      await expect(
        requireCreatorOwnership({
          userId,
          resourceId,
          lookupFn: mockLookupFn,
        }),
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        requireCreatorOwnership({
          userId,
          resourceId,
          lookupFn: mockLookupFn,
        }),
      ).rejects.toThrow("Resource not found");
    });
  });

  describe("edge cases", () => {
    it("should throw error when neither createdBy nor resourceId+lookupFn provided", async () => {
      const userId = new ObjectId();

      await expect(
        requireCreatorOwnership({
          userId,
        }),
      ).rejects.toThrow(
        "Either createdBy or both resourceId and lookupFn must be provided",
      );
    });

    it("should throw error when resourceId provided but lookupFn missing", async () => {
      const userId = new ObjectId();
      const resourceId = new ObjectId();

      await expect(
        requireCreatorOwnership({
          userId,
          resourceId,
        }),
      ).rejects.toThrow(
        "Either createdBy or both resourceId and lookupFn must be provided",
      );
    });

    it("should throw error when lookupFn provided but resourceId missing", async () => {
      const userId = new ObjectId();
      const mockLookupFn = jest.fn();

      await expect(
        requireCreatorOwnership({
          userId,
          lookupFn: mockLookupFn,
        }),
      ).rejects.toThrow(
        "Either createdBy or both resourceId and lookupFn must be provided",
      );
    });
  });
});
