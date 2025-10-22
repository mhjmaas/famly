import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toShoppingListDTO } from "../lib/shopping-list.mapper";
import { ShoppingListRepository } from "../repositories/shopping-list.repository";
import { ShoppingListService } from "../services/shopping-list.service";
import { validateUpdateItem } from "../validators/update-item.validator";

export function updateItemRoute(): Router {
  const router = Router({ mergeParams: true });
  const shoppingListRepository = new ShoppingListRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const shoppingListService = new ShoppingListService(
    shoppingListRepository,
    membershipRepository,
  );

  router.patch(
    "/:listId/items/:itemId",
    authenticate,
    validateUpdateItem,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

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

        if (!req.params.itemId) {
          throw HttpError.badRequest("Missing itemId parameter");
        }

        let familyId: ObjectId;
        let listId: ObjectId;
        let itemId: ObjectId;

        try {
          familyId = new ObjectId(req.params.familyId);
          listId = new ObjectId(req.params.listId);
          itemId = new ObjectId(req.params.itemId);
        } catch {
          throw HttpError.notFound("Item not found");
        }

        const shoppingList = await shoppingListService.updateItem(
          familyId,
          listId,
          itemId,
          userId,
          req.body,
        );

        res.status(200).json(toShoppingListDTO(shoppingList));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
