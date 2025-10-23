import type { ObjectId } from "mongodb";

/**
 * DiaryEntry entity - represents a personal or family diary entry
 */
export interface DiaryEntry {
  _id: ObjectId;
  date: string; // Format: YYYY-MM-DD
  entry: string; // Journal text content
  isPersonal: boolean; // true for personal entries (/v1/diary), false for family entries (/v1/families/{familyId}/diary)
  createdBy: ObjectId; // User who created the entry
  familyId?: ObjectId; // Family ID for family entries (only present when isPersonal is false)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input DTO for creating a diary entry
 */
export interface CreateDiaryEntryInput {
  date: string; // Format: YYYY-MM-DD
  entry: string; // Min 1 char, max 10,000 chars
}

/**
 * Input DTO for updating a diary entry
 */
export interface UpdateDiaryEntryInput {
  date?: string; // Format: YYYY-MM-DD
  entry?: string; // Max 10,000 chars
}

/**
 * Output DTO for diary entry API responses
 * All ObjectId fields are converted to strings
 */
export interface DiaryEntryDTO {
  _id: string;
  date: string;
  entry: string;
  isPersonal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
