import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { ShoppingListRepository } from "../repositories/shopping-list.repository";
import { ShoppingListService } from "../services/shopping-list.service";

export function deleteListRoute(): Router {
  const router = Router({ mergeParams: true });
  const shoppingListRepository = new ShoppingListRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const shoppingListService = new ShoppingListService(
    shoppingListRepository,
    membershipRepository,
  );

  router.delete(
    "/:listId",
    authenticate,
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

        let familyId: ObjectId;
        let listId: ObjectId;

        try {
          familyId = new ObjectId(req.params.familyId);
          listId = new ObjectId(req.params.listId);
        } catch {
          throw HttpError.notFound("Shopping list not found");
        }

        await shoppingListService.deleteShoppingList(familyId, listId, userId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
