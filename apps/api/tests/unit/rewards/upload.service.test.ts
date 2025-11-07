import type { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../src/infra/minio/client";
import {
  uploadRewardImage,
  validateFileType,
} from "../../../src/modules/rewards/services/upload.service";

// Mock the S3 client
jest.mock("../../../src/infra/minio/client", () => ({
  s3Client: {
    send: jest.fn(),
  },
  ensureBucketExists: jest.fn(),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

// Mock environment
jest.mock("../../../src/config/env", () => ({
  getEnv: jest.fn(() => ({
    MINIO_BUCKET: "test-bucket",
  })),
}));

const mockedS3Send = s3Client.send as jest.MockedFunction<
  (command: any) => Promise<any>
>;

describe("Upload Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateFileType", () => {
    it("should accept JPEG mimetype", () => {
      expect(validateFileType("image/jpeg")).toBe(true);
    });

    it("should accept PNG mimetype", () => {
      expect(validateFileType("image/png")).toBe(true);
    });

    it("should accept GIF mimetype", () => {
      expect(validateFileType("image/gif")).toBe(true);
    });

    it("should accept WebP mimetype", () => {
      expect(validateFileType("image/webp")).toBe(true);
    });

    it("should reject PDF mimetype", () => {
      expect(validateFileType("application/pdf")).toBe(false);
    });

    it("should reject text mimetype", () => {
      expect(validateFileType("text/plain")).toBe(false);
    });

    it("should reject video mimetype", () => {
      expect(validateFileType("video/mp4")).toBe(false);
    });
  });

  describe("uploadRewardImage", () => {
    const familyId = "family-123";
    const mockFile = {
      buffer: Buffer.from("test-image-data"),
      mimetype: "image/jpeg",
      originalname: "test-image.jpg",
      size: 1024,
    } as Express.Multer.File;

    it("should upload image successfully with JPEG extension", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const result = await uploadRewardImage(mockFile, familyId);

      // Verify S3 send was called
      expect(mockedS3Send).toHaveBeenCalledTimes(1);

      // Verify PutObjectCommand was created with correct parameters
      const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Bucket).toBe("test-bucket");
      expect(command.input.Key).toBe(`${familyId}/mock-uuid-1234.jpg`);
      expect(command.input.Body).toBe(mockFile.buffer);
      expect(command.input.ContentType).toBe("image/jpeg");

      // Verify returned URL
      expect(result).toBe(`/api/images/${familyId}/mock-uuid-1234.jpg`);
    });

    it("should preserve PNG extension", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const pngFile = {
        ...mockFile,
        mimetype: "image/png",
        originalname: "test.png",
      } as Express.Multer.File;

      const result = await uploadRewardImage(pngFile, familyId);

      const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Key).toBe(`${familyId}/mock-uuid-1234.png`);
      expect(result).toBe(`/api/images/${familyId}/mock-uuid-1234.png`);
    });

    it("should preserve GIF extension", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const gifFile = {
        ...mockFile,
        mimetype: "image/gif",
        originalname: "test.gif",
      } as Express.Multer.File;

      const result = await uploadRewardImage(gifFile, familyId);

      const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Key).toBe(`${familyId}/mock-uuid-1234.gif`);
      expect(result).toBe(`/api/images/${familyId}/mock-uuid-1234.gif`);
    });

    it("should preserve WebP extension", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const webpFile = {
        ...mockFile,
        mimetype: "image/webp",
        originalname: "test.webp",
      } as Express.Multer.File;

      const result = await uploadRewardImage(webpFile, familyId);

      const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Key).toBe(`${familyId}/mock-uuid-1234.webp`);
      expect(result).toBe(`/api/images/${familyId}/mock-uuid-1234.webp`);
    });

    it("should use family-scoped path", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const differentFamilyId = "family-456";
      await uploadRewardImage(mockFile, differentFamilyId);

      const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Key).toBe(`${differentFamilyId}/mock-uuid-1234.jpg`);
    });

    it("should generate UUID for filename", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const result = await uploadRewardImage(mockFile, familyId);

      // UUID should be in the filename
      expect(result).toContain("mock-uuid-1234");
    });

    it("should throw error when S3 upload fails", async () => {
      const s3Error = new Error("S3 upload failed");
      mockedS3Send.mockRejectedValueOnce(s3Error);

      await expect(uploadRewardImage(mockFile, familyId)).rejects.toThrow(
        "S3 upload failed",
      );
    });

    it("should set correct Content-Type for different formats", async () => {
      mockedS3Send.mockResolvedValueOnce({} as any);

      const testCases = [
        { mimetype: "image/jpeg", expected: "image/jpeg" },
        { mimetype: "image/png", expected: "image/png" },
        { mimetype: "image/gif", expected: "image/gif" },
        { mimetype: "image/webp", expected: "image/webp" },
      ];

      for (const testCase of testCases) {
        mockedS3Send.mockClear();
        mockedS3Send.mockResolvedValueOnce({} as any);

        const file = {
          ...mockFile,
          mimetype: testCase.mimetype,
        } as Express.Multer.File;

        await uploadRewardImage(file, familyId);

        const command = mockedS3Send.mock.calls[0][0] as PutObjectCommand;
        expect(command.input.ContentType).toBe(testCase.expected);
      }
    });
  });
});
