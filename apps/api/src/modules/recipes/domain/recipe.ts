import type { ObjectId } from "mongodb";

// Entity interfaces
export interface Recipe {
  _id: ObjectId;
  familyId: ObjectId;
  name: string;
  description: string;
  steps: string[];
  tags: string[];
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Input DTOs
export interface CreateRecipeInput {
  name: string;
  description: string;
  steps: string[];
  tags?: string[];
}

export interface UpdateRecipeInput {
  name?: string;
  description?: string;
  steps?: string[];
  tags?: string[];
}

// Output DTOs
export interface RecipeDTO {
  _id: string;
  familyId: string;
  name: string;
  description: string;
  steps: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
