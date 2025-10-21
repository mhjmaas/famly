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

describe('FamilyService - listFamiliesForUser', () => {
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

  describe('multiple memberships handling', () => {
    it('should return all families for user with correct ordering', async () => {
      const userId = new ObjectId();
      const family1Id = new ObjectId();
      const family2Id = new ObjectId();
      const family3Id = new ObjectId();

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Mock memberships - ordered by createdAt DESC (newest first)
      mockMembershipRepository.findByUser.mockResolvedValue([
        {
          _id: new ObjectId(),
          familyId: family3Id,
          userId,
          role: FamilyRole.Parent,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId(),
          familyId: family2Id,
          userId,
          role: FamilyRole.Child,
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          _id: new ObjectId(),
          familyId: family1Id,
          userId,
          role: FamilyRole.Parent,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        },
      ]);

      // Mock families
      mockFamilyRepository.findByIds.mockResolvedValue([
        {
          _id: family1Id,
          name: 'Family One',
          creatorId: userId,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          _id: family2Id,
          name: 'Family Two',
          creatorId: new ObjectId(), // Different creator
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          _id: family3Id,
          name: 'Family Three',
          creatorId: userId,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await familyService.listFamiliesForUser(userId);

      expect(result.families).toHaveLength(3);

      // Verify ordering (newest membership first)
      expect(result.families[0].name).toBe('Family Three');
      expect(result.families[0].role).toBe(FamilyRole.Parent);
      expect(result.families[0].familyId).toBe(family3Id.toString());

      expect(result.families[1].name).toBe('Family Two');
      expect(result.families[1].role).toBe(FamilyRole.Child);

      expect(result.families[2].name).toBe('Family One');
      expect(result.families[2].role).toBe(FamilyRole.Parent);
    });

    it('should return empty array when user has no memberships', async () => {
      const userId = new ObjectId();

      mockMembershipRepository.findByUser.mockResolvedValue([]);

      const result = await familyService.listFamiliesForUser(userId);

      expect(result.families).toEqual([]);
      expect(mockFamilyRepository.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('null name handling', () => {
    it('should handle families with null names correctly', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const now = new Date();

      mockMembershipRepository.findByUser.mockResolvedValue([
        {
          _id: new ObjectId(),
          familyId,
          userId,
          role: FamilyRole.Parent,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      mockFamilyRepository.findByIds.mockResolvedValue([
        {
          _id: familyId,
          name: null, // No name
          creatorId: userId,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await familyService.listFamiliesForUser(userId);

      expect(result.families).toHaveLength(1);
      expect(result.families[0].name).toBeNull();
      expect(result.families[0].role).toBe(FamilyRole.Parent);
    });

    it('should mix null and non-null family names correctly', async () => {
      const userId = new ObjectId();
      const family1Id = new ObjectId();
      const family2Id = new ObjectId();
      const now = new Date();

      mockMembershipRepository.findByUser.mockResolvedValue([
        {
          _id: new ObjectId(),
          familyId: family1Id,
          userId,
          role: FamilyRole.Parent,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId(),
          familyId: family2Id,
          userId,
          role: FamilyRole.Child,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      mockFamilyRepository.findByIds.mockResolvedValue([
        {
          _id: family1Id,
          name: 'Named Family',
          creatorId: userId,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: family2Id,
          name: null,
          creatorId: new ObjectId(),
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await familyService.listFamiliesForUser(userId);

      expect(result.families).toHaveLength(2);
      expect(result.families[0].name).toBe('Named Family');
      expect(result.families[1].name).toBeNull();
    });
  });

  describe('data consistency', () => {
    it('should skip memberships with missing family documents', async () => {
      const userId = new ObjectId();
      const existingFamilyId = new ObjectId();
      const missingFamilyId = new ObjectId();
      const now = new Date();

      mockMembershipRepository.findByUser.mockResolvedValue([
        {
          _id: new ObjectId(),
          familyId: existingFamilyId,
          userId,
          role: FamilyRole.Parent,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId(),
          familyId: missingFamilyId, // This family doesn't exist
          userId,
          role: FamilyRole.Child,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // Only return one family (missing family not found)
      mockFamilyRepository.findByIds.mockResolvedValue([
        {
          _id: existingFamilyId,
          name: 'Existing Family',
          creatorId: userId,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await familyService.listFamiliesForUser(userId);

      // Should only return the family that exists
      expect(result.families).toHaveLength(1);
      expect(result.families[0].familyId).toBe(existingFamilyId.toString());
    });
  });
});
