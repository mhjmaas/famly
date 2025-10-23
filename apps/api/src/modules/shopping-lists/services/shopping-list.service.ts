import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { ObjectId } from "mongodb";
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
  ) {}

  /**
   * Create a new shopping list
   */
  async createShoppingList(
    familyId: ObjectId,
    userId: ObjectId,
    input: CreateShoppingListInput,
  ): Promise<ShoppingList> {
    try {
      logger.info("Creating shopping list", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        name: input.name,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Create the shopping list
      const shoppingList = await this.shoppingListRepository.createShoppingList(
        familyId,
        input,
        userId,
      );

      logger.info("Shopping list created successfully", {
        listId: shoppingList._id.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return shoppingList;
    } catch (error) {
      logger.error("Failed to create shopping list", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List all shopping lists for a family
   */
  async listShoppingLists(
    familyId: ObjectId,
    userId: ObjectId,
  ): Promise<ShoppingList[]> {
    try {
      logger.debug("Listing shopping lists for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Fetch shopping lists
      const lists =
        await this.shoppingListRepository.findShoppingListsByFamily(familyId);

      return lists;
    } catch (error) {
      logger.error("Failed to list shopping lists for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific shopping list by ID
   */
  async getShoppingList(
    familyId: ObjectId,
    listId: ObjectId,
    userId: ObjectId,
  ): Promise<ShoppingList> {
    try {
      logger.debug("Getting shopping list by ID", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Fetch the shopping list
      const list =
        await this.shoppingListRepository.findShoppingListById(listId);

      if (!list) {
        throw HttpError.notFound("Shopping list not found");
      }

      // Verify list belongs to the specified family
      if (list.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      return list;
    } catch (error) {
      logger.error("Failed to get shopping list by ID", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a shopping list
   */
  async updateShoppingList(
    familyId: ObjectId,
    listId: ObjectId,
    userId: ObjectId,
    input: UpdateShoppingListInput,
  ): Promise<ShoppingList> {
    try {
      logger.info("Updating shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify shopping list exists and belongs to family
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      // Update the shopping list
      const updatedList = await this.shoppingListRepository.updateShoppingList(
        listId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Shopping list updated successfully", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to update shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a shopping list
   */
  async deleteShoppingList(
    familyId: ObjectId,
    listId: ObjectId,
    userId: ObjectId,
  ): Promise<void> {
    try {
      logger.info("Deleting shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify shopping list exists and belongs to family
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      // Delete the shopping list
      const deleted =
        await this.shoppingListRepository.deleteShoppingList(listId);

      if (!deleted) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Shopping list deleted successfully", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });
    } catch (error) {
      logger.error("Failed to delete shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Add an item to a shopping list
   */
  async addItem(
    familyId: ObjectId,
    listId: ObjectId,
    userId: ObjectId,
    input: AddItemInput,
  ): Promise<ShoppingList> {
    try {
      logger.info("Adding item to shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify shopping list exists and belongs to family
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      // Add item to list
      const updatedList = await this.shoppingListRepository.addItemToList(
        listId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item added to shopping list successfully", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to add item to shopping list", {
        listId: listId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update an item in a shopping list
   */
  async updateItem(
    familyId: ObjectId,
    listId: ObjectId,
    itemId: ObjectId,
    userId: ObjectId,
    input: UpdateItemInput,
  ): Promise<ShoppingList> {
    try {
      logger.info("Updating item in shopping list", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify shopping list exists and belongs to family
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      // Verify item exists in list
      const item = this.shoppingListRepository.findItemById(
        existingList,
        itemId,
      );
      if (!item) {
        throw HttpError.notFound("Item not found in shopping list");
      }

      // Update item
      const updatedList = await this.shoppingListRepository.updateItemInList(
        listId,
        itemId,
        input,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item updated in shopping list successfully", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to update item in shopping list", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete an item from a shopping list
   */
  async deleteItem(
    familyId: ObjectId,
    listId: ObjectId,
    itemId: ObjectId,
    userId: ObjectId,
  ): Promise<ShoppingList> {
    try {
      logger.info("Deleting item from shopping list", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify shopping list exists and belongs to family
      const existingList =
        await this.shoppingListRepository.findShoppingListById(listId);
      if (!existingList) {
        throw HttpError.notFound("Shopping list not found");
      }

      if (existingList.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden(
          "Shopping list does not belong to this family",
        );
      }

      // Verify item exists in list
      const item = this.shoppingListRepository.findItemById(
        existingList,
        itemId,
      );
      if (!item) {
        throw HttpError.notFound("Item not found in shopping list");
      }

      // Delete item
      const updatedList = await this.shoppingListRepository.deleteItemFromList(
        listId,
        itemId,
      );

      if (!updatedList) {
        throw HttpError.notFound("Shopping list not found");
      }

      logger.info("Item deleted from shopping list successfully", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedList;
    } catch (error) {
      logger.error("Failed to delete item from shopping list", {
        listId: listId.toString(),
        itemId: itemId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }
}
