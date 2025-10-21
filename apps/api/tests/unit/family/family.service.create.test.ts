import { ObjectId } from 'mongodb';
import { FamilyRole } from '@modules/family/domain/family';

// Mock the logger to prevent environment validation
jest.mock('@lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock mongo client to prevent environment validation
jest.mock('@infra/mongo/client', () => ({
  getDb: jest.fn(),
  connectMongo: jest.fn(),
  disconnectMongo: jest.fn(),
}));

// Mock repositories
jest.mock('@modules/family/repositories/family.repository');
jest.mock('@modules/family/repositories/family-membership.repository');

// Import after mocks
import { FamilyService } from '@modules/family/services/family.service';
import { FamilyRepository } from '@modules/family/repositories/family.repository';
import { FamilyMembershipRepository } from '@modules/family/repositories/family-membership.repository';

describe('FamilyService - createFamily', () => {
  let familyService: FamilyService;
  let mockFamilyRepository: jest.Mocked<FamilyRepository>;
  let mockMembershipRepository: jest.Mocked<FamilyMembershipRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocked instances
    mockFamilyRepository = new FamilyRepository() as jest.Mocked<FamilyRepository>;
    mockMembershipRepository = new FamilyMembershipRepository() as jest.Mocked<FamilyMembershipRepository>;

    // Initialize service with mocked dependencies
    familyService = new FamilyService(mockFamilyRepository, mockMembershipRepository);
  });

  describe('name normalization', () => {
    it('should create family with trimmed name', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const now = new Date();

      // Mock repository responses
      mockFamilyRepository.createFamily.mockResolvedValue({
        _id: familyId,
        name: 'Test Family',
        creatorId: userId,
        createdAt: now,
        updatedAt: now,
      });

      mockMembershipRepository.insertMembership.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Parent,
        createdAt: now,
        updatedAt: now,
      });

      const result = await familyService.createFamily(userId, { name: '  Test Family  ' });

      expect(mockFamilyRepository.createFamily).toHaveBeenCalledWith(
        userId,
        'Test Family' // Expect trimmed name
      );
      expect(result.family.name).toBe('Test Family');
      expect(result.family.role).toBe(FamilyRole.Parent);
    });

    it('should create family with null name when empty string provided', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const now = new Date();

      mockFamilyRepository.createFamily.mockResolvedValue({
        _id: familyId,
        name: null,
        creatorId: userId,
        createdAt: now,
        updatedAt: now,
      });

      mockMembershipRepository.insertMembership.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Parent,
        createdAt: now,
        updatedAt: now,
      });

      const result = await familyService.createFamily(userId, { name: '   ' });

      expect(mockFamilyRepository.createFamily).toHaveBeenCalledWith(userId, null);
      expect(result.family.name).toBeNull();
    });

    it('should create family with null name when undefined provided', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const now = new Date();

      mockFamilyRepository.createFamily.mockResolvedValue({
        _id: familyId,
        name: null,
        creatorId: userId,
        createdAt: now,
        updatedAt: now,
      });

      mockMembershipRepository.insertMembership.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Parent,
        createdAt: now,
        updatedAt: now,
      });

      const result = await familyService.createFamily(userId, {});

      expect(mockFamilyRepository.createFamily).toHaveBeenCalledWith(userId, null);
      expect(result.family.name).toBeNull();
    });

    it('should reject family name longer than 120 characters', async () => {
      const userId = new ObjectId();
      const longName = 'a'.repeat(121);

      await expect(
        familyService.createFamily(userId, { name: longName })
      ).rejects.toThrow('Family name cannot exceed 120 characters');
    });
  });

  describe('Parent membership creation', () => {
    it('should create Parent membership for creator exactly once', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const now = new Date();

      mockFamilyRepository.createFamily.mockResolvedValue({
        _id: familyId,
        name: 'New Family',
        creatorId: userId,
        createdAt: now,
        updatedAt: now,
      });

      mockMembershipRepository.insertMembership.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Parent,
        createdAt: now,
        updatedAt: now,
      });

      const result = await familyService.createFamily(userId, { name: 'New Family' });

      // Verify membership was inserted with Parent role
      expect(mockMembershipRepository.insertMembership).toHaveBeenCalledTimes(1);
      expect(mockMembershipRepository.insertMembership).toHaveBeenCalledWith(
        familyId,
        userId,
        FamilyRole.Parent
      );

      expect(result.family.role).toBe(FamilyRole.Parent);
      expect(result.family.familyId).toBe(familyId.toString());
    });
  });

  describe('timestamp handling', () => {
    it('should set createdAt and updatedAt timestamps on family and membership', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const familyCreatedAt = new Date('2025-01-15T10:00:00Z');
      const membershipCreatedAt = new Date('2025-01-15T10:00:01Z');

      mockFamilyRepository.createFamily.mockResolvedValue({
        _id: familyId,
        name: 'Timestamp Family',
        creatorId: userId,
        createdAt: familyCreatedAt,
        updatedAt: familyCreatedAt,
      });

      mockMembershipRepository.insertMembership.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Parent,
        createdAt: membershipCreatedAt,
        updatedAt: membershipCreatedAt,
      });

      const result = await familyService.createFamily(userId, { name: 'Timestamp Family' });

      // linkedAt should be ISO string of membership.createdAt
      expect(result.family.linkedAt).toBe(membershipCreatedAt.toISOString());
    });
  });
});
