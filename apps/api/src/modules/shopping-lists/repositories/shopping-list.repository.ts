import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type {
  AddItemInput,
  CreateShoppingListInput,
  ShoppingList,
  ShoppingListItem,
  UpdateItemInput,
  UpdateShoppingListInput,
} from "../domain/shopping-list";

export class ShoppingListRepository {
  private collection: Collection<ShoppingList>;

  constructor() {
    this.collection = getDb().collection<ShoppingList>("shopping_lists");
  }

  /**
   * Ensure indexes are created for the shopping_lists collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for listing shopping lists by family and creation date
      await this.collection.createIndex(
        { familyId: 1, createdAt: -1 },
        { name: "idx_family_created" },
      );

      // Index for filtering by family and tags
      await this.collection.createIndex(
        { familyId: 1, tags: 1 },
        { name: "idx_family_tags" },
      );

      logger.info("Shopping list indexes created successfully");
    } catch (error) {
      logger.error("Failed to create shopping list indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new shopping list
   */
  async createShoppingList(
    familyId: ObjectId,
    input: CreateShoppingListInput,
    createdBy: ObjectId,
  ): Promise<ShoppingList> {
    const now = new Date();

    const items: ShoppingListItem[] = (input.items || []).map((item) => ({
      _id: new ObjectId(),
      name: item.name,
      checked: false,
      createdAt: now,
    }));

    const shoppingList: ShoppingList = {
      _id: new ObjectId(),
      familyId,
      name: input.name,
      tags: input.tags || [],
      items,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(shoppingList);

    return shoppingList;
  }

  /**
   * Find a shopping list by ID
   */
  async findShoppingListById(listId: ObjectId): Promise<ShoppingList | null> {
    return this.collection.findOne({ _id: listId });
  }

  /**
   * Find all shopping lists for a family
   */
  async findShoppingListsByFamily(
    familyId: ObjectId,
  ): Promise<ShoppingList[]> {
    return this.collection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Update a shopping list (name and/or tags)
   */
  async updateShoppingList(
    listId: ObjectId,
    input: UpdateShoppingListInput,
  ): Promise<ShoppingList | null> {
    const updateFields: Partial<ShoppingList> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.tags !== undefined) {
      updateFields.tags = input.tags;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: listId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a shopping list
   */
  async deleteShoppingList(listId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: listId });
    return result.deletedCount > 0;
  }

  /**
   * Add an item to a shopping list
   */
  async addItemToList(
    listId: ObjectId,
    input: AddItemInput,
  ): Promise<ShoppingList | null> {
    const newItem: ShoppingListItem = {
      _id: new ObjectId(),
      name: input.name,
      checked: false,
      createdAt: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: listId },
      {
        $push: { items: newItem },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Update an item in a shopping list
   */
  async updateItemInList(
    listId: ObjectId,
    itemId: ObjectId,
    input: UpdateItemInput,
  ): Promise<ShoppingList | null> {
    const updateFields: Record<string, unknown> = {
      "items.$.updatedAt": new Date(),
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields["items.$.name"] = input.name;
    }
    if (input.checked !== undefined) {
      updateFields["items.$.checked"] = input.checked;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: listId, "items._id": itemId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete an item from a shopping list
   */
  async deleteItemFromList(
    listId: ObjectId,
    itemId: ObjectId,
  ): Promise<ShoppingList | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: listId },
      {
        $pull: { items: { _id: itemId } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Find an item by ID within a shopping list
   */
  findItemById(list: ShoppingList, itemId: ObjectId): ShoppingListItem | null {
    return list.items.find((item) => item._id.equals(itemId)) || null;
  }
}
