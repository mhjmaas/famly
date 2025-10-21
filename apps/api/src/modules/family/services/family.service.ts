import { ObjectId } from 'mongodb';
import { FamilyRepository } from '../repositories/family.repository';
import { FamilyMembershipRepository } from '../repositories/family-membership.repository';
import {
  CreateFamilyInput,
  CreateFamilyResponse,
  FamilyRole,
  ListFamiliesResponse,
} from '../domain/family';
import { toFamilyMembershipView, normalizeFamilyName } from '../lib/family.mapper';
import { logger } from '@lib/logger';

export class FamilyService {
  constructor(
    private familyRepository: FamilyRepository,
    private membershipRepository: FamilyMembershipRepository
  ) {}

  /**
   * Create a new family and link the creator as a Parent
   *
   * @param userId - The ID of the user creating the family
   * @param input - Create family input payload
   * @returns Create family response with membership view
   */
  async createFamily(
    userId: ObjectId,
    input: CreateFamilyInput
  ): Promise<CreateFamilyResponse> {
    try {
      // Normalize family name (trim, handle empty string, validate length)
      const normalizedName = normalizeFamilyName(input.name);

      logger.info('Creating family', {
        userId: userId.toString(),
        name: normalizedName,
      });

      // Create family document
      const family = await this.familyRepository.createFamily(userId, normalizedName);

      // Create Parent membership for creator
      const membership = await this.membershipRepository.insertMembership(
        family._id,
        userId,
        FamilyRole.Parent
      );

      // Convert to view DTO
      const familyView = toFamilyMembershipView(family, membership);

      logger.info('Family created successfully', {
        familyId: family._id.toString(),
        userId: userId.toString(),
      });

      return familyView;
    } catch (error) {
      logger.error('Failed to create family', {
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List all families for a user
   *
   * @param userId - The ID of the user
   * @returns List families response with membership views
   */
  async listFamiliesForUser(userId: ObjectId): Promise<ListFamiliesResponse> {
    try {
      logger.debug('Listing families for user', { userId: userId.toString() });

      // Find all memberships for the user
      const memberships = await this.membershipRepository.findByUser(userId);

      if (memberships.length === 0) {
        return [];
      }

      // Extract unique family IDs
      const familyIds = memberships.map((m) => m.familyId);

      // Fetch family documents
      const families = await this.familyRepository.findByIds(familyIds);

      // Create a map for quick lookup
      const familyMap = new Map(families.map((f) => [f._id.toString(), f]));

      // Map to family membership views
      const familyViews = memberships
        .map((membership) => {
          const family = familyMap.get(membership.familyId.toString());
          if (!family) {
            logger.warn('Family not found for membership', {
              membershipId: membership._id.toString(),
              familyId: membership.familyId.toString(),
            });
            return null;
          }
          return toFamilyMembershipView(family, membership);
        })
        .filter((view): view is NonNullable<typeof view> => view !== null);

      return familyViews;
    } catch (error) {
      logger.error('Failed to list families for user', {
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }
}
