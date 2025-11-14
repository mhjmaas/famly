import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toShoppingListDTO } from "../lib/shopping-list.mapper";
import { ShoppingListRepository } from "../repositories/shopping-list.repository";
import { ShoppingListService } from "../services/shopping-list.service";
import { validateAddItem } from "../validators/add-item.validator";

export function addItemRoute(): Router {
  const router = Router({ mergeParams: true });
  const shoppingListRepository = new ShoppingListRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const shoppingListService = new ShoppingListService(
    shoppingListRepository,
    membershipRepository,
  );

  router.post(
    "/:listId/items",
    authenticate,
    validateAddItem,
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

        if (!req.params.listId) {
          throw HttpError.badRequest("Missing listId parameter");
        }

        let familyId: string;
        let listId: string;
        try {
          familyId = validateObjectId(req.params.familyId, "familyId");
          listId = validateObjectId(req.params.listId, "listId");
        } catch {
          throw HttpError.notFound("Shopping list not found");
        }

        const shoppingList = await shoppingListService.addItem(
          familyId,
          listId,
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
