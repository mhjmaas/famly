import { HttpError } from '@lib/http-error';
import { logger } from '@lib/logger';
import { authenticate, AuthenticatedRequest } from '@modules/auth/middleware/authenticate';
import { NextFunction, Response, Router } from 'express';
import { ObjectId } from 'mongodb';
import { FamilyMembershipRepository } from '../repositories/family-membership.repository';
import { FamilyRepository } from '../repositories/family.repository';
import { FamilyService } from '../services/family.service';
import { validateCreateFamily } from '../validators/create-family.validator';

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

        logger.info('Creating family via API with name: ' + req.body.name);

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

        const result = await familyService.listFamiliesForUser(userId);

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
