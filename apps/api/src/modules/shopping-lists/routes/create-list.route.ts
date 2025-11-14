import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toShoppingListDTO } from "../lib/shopping-list.mapper";
import { ShoppingListRepository } from "../repositories/shopping-list.repository";
import { ShoppingListService } from "../services/shopping-list.service";
import { validateCreateList } from "../validators/create-list.validator";

export function createListRoute(): Router {
  const router = Router({ mergeParams: true });
  const shoppingListRepository = new ShoppingListRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );
  const shoppingListService = new ShoppingListService(
    shoppingListRepository,
    membershipRepository,
    activityEventService,
  );

  router.post(
    "/",
    authenticate,
    validateCreateList,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = validateObjectId(req.user.id, "userId");

        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = validateObjectId(req.params.familyId, "familyId");

        const shoppingList = await shoppingListService.createShoppingList(
          familyId,
          userId,
          req.body,
        );

        res.status(201).json(toShoppingListDTO(shoppingList));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
