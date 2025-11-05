import { getDb } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { getAuth } from "@modules/auth/better-auth";
import { ObjectId } from "mongodb";
import {
  type AddFamilyMemberRequest,
  type AddFamilyMemberResult,
  type CreateFamilyInput,
  type CreateFamilyResponse,
  FamilyRole,
  type ListFamiliesResponse,
  type UpdateMemberRoleResponse,
} from "../domain/family";
import {
  normalizeFamilyName,
  toAddFamilyMemberResult,
  toFamilyMembershipView,
} from "../lib/family.mapper";
import type { FamilyRepository } from "../repositories/family.repository";
import type { FamilyMembershipRepository } from "../repositories/family-membership.repository";

export class FamilyService {
  constructor(
    private familyRepository: FamilyRepository,
    private membershipRepository: FamilyMembershipRepository,
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
    input: CreateFamilyInput,
  ): Promise<CreateFamilyResponse> {
    try {
      // Normalize family name (trim, handle empty string, validate length)
      const normalizedName = normalizeFamilyName(input.name);

      logger.info("Creating family", {
        userId: userId.toString(),
        name: normalizedName,
      });

      // Create family document
      const family = await this.familyRepository.createFamily(
        userId,
        normalizedName,
      );

      // Create Parent membership for creator
      const membership = await this.membershipRepository.insertMembership(
        family._id,
        userId,
        FamilyRole.Parent,
      );

      // Convert to view DTO
      const familyView = toFamilyMembershipView(family, membership);

      logger.info("Family created successfully", {
        familyId: family._id.toString(),
        userId: userId.toString(),
      });

      return familyView;
    } catch (error) {
      logger.error("Failed to create family", {
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
      logger.debug("Listing families for user", { userId: userId.toString() });

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
            logger.warn("Family not found for membership", {
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
      logger.error("Failed to list families for user", {
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Add a new member to a family
   * Parent can add both Parent and Child roles
   * Creates user via better-auth without auto-login
   *
   * @param familyId - The ID of the family
   * @param addedBy - The ID of the parent adding the member
   * @param input - Add family member input payload
   * @returns Add family member result
   */
  async addFamilyMember(
    familyId: ObjectId,
    addedBy: ObjectId,
    input: AddFamilyMemberRequest,
  ): Promise<AddFamilyMemberResult> {
    try {
      logger.info("Adding family member", {
        familyId: familyId.toString(),
        addedBy: addedBy.toString(),
        role: input.role,
        email: input.email,
      });

      // 1. Verify family exists
      const family = await this.familyRepository.findById(familyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      // 2. Create user via better-auth (without auto-login) or use existing user
      const auth = getAuth();
      let newUserId: ObjectId;

      try {
        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            // @ts-expect-error - birthdate is a custom field added via additionalFields but not in signUpEmail types
            birthdate: input.birthdate,
          },
        });

        newUserId = new ObjectId(signUpResult.user.id);

        logger.debug("User created via better-auth", {
          userId: newUserId.toString(),
          email: input.email,
        });
      } catch (error) {
        // If user creation fails, check if it's because the email already exists
        logger.debug("User creation failed, checking if user exists", {
          email: input.email,
          error,
        });

        // Query the users collection via MongoDB directly
        const db = getDb();
        const usersCollection = db.collection("user");

        const existingUser = await usersCollection.findOne({
          email: input.email.toLowerCase(),
        });

        if (!existingUser) {
          // Email doesn't exist, so this is a different error
          logger.error("Failed to create user via better-auth", {
            email: input.email,
            error,
          });
          throw HttpError.badRequest("Failed to create user account");
        }

        // User exists, check if they belong to a different family
        newUserId = new ObjectId(existingUser._id);

        const existingMemberships =
          await this.membershipRepository.findByUser(newUserId);

        if (existingMemberships.length > 0) {
          // Check if user is in THIS family
          const membershipInThisFamily = existingMemberships.find(
            (m) => m.familyId.toString() === familyId.toString(),
          );

          if (membershipInThisFamily) {
            throw HttpError.conflict("User is already a member of this family");
          }

          // User belongs to a different family
          throw HttpError.conflict(
            "Email is already associated with another family",
          );
        }

        logger.debug("Using existing user without family membership", {
          userId: newUserId.toString(),
          email: input.email,
        });
      }

      // 3. Check if user already member of this family (final check)
      const existingMembership =
        await this.membershipRepository.findByFamilyAndUser(
          familyId,
          newUserId,
        );

      if (existingMembership) {
        throw HttpError.conflict("User is already a member of this family");
      }

      // 4. Create family membership with addedBy metadata
      const membership = await this.membershipRepository.insertMembership(
        familyId,
        newUserId,
        input.role,
        addedBy,
      );

      logger.info("Family member added successfully", {
        familyId: familyId.toString(),
        memberId: newUserId.toString(),
        role: input.role,
        addedBy: addedBy.toString(),
      });

      // 5. Map to result DTO (without auth tokens)
      return toAddFamilyMemberResult(membership, familyId, addedBy);
    } catch (error) {
      logger.error("Failed to add family member", {
        familyId: familyId.toString(),
        addedBy: addedBy.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Remove a member from a family and enforce parent guardrails
   *
   * @param familyId - Family the member belongs to
   * @param removedBy - Parent initiating the removal
   * @param memberId - User being removed from the family
   */
  async removeFamilyMember(
    familyId: ObjectId,
    removedBy: ObjectId,
    memberId: ObjectId,
  ): Promise<void> {
    try {
      logger.info("Removing family member", {
        familyId: familyId.toString(),
        removedBy: removedBy.toString(),
        memberId: memberId.toString(),
      });

      const family = await this.familyRepository.findById(familyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      const initiatorMembership =
        await this.membershipRepository.findByFamilyAndUser(
          familyId,
          removedBy,
        );

      if (
        !initiatorMembership ||
        initiatorMembership.role !== FamilyRole.Parent
      ) {
        throw HttpError.forbidden("Only parents can remove family members");
      }

      const targetMembership =
        await this.membershipRepository.findByFamilyAndUser(familyId, memberId);

      if (!targetMembership) {
        throw HttpError.notFound("Member not found in family");
      }

      if (targetMembership.role === FamilyRole.Parent) {
        const memberships =
          await this.membershipRepository.findByFamily(familyId);
        const parentCount = memberships.filter(
          (membership) => membership.role === FamilyRole.Parent,
        ).length;

        if (parentCount <= 1) {
          throw HttpError.conflict("Family must retain at least one parent");
        }
      }

      const deleted = await this.membershipRepository.deleteMembership(
        familyId,
        memberId,
      );
      if (!deleted) {
        throw HttpError.notFound("Member not found in family");
      }

      logger.info("Family member removed successfully", {
        familyId: familyId.toString(),
        removedBy: removedBy.toString(),
        memberId: memberId.toString(),
      });
    } catch (error) {
      logger.error("Failed to remove family member", {
        familyId: familyId.toString(),
        removedBy: removedBy.toString(),
        memberId: memberId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a member's role in a family
   *
   * @param familyId - The ID of the family
   * @param memberId - The ID of the member whose role will be updated
   * @param role - The new role (Parent or Child)
   * @returns Update member role response
   */
  async updateMemberRole(
    familyId: ObjectId,
    memberId: ObjectId,
    role: FamilyRole,
  ): Promise<UpdateMemberRoleResponse> {
    try {
      logger.info("Updating member role", {
        familyId: familyId.toString(),
        memberId: memberId.toString(),
        role,
      });

      // 1. Verify family exists
      const family = await this.familyRepository.findById(familyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      // 2. Verify membership exists
      const membership = await this.membershipRepository.findByFamilyAndUser(
        familyId,
        memberId,
      );

      if (!membership) {
        throw HttpError.notFound("Member not found");
      }

      if (membership.role === FamilyRole.Parent && role === FamilyRole.Child) {
        const memberships =
          await this.membershipRepository.findByFamily(familyId);
        const parentCount = memberships.filter(
          (member) => member.role === FamilyRole.Parent,
        ).length;

        if (parentCount <= 1) {
          throw HttpError.conflict("Family must retain at least one parent");
        }
      }

      // 3. Update the role
      const updated = await this.membershipRepository.updateMemberRole(
        familyId,
        memberId,
        role,
      );

      if (!updated) {
        throw HttpError.notFound("Member not found");
      }

      // 4. Fetch updated membership to get updatedAt timestamp
      const updatedMembership =
        await this.membershipRepository.findByFamilyAndUser(familyId, memberId);

      if (!updatedMembership) {
        throw HttpError.internalServerError(
          "Failed to fetch updated membership",
        );
      }

      logger.info("Member role updated successfully", {
        familyId: familyId.toString(),
        memberId: memberId.toString(),
        role,
      });

      // 5. Return response
      return {
        memberId: memberId.toString(),
        familyId: familyId.toString(),
        role: updatedMembership.role,
        updatedAt: updatedMembership.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to update member role", {
        familyId: familyId.toString(),
        memberId: memberId.toString(),
        role,
        error,
      });
      throw error;
    }
  }
}
