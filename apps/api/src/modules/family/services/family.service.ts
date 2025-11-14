import { getDb } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  fromObjectId,
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import { getAuth } from "@modules/auth/better-auth";
import { DeploymentConfigRepository } from "@modules/deployment-config/repositories/deployment-config.repository";
import { DeploymentConfigService } from "@modules/deployment-config/services/deployment-config.service";
import {
  emitFamilyMemberAdded,
  emitFamilyMemberRemoved,
  emitFamilyMemberRoleUpdated,
} from "@modules/family/events/family-events";
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
   * @param userId - The ID of the user creating the family (string)
   * @param input - Create family input payload
   * @returns Create family response with membership view
   */
  async createFamily(
    userId: string,
    input: CreateFamilyInput,
  ): Promise<CreateFamilyResponse> {
    let creatorId: ObjectIdString | undefined;
    try {
      creatorId = validateObjectId(userId, "userId");
      // Normalize family name (trim, handle empty string, validate length)
      const normalizedName = normalizeFamilyName(input.name);

      logger.info("Creating family", {
        userId: creatorId,
        name: normalizedName,
      });

      // Create family document
      const family = await this.familyRepository.createFamily(
        creatorId,
        normalizedName,
      );

      // Create Parent membership for creator
      const membership = await this.membershipRepository.insertMembership(
        fromObjectId(family._id),
        creatorId,
        FamilyRole.Parent,
      );

      // Convert to view DTO
      const familyView = toFamilyMembershipView(family, membership);

      // Mark onboarding as complete if in standalone mode and not yet completed
      const deploymentConfigRepo = new DeploymentConfigRepository();
      const deploymentConfigService = new DeploymentConfigService(
        deploymentConfigRepo,
      );

      const shouldComplete =
        await deploymentConfigService.shouldCompleteOnboarding();
      if (shouldComplete) {
        await deploymentConfigService.markOnboardingCompleted();
        logger.info(
          "Onboarding marked as completed after first family creation",
        );
      }

      logger.info("Family created successfully", {
        familyId: fromObjectId(family._id),
        userId: creatorId,
      });

      return familyView;
    } catch (error) {
      logger.error("Failed to create family", {
        userId: creatorId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * List all families for a user
   *
   * @param userId - The ID of the user (string)
   * @returns List families response with membership views
   */
  async listFamiliesForUser(userId: string): Promise<ListFamiliesResponse> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Listing families for user", { userId: normalizedUserId });

      // Find all memberships for the user
      const memberships =
        await this.membershipRepository.findByUser(normalizedUserId);

      if (memberships.length === 0) {
        return [];
      }

      // Extract unique family IDs as strings
      const familyIds = memberships.map((m) => fromObjectId(m.familyId));

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
        userId: normalizedUserId ?? userId,
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
   * @param familyId - The ID of the family (string)
   * @param addedBy - The ID of the parent adding the member (string)
   * @param input - Add family member input payload
   * @returns Add family member result
   */
  async addFamilyMember(
    familyId: string,
    addedBy: string,
    input: AddFamilyMemberRequest,
  ): Promise<AddFamilyMemberResult> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedAddedBy: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedAddedBy = validateObjectId(addedBy, "addedBy");

      logger.info("Adding family member", {
        familyId: normalizedFamilyId,
        addedBy: normalizedAddedBy,
        role: input.role,
        email: input.email,
      });

      const family = await this.familyRepository.findById(normalizedFamilyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      const auth = getAuth();
      let newUserId: ObjectIdString;

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

        newUserId = validateObjectId(signUpResult.user.id, "newUserId");

        logger.debug("User created via better-auth", {
          userId: newUserId,
          email: input.email,
        });
      } catch (error) {
        logger.debug("User creation failed, checking if user exists", {
          email: input.email,
          error,
        });

        const db = getDb();
        const usersCollection = db.collection("user");

        const existingUser = await usersCollection.findOne({
          email: input.email.toLowerCase(),
        });

        if (!existingUser) {
          logger.error("Failed to create user via better-auth", {
            email: input.email,
            error,
          });
          throw HttpError.badRequest("Failed to create user account");
        }

        const existingUserId = fromObjectId(existingUser._id);

        const existingMemberships =
          await this.membershipRepository.findByUser(existingUserId);

        if (existingMemberships.length > 0) {
          const membershipInThisFamily = existingMemberships.find(
            (m) => m.familyId.toString() === normalizedFamilyId,
          );

          if (membershipInThisFamily) {
            throw HttpError.conflict("User is already a member of this family");
          }

          throw HttpError.conflict(
            "Email is already associated with another family",
          );
        }

        logger.debug("Using existing user without family membership", {
          userId: existingUserId,
          email: input.email,
        });

        newUserId = existingUserId;
      }

      const existingMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          newUserId,
        );

      if (existingMembership) {
        throw HttpError.conflict("User is already a member of this family");
      }

      const membership = await this.membershipRepository.insertMembership(
        normalizedFamilyId,
        newUserId,
        input.role,
        normalizedAddedBy,
      );

      logger.info("Family member added successfully", {
        familyId: normalizedFamilyId,
        memberId: newUserId,
        role: input.role,
        addedBy: normalizedAddedBy,
      });

      await emitFamilyMemberAdded(
        normalizedFamilyId,
        newUserId,
        input.name,
        input.role,
      );

      return toAddFamilyMemberResult(
        membership,
        normalizedFamilyId,
        normalizedAddedBy,
      );
    } catch (error) {
      logger.error("Failed to add family member", {
        familyId: normalizedFamilyId ?? familyId,
        addedBy: normalizedAddedBy ?? addedBy,
        error,
      });
      throw error;
    }
  }

  /**
   * Remove a member from a family and enforce parent guardrails
   *
   * @param familyId - Family the member belongs to (string)
   * @param removedBy - Parent initiating the removal (string)
   * @param memberId - User being removed from the family (string)
   */
  async removeFamilyMember(
    familyId: string,
    removedBy: string,
    memberId: string,
  ): Promise<void> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedRemovedBy: ObjectIdString | undefined;
    let normalizedMemberId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedRemovedBy = validateObjectId(removedBy, "removedBy");
      normalizedMemberId = validateObjectId(memberId, "memberId");

      logger.info("Removing family member", {
        familyId: normalizedFamilyId,
        removedBy: normalizedRemovedBy,
        memberId: normalizedMemberId,
      });

      const family = await this.familyRepository.findById(normalizedFamilyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      const initiatorMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedRemovedBy,
        );

      if (
        !initiatorMembership ||
        initiatorMembership.role !== FamilyRole.Parent
      ) {
        throw HttpError.forbidden("Only parents can remove family members");
      }

      const targetMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedMemberId,
        );

      if (!targetMembership) {
        throw HttpError.notFound("Member not found in family");
      }

      if (targetMembership.role === FamilyRole.Parent) {
        const memberships =
          await this.membershipRepository.findByFamily(normalizedFamilyId);
        const parentCount = memberships.filter(
          (membership) => membership.role === FamilyRole.Parent,
        ).length;

        if (parentCount <= 1) {
          throw HttpError.conflict("Family must retain at least one parent");
        }
      }

      // Fetch user data before deletion to get the name for the event
      const db = getDb();
      const usersCollection = db.collection("user");
      const user = await usersCollection.findOne({
        _id: toObjectId(normalizedMemberId, "memberId"),
      });
      const memberName = user?.name || "Unknown";

      const deleted = await this.membershipRepository.deleteMembership(
        normalizedFamilyId,
        normalizedMemberId,
      );
      if (!deleted) {
        throw HttpError.notFound("Member not found in family");
      }

      logger.info("Family member removed successfully", {
        familyId: normalizedFamilyId,
        removedBy: normalizedRemovedBy,
        memberId: normalizedMemberId,
      });

      // Emit event to notify remaining family members
      await emitFamilyMemberRemoved(
        normalizedFamilyId,
        normalizedMemberId,
        memberName,
      );
    } catch (error) {
      logger.error("Failed to remove family member", {
        familyId: normalizedFamilyId ?? familyId,
        removedBy: normalizedRemovedBy ?? removedBy,
        memberId: normalizedMemberId ?? memberId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a member's role in a family
   *
   * @param familyId - The ID of the family (string)
   * @param memberId - The ID of the member whose role will be updated (string)
   * @param role - The new role (Parent or Child)
   * @returns Update member role response
   */
  async updateMemberRole(
    familyId: string,
    memberId: string,
    role: FamilyRole,
  ): Promise<UpdateMemberRoleResponse> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedMemberId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedMemberId = validateObjectId(memberId, "memberId");

      logger.info("Updating member role", {
        familyId: normalizedFamilyId,
        memberId: normalizedMemberId,
        role,
      });

      const family = await this.familyRepository.findById(normalizedFamilyId);
      if (!family) {
        throw HttpError.notFound("Family not found");
      }

      const membership = await this.membershipRepository.findByFamilyAndUser(
        normalizedFamilyId,
        normalizedMemberId,
      );

      if (!membership) {
        throw HttpError.notFound("Member not found");
      }

      if (membership.role === FamilyRole.Parent && role === FamilyRole.Child) {
        const memberships =
          await this.membershipRepository.findByFamily(normalizedFamilyId);
        const parentCount = memberships.filter(
          (member) => member.role === FamilyRole.Parent,
        ).length;

        if (parentCount <= 1) {
          throw HttpError.conflict("Family must retain at least one parent");
        }
      }

      // Remember old role for event
      const oldRole = membership.role;

      const updated = await this.membershipRepository.updateMemberRole(
        normalizedFamilyId,
        normalizedMemberId,
        role,
      );

      if (!updated) {
        throw HttpError.notFound("Member not found");
      }

      const updatedMembership =
        await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedMemberId,
        );

      if (!updatedMembership) {
        throw HttpError.internalServerError(
          "Failed to fetch updated membership",
        );
      }

      logger.info("Member role updated successfully", {
        familyId,
        memberId,
        role,
      });

      // Fetch user data to get the name for the event
      const db = getDb();
      const usersCollection = db.collection("user");
      const user = await usersCollection.findOne({
        _id: toObjectId(normalizedMemberId, "memberId"),
      });
      const memberName = user?.name || "Unknown";

      await emitFamilyMemberRoleUpdated(
        normalizedFamilyId,
        normalizedMemberId,
        memberName,
        oldRole,
        role,
      );

      return {
        memberId: normalizedMemberId,
        familyId: normalizedFamilyId,
        role: updatedMembership.role,
        updatedAt: updatedMembership.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to update member role", {
        familyId: normalizedFamilyId ?? familyId,
        memberId: normalizedMemberId ?? memberId,
        role,
        error,
      });
      throw error;
    }
  }
}
