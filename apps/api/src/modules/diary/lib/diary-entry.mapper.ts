import type { DiaryEntry, DiaryEntryDTO } from "../domain/diary-entry";

/**
 * Converts a DiaryEntry entity to a DiaryEntryDTO for API responses
 * Converts all ObjectId fields to strings
 */
export function toDiaryEntryDTO(entry: DiaryEntry): DiaryEntryDTO {
  return {
    _id: entry._id.toString(),
    date: entry.date,
    entry: entry.entry,
    isPersonal: entry.isPersonal,
    createdBy: entry.createdBy.toString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
