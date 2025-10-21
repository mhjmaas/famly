import type { NextFunction, Response } from 'express';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { HttpError } from '@lib/http-error';
import { logger } from '@lib/logger';
import type { AuthenticatedRequest } from '@modules/auth/middleware/authenticate';
import { authenticate } from '@modules/auth/middleware/authenticate';
import { authorizeFamilyRole } from '@modules/auth/middleware/authorize-family-role';
import { FamilyRole } from '../domain/family';
import { FamilyMembershipRepository } from '../repositories/family-membership.repository';
import { FamilyRepository } from '../repositories/family.repository';
import { FamilyService } from '../services/family.service';
import { validateAddFamilyMember } from '../validators/add-family-member.validator';
import { validateCreateFamily } from '../validators/create-family.validator';
import {
  buildFamiliesWithMembersResponse,
  type FamiliesWithMembersResponse,
} from '../lib/family.mapper';

/**
 * Create families router with GET and POST endpoints
 */
export function createFamiliesRouter(): Router {
  const router = Router();

  // Initialize repositories and service
  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(familyRepository, membershipRepository);

  /**
   * POST /v1/families - Create a new family
   *
   * Requires authentication
   * Creates a family and links the authenticated user as Parent
   *
   * Request body:
   * - name: string | null (optional, max 120 chars, trimmed)
   *
   * Response (201): FamilyMembershipView
   *
   * Response (400): Validation error
   * Response (401): Authentication required
   */
  router.post(
    '/',
    authenticate,
    validateCreateFamily,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized('Authentication required');
        }

        const userId = new ObjectId(req.user.id);

        logger.info(`Creating family via API with name: ${req.body.name}`);

        const result = await familyService.createFamily(userId, req.body);

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /v1/families - List families for authenticated user
   *
   * Requires authentication
   * Returns all families the user belongs to with their roles
   *
   * Response (200): FamilyMembershipView[]
   *
   * Response (401): Authentication required
   */
  router.get(
    '/',
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized('Authentication required');
        }

        const userId = new ObjectId(req.user.id);

        logger.debug('Listing families via API', {
          userId: req.user.id,
        });

        const families = await familyService.listFamiliesForUser(userId);

        if (families.length === 0) {
          res.status(200).json([]);
          return;
        }

        const familyIds = families.map((family) => new ObjectId(family.familyId));
        const memberships = await membershipRepository.findByFamilyIds(familyIds);

        const familiesWithMembers: FamiliesWithMembersResponse =
          buildFamiliesWithMembersResponse(families, memberships);

        res.status(200).json(familiesWithMembers);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /v1/families/:familyId/members - Add a member to a family
   *
   * Requires authentication and Parent role in the specified family
   * Creates a new user account and links them to the family
   * The new user is NOT auto-logged in (no tokens issued)
   *
   * Request params:
   * - familyId: ObjectId string
   *
   * Request body:
   * - email: string (valid email, normalized to lowercase)
   * - password: string (min 8 chars)
   * - role: 'Parent' | 'Child'
   *
   * Response (201): AddFamilyMemberResult
   *
   * Response (400): Validation error or user creation failed
   * Response (401): Authentication required
   * Response (403): Not a parent in this family
   * Response (404): Family not found
   * Response (409): User already member of this family
   */
  router.post(
    '/:familyId/members',
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    validateAddFamilyMember,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized('Authentication required');
        }

        const familyId = new ObjectId(req.params.familyId);
        const addedBy = new ObjectId(req.user.id);

        logger.info('Adding family member via API', {
          familyId: familyId.toString(),
          addedBy: addedBy.toString(),
          role: req.body.role,
        });

        const result = await familyService.addFamilyMember(
          familyId,
          addedBy,
          req.body
        );

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /v1/families/:familyId/members/:memberId - Remove a member from a family
   *
   * Requires authentication and Parent role in the specified family
   * Removes the member and returns 204 on success.
   *
   * Response (204): Member removed
   *
   * Response (400): Validation error (invalid IDs)
   * Response (401): Authentication required
   * Response (403): Not a parent in this family
   * Response (404): Family or member not found
   * Response (409): Guardrail preventing removal (e.g., last parent)
   */
  router.delete(
    '/:familyId/members/:memberId',
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized('Authentication required');
        }

        let familyId: ObjectId;
        let memberId: ObjectId;
        const removedBy = new ObjectId(req.user.id);

        try {
          familyId = new ObjectId(req.params.familyId);
        } catch {
          throw HttpError.badRequest('Invalid family identifier');
        }

        try {
          memberId = new ObjectId(req.params.memberId);
        } catch {
          throw HttpError.badRequest('Invalid member identifier');
        }

        logger.info('Removing family member via API', {
          familyId: familyId.toString(),
          memberId: memberId.toString(),
          removedBy: removedBy.toString(),
        });

        await familyService.removeFamilyMember(familyId, removedBy, memberId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
