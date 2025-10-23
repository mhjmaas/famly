import { ObjectId } from "mongodb";
import type {
  ShoppingList,
  ShoppingListItem,
} from "../../../src/modules/shopping-lists/domain/shopping-list";
import {
  toShoppingListDTO,
  toShoppingListItemDTO,
} from "../../../src/modules/shopping-lists/lib/shopping-list.mapper";

describe("Shopping List Mapper", () => {
  describe("toShoppingListItemDTO", () => {
    it("should convert ShoppingListItem to DTO", () => {
      const itemId = new ObjectId();
      const now = new Date("2025-01-15T10:30:00Z");

      const item: ShoppingListItem = {
        _id: itemId,
        name: "Milk",
        checked: false,
        createdAt: now,
      };

      const dto = toShoppingListItemDTO(item);

      expect(dto).toEqual({
        _id: itemId.toString(),
        name: "Milk",
        checked: false,
        createdAt: "2025-01-15T10:30:00.000Z",
      });
    });

    it("should convert ObjectId to string", () => {
      const itemId = new ObjectId("507f1f77bcf86cd799439011");
      const item: ShoppingListItem = {
        _id: itemId,
        name: "Bread",
        checked: true,
        createdAt: new Date(),
      };

      const dto = toShoppingListItemDTO(item);
      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(typeof dto._id).toBe("string");
    });

    it("should convert date to ISO string", () => {
      const now = new Date("2025-01-15T14:45:30.123Z");
      const item: ShoppingListItem = {
        _id: new ObjectId(),
        name: "Eggs",
        checked: false,
        createdAt: now,
      };

      const dto = toShoppingListItemDTO(item);
      expect(dto.createdAt).toBe("2025-01-15T14:45:30.123Z");
      expect(typeof dto.createdAt).toBe("string");
    });

    it("should preserve checked status true", () => {
      const item: ShoppingListItem = {
        _id: new ObjectId(),
        name: "Purchased Item",
        checked: true,
        createdAt: new Date(),
      };

      const dto = toShoppingListItemDTO(item);
      expect(dto.checked).toBe(true);
    });

    it("should preserve checked status false", () => {
      const item: ShoppingListItem = {
        _id: new ObjectId(),
        name: "Not Purchased",
        checked: false,
        createdAt: new Date(),
      };

      const dto = toShoppingListItemDTO(item);
      expect(dto.checked).toBe(false);
    });
  });

  describe("toShoppingListDTO", () => {
    it("should convert ShoppingList to DTO", () => {
      const listId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const now = new Date("2025-01-15T10:30:00Z");

      const list: ShoppingList = {
        _id: listId,
        familyId,
        name: "Weekly Groceries",
        tags: ["fresh", "organic"],
        items: [
          {
            _id: new ObjectId(),
            name: "Milk",
            checked: false,
            createdAt: now,
          },
        ],
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      const dto = toShoppingListDTO(list);

      expect(dto._id).toBe(listId.toString());
      expect(dto.familyId).toBe(familyId.toString());
      expect(dto.name).toBe("Weekly Groceries");
      expect(dto.tags).toEqual(["fresh", "organic"]);
      expect(dto.createdBy).toBe(userId.toString());
      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].name).toBe("Milk");
    });

    it("should convert ObjectIds to strings", () => {
      const listId = new ObjectId("507f1f77bcf86cd799439011");
      const familyId = new ObjectId("507f1f77bcf86cd799439012");
      const userId = new ObjectId("507f1f77bcf86cd799439013");

      const list: ShoppingList = {
        _id: listId,
        familyId,
        name: "Test List",
        tags: [],
        items: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toShoppingListDTO(list);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(dto.familyId).toBe("507f1f77bcf86cd799439012");
      expect(dto.createdBy).toBe("507f1f77bcf86cd799439013");
      expect(typeof dto._id).toBe("string");
      expect(typeof dto.familyId).toBe("string");
      expect(typeof dto.createdBy).toBe("string");
    });

    it("should handle empty items array", () => {
      const list: ShoppingList = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Empty List",
        tags: [],
        items: [],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toShoppingListDTO(list);

      expect(dto.items).toEqual([]);
    });

    it("should handle multiple items", () => {
      const itemId1 = new ObjectId();
      const itemId2 = new ObjectId();

      const list: ShoppingList = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Multiple Items",
        tags: [],
        items: [
          {
            _id: itemId1,
            name: "Item 1",
            checked: true,
            createdAt: new Date(),
          },
          {
            _id: itemId2,
            name: "Item 2",
            checked: false,
            createdAt: new Date(),
          },
        ],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toShoppingListDTO(list);

      expect(dto.items).toHaveLength(2);
      expect(dto.items[0]._id).toBe(itemId1.toString());
      expect(dto.items[0].name).toBe("Item 1");
      expect(dto.items[0].checked).toBe(true);
      expect(dto.items[1]._id).toBe(itemId2.toString());
      expect(dto.items[1].name).toBe("Item 2");
      expect(dto.items[1].checked).toBe(false);
    });

    it("should handle multiple tags", () => {
      const list: ShoppingList = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Tagged List",
        tags: ["fresh", "organic", "local", "urgent"],
        items: [],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toShoppingListDTO(list);

      expect(dto.tags).toEqual(["fresh", "organic", "local", "urgent"]);
      expect(dto.tags).toHaveLength(4);
    });
  });
});
