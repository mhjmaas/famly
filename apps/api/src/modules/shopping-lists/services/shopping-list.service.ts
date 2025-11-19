import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type {
  AddItemInput,
  CreateShoppingListInput,
  ShoppingList,
  UpdateItemInput,
  UpdateShoppingListInput,
} from "../domain/shopping-list";
import type { ShoppingListRepository } from "../repositories/shopping-list.repository";

export class ShoppingListService {
  constructor(
    private shoppingListRepository: ShoppingListRepository,
    private membershipRepository: FamilyMembershipRepository,
    private activityEventService?: ActivityEventService,
  ) {}

  /**
   * Create a new shopping list
   */
  async createShoppingList(
    familyId: string,
    userId: string,
    input: CreateShoppingListInput,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating shopping list", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        name: input.name,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const shoppingList = await this.shoppingListRepository.createShoppingList(
        toObjectId(normalizedFamilyId, "familyId"),
        input,
        toObjectId(normalizedUserId, "userId"),
      );

      logger.info("Shopping list created successfully", {
        listId: shoppingList._id.toString(),
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.recordActivityEvent(
        normalizedUserId,
        "SHOPPING_LIST",
        shoppingList.name,
        `Created shopping list with ${shoppingList.items.length} items`,
        "CREATED",
      );

      return shoppingList;
    } catch (error) {
      logger.error("Failed to create shopping list", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * List all shopping lists for a family
   */
  async listShoppingLists(
    familyId: string,
    userId: string,
  ): Promise<ShoppingList[]> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Listing shopping lists for family", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      return await this.shoppingListRepository.findShoppingListsByFamily(
        toObjectId(normalizedFamilyId, "familyId"),
      );
    } catch (error) {
      logger.error("Failed to list shopping lists for family", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific shopping list by ID
   */
  async getShoppingList(
    familyId: string,
    listId: string,
    userId: string,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Getting shopping list by ID", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const list = await this.shoppingListRepository.findShoppingListById(
        toObjectId(normalizedListId, "listId"),
      );

      if (!list) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (list.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      return list;
    } catch (error) {
      logger.error("Failed to get shopping list by ID", {
        listId: normalizedListId ?? listId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a shopping list
   */
  async updateShoppingList(
    familyId: string,
    listId: string,
    userId: string,
    input: UpdateShoppingListInput,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Updating shopping list", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const listObjectId = toObjectId(normalizedListId, "listId");

      const existingList =
        await this.shoppingListRepository.findShoppingListById(listObjectId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      const updatedList = await this.shoppingListRepository.updateShoppingList(
        listObjectId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Shopping list updated successfully", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to update shopping list", {
        listId: normalizedListId ?? listId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a shopping list
   */
  async deleteShoppingList(
    familyId: string,
    listId: string,
    userId: string,
  ): Promise<void> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Deleting shopping list", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const listObjectId = toObjectId(normalizedListId, "listId");
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listObjectId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      const deleted =
        await this.shoppingListRepository.deleteShoppingList(listObjectId);

      if (!deleted) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Shopping list deleted successfully", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });
    } catch (error) {
      logger.error("Failed to delete shopping list", {
        listId: normalizedListId ?? listId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Add an item to a shopping list
   */
  async addItem(
    familyId: string,
    listId: string,
    userId: string,
    input: AddItemInput,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Adding item to shopping list", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const listObjectId = toObjectId(normalizedListId, "listId");

      const existingList =
        await this.shoppingListRepository.findShoppingListById(listObjectId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      const updatedList = await this.shoppingListRepository.addItemToList(
        listObjectId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item added to shopping list successfully", {
        listId: normalizedListId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to add item to shopping list", {
        listId: normalizedListId ?? listId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update an item in a shopping list
   */
  async updateItem(
    familyId: string,
    listId: string,
    itemId: string,
    userId: string,
    input: UpdateItemInput,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedItemId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedItemId = validateObjectId(itemId, "itemId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Updating item in shopping list", {
        listId: normalizedListId,
        itemId: normalizedItemId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const listObjectId = toObjectId(normalizedListId, "listId");
      const itemObjectId = toObjectId(normalizedItemId, "itemId");

      const existingList =
        await this.shoppingListRepository.findShoppingListById(listObjectId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      const item = this.shoppingListRepository.findItemById(
        existingList,
        itemObjectId,
      );
      if (!item) {
        throw HttpError.notFound("Item not found in shopping list");
      }

      const updatedList = await this.shoppingListRepository.updateItemInList(
        listObjectId,
        itemObjectId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item updated in shopping list successfully", {
        listId: normalizedListId,
        itemId: normalizedItemId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to update item in shopping list", {
        listId: normalizedListId ?? listId,
        itemId: normalizedItemId ?? itemId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete an item from a shopping list
   */
  async deleteItem(
    familyId: string,
    listId: string,
    itemId: string,
    userId: string,
  ): Promise<ShoppingList> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedListId: ObjectIdString | undefined;
    let normalizedItemId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedListId = validateObjectId(listId, "listId");
      normalizedItemId = validateObjectId(itemId, "itemId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Deleting item from shopping list", {
        listId: normalizedListId,
        itemId: normalizedItemId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.ensureFamilyMembership(normalizedFamilyId, normalizedUserId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const listObjectId = toObjectId(normalizedListId, "listId");
      const itemObjectId = toObjectId(normalizedItemId, "itemId");

      const existingList =
        await this.shoppingListRepository.findShoppingListById(listObjectId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      const item = this.shoppingListRepository.findItemById(
        existingList,
        itemObjectId,
      );
      if (!item) {
        throw HttpError.notFound("Item not found in shopping list");
      }

      const updatedList = await this.shoppingListRepository.deleteItemFromList(
        listObjectId,
        itemObjectId,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item deleted from shopping list successfully", {
        listId: normalizedListId,
        itemId: normalizedItemId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to delete item from shopping list", {
        listId: normalizedListId ?? listId,
        itemId: normalizedItemId ?? itemId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  private async ensureFamilyMembership(
    familyId: ObjectIdString,
    userId: ObjectIdString,
    allowedRoles: FamilyRole[],
  ): Promise<void> {
    await requireFamilyRole({
      familyId,
      userId,
      allowedRoles,
      membershipRepository: this.membershipRepository,
    });
  }

  private async recordActivityEvent(
    userId: ObjectIdString,
    type: "SHOPPING_LIST",
    title: string,
    description: string,
    detail?: string,
  ): Promise<void> {
    if (!this.activityEventService) {
      return;
    }

    try {
      await this.activityEventService.recordEvent({
        userId,
        type,
        title,
        description,
        detail,
      });
    } catch (error) {
      logger.error("Failed to record shopping list activity event", {
        userId,
        type,
        error,
      });
    }
  }
}
