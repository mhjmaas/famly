import type { ObjectId } from "mongodb";

// Entity interfaces
export interface ShoppingListItem {
  _id: ObjectId;
  name: string;
  checked: boolean;
  createdAt: Date;
}

export interface ShoppingList {
  _id: ObjectId;
  familyId: ObjectId;
  name: string;
  tags: string[];
  items: ShoppingListItem[];
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Input DTOs
export interface CreateShoppingListInput {
  name: string;
  tags?: string[];
  items?: Array<{ name: string }>;
}

export interface UpdateShoppingListInput {
  name?: string;
  tags?: string[];
}

export interface AddItemInput {
  name: string;
}

export interface UpdateItemInput {
  name?: string;
  checked?: boolean;
}

// Output DTOs
export interface ShoppingListItemDTO {
  _id: string;
  name: string;
  checked: boolean;
  createdAt: string;
}

export interface ShoppingListDTO {
  _id: string;
  familyId: string;
  name: string;
  tags: string[];
  items: ShoppingListItemDTO[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
