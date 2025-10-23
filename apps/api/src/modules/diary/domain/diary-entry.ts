import type { ObjectId } from "mongodb";

/**
 * DiaryEntry entity - represents a personal diary entry
 */
export interface DiaryEntry {
  _id: ObjectId;
  date: string; // Format: YYYY-MM-DD
  entry: string; // Journal text content
  isPersonal: boolean; // Always true for personal entries; future family entries may have false
  createdBy: ObjectId; // User who created the entry
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
