import { ObjectId } from 'mongodb';
import { requireFamilyRole } from '@modules/auth/lib/require-family-role';
import { FamilyRole, type FamilyMembershipView } from '@modules/family/domain/family';
import { HttpError } from '@lib/http-error';
import type { FamilyMembershipRepository } from '@modules/family/repositories/family-membership.repository';

describe('requireFamilyRole', () => {
  describe('when user has families in req.user', () => {
    it('should return true when user has required Parent role in specified family', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const families: FamilyMembershipView[] = [
        {
          familyId: familyId.toString(),
          name: 'Test Family',
          role: FamilyRole.Parent,
          linkedAt: new Date().toISOString(),
        },
      ];

      const result = await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent],
        userFamilies: families,
      });

      expect(result).toBe(true);
    });

    it('should return true when user has required Child role in specified family', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const families: FamilyMembershipView[] = [
        {
          familyId: familyId.toString(),
          name: 'Test Family',
          role: FamilyRole.Child,
          linkedAt: new Date().toISOString(),
        },
      ];

      const result = await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Child],
        userFamilies: families,
      });

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple allowed roles', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const families: FamilyMembershipView[] = [
        {
          familyId: familyId.toString(),
          name: 'Test Family',
          role: FamilyRole.Child,
          linkedAt: new Date().toISOString(),
        },
      ];

      const result = await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        userFamilies: families,
      });

      expect(result).toBe(true);
    });

    it('should throw HttpError.forbidden when user has wrong role in family', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const families: FamilyMembershipView[] = [
        {
          familyId: familyId.toString(),
          name: 'Test Family',
          role: FamilyRole.Child,
          linkedAt: new Date().toISOString(),
        },
      ];

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          userFamilies: families,
        })
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          userFamilies: families,
        })
      ).rejects.toThrow('You must be a Parent in this family to perform this action');
    });

    it('should throw HttpError.forbidden when user is not a member of the family', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const otherFamilyId = new ObjectId();
      const families: FamilyMembershipView[] = [
        {
          familyId: otherFamilyId.toString(),
          name: 'Other Family',
          role: FamilyRole.Parent,
          linkedAt: new Date().toISOString(),
        },
      ];

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          userFamilies: families,
        })
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          userFamilies: families,
        })
      ).rejects.toThrow('You are not a member of this family');
    });

    it('should throw HttpError.forbidden with proper role listing for multiple allowed roles', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      // User has no membership in any family - empty array
      const families: FamilyMembershipView[] = [];

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
          userFamilies: families,
        })
      ).rejects.toThrow('You are not a member of this family');
    });
  });

  describe('when user families not provided (fallback to repository)', () => {
    it('should query repository and return true when user has required role', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const mockMembershipRepo = {
        findByFamilyAndUser: jest.fn().mockResolvedValue({
          _id: new ObjectId(),
          userId,
          familyId,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as FamilyMembershipRepository;

      const result = await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent],
        membershipRepository: mockMembershipRepo,
      });

      expect(result).toBe(true);
      expect(mockMembershipRepo.findByFamilyAndUser).toHaveBeenCalledWith(familyId, userId);
    });

    it('should throw HttpError.forbidden when repository returns null (no membership)', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const mockMembershipRepo = {
        findByFamilyAndUser: jest.fn().mockResolvedValue(null),
      } as unknown as FamilyMembershipRepository;

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          membershipRepository: mockMembershipRepo,
        })
      ).rejects.toThrow(HttpError);

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          membershipRepository: mockMembershipRepo,
        })
      ).rejects.toThrow('You are not a member of this family');
    });

    it('should throw HttpError.forbidden when repository returns wrong role', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();
      const mockMembershipRepo = {
        findByFamilyAndUser: jest.fn().mockResolvedValue({
          _id: new ObjectId(),
          userId,
          familyId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as FamilyMembershipRepository;

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          membershipRepository: mockMembershipRepo,
        })
      ).rejects.toThrow(HttpError);

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
          membershipRepository: mockMembershipRepo,
        })
      ).rejects.toThrow('You must be a Parent in this family to perform this action');
    });
  });

  describe('edge cases', () => {
    it('should throw error when neither userFamilies nor membershipRepository provided', async () => {
      const userId = new ObjectId();
      const familyId = new ObjectId();

      await expect(
        requireFamilyRole({
          userId,
          familyId,
          allowedRoles: [FamilyRole.Parent],
        })
      ).rejects.toThrow('Either userFamilies or membershipRepository must be provided');
    });
  });
});
