import { Router } from "express";
import { addItemRoute } from "./add-item.route";
import { createListRoute } from "./create-list.route";
import { deleteItemRoute } from "./delete-item.route";
import { deleteListRoute } from "./delete-list.route";
import { getListRoute } from "./get-list.route";
import { listListsRoute } from "./list-lists.route";
import { updateItemRoute } from "./update-item.route";
import { updateListRoute } from "./update-list.route";

/**
 * Create shopping lists router for /v1/families/:familyId/shopping-lists
 *
 * All routes are scoped to a specific family via the familyId parameter
 */
export function createShoppingListsRouter(): Router {
  const router = Router({ mergeParams: true });

  // Shopping list routes
  router.use(createListRoute());
  router.use(listListsRoute());
  router.use(getListRoute());
  router.use(updateListRoute());
  router.use(deleteListRoute());

  // Shopping list item routes
  router.use(addItemRoute());
  router.use(updateItemRoute());
  router.use(deleteItemRoute());

  return router;
}
