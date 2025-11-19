import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import type {
  CreateDiaryEntryInput,
  DiaryEntry,
  UpdateDiaryEntryInput,
} from "../domain/diary-entry";
import type { DiaryRepository } from "../repositories/diary.repository";

export class DiaryService {
  constructor(
    private diaryRepository: DiaryRepository,
    private activityEventService?: ActivityEventService,
  ) {}

  async createPersonalEntry(
    userId: string,
    input: CreateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating personal diary entry", {
        userId: normalizedUserId,
        date: input.date,
      });

      const entry = await this.diaryRepository.createEntry(
        toObjectId(normalizedUserId, "userId"),
        input,
      );

      await this.recordActivityEvent(
        normalizedUserId,
        "DIARY",
        `Diary entry for ${input.date}`,
        input.entry,
        "CREATED",
      );

      return entry;
    } catch (error) {
      logger.error("Failed to create personal diary entry", {
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  async listPersonalEntries(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DiaryEntry[]> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Listing personal diary entries", {
        userId: normalizedUserId,
        startDate,
        endDate,
      });

      return this.diaryRepository.findByCreatorInDateRange(
        toObjectId(normalizedUserId, "userId"),
        startDate,
        endDate,
      );
    } catch (error) {
      logger.error("Failed to list personal diary entries", {
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  async getPersonalEntry(entryId: string, userId: string): Promise<DiaryEntry> {
    const entry = await this.findPersonalEntry(entryId, userId);
    if (!entry) {
      throw HttpError.notFound("Diary entry not found");
    }
    return entry;
  }

  async updatePersonalEntry(
    entryId: string,
    userId: string,
    input: UpdateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    let normalizedEntryId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedEntryId = validateObjectId(entryId, "entryId");
      normalizedUserId = validateObjectId(userId, "userId");

      const existingEntry = await this.findPersonalEntry(
        normalizedEntryId,
        normalizedUserId,
      );

      if (!existingEntry) {
        throw HttpError.notFound("Diary entry not found");
      }

      const updatedEntry = await this.diaryRepository.updateEntry(
        toObjectId(normalizedEntryId, "entryId"),
        input,
      );

      if (!updatedEntry) {
        throw HttpError.notFound("Diary entry not found");
      }

      return updatedEntry;
    } catch (error) {
      logger.error("Failed to update personal diary entry", {
        entryId: normalizedEntryId ?? entryId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  async deletePersonalEntry(entryId: string, userId: string): Promise<void> {
    let normalizedEntryId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedEntryId = validateObjectId(entryId, "entryId");
      normalizedUserId = validateObjectId(userId, "userId");

      const existingEntry = await this.findPersonalEntry(
        normalizedEntryId,
        normalizedUserId,
      );

      if (!existingEntry) {
        throw HttpError.notFound("Diary entry not found");
      }

      const deleted = await this.diaryRepository.deleteEntry(
        toObjectId(normalizedEntryId, "entryId"),
      );

      if (!deleted) {
        throw HttpError.notFound("Diary entry not found");
      }
    } catch (error) {
      logger.error("Failed to delete personal diary entry", {
        entryId: normalizedEntryId ?? entryId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  async createFamilyEntry(
    familyId: string,
    userId: string,
    input: CreateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating family diary entry", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        date: input.date,
      });

      const entry = await this.diaryRepository.createFamilyEntry(
        toObjectId(normalizedUserId, "userId"),
        toObjectId(normalizedFamilyId, "familyId"),
        input,
      );

      await this.recordActivityEvent(
        normalizedUserId,
        "FAMILY_DIARY",
        `Family diary entry for ${input.date}`,
        input.entry,
        "CREATED",
      );

      return entry;
    } catch (error) {
      logger.error("Failed to create family diary entry", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  async listFamilyEntries(
    familyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DiaryEntry[]> {
    let normalizedFamilyId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");

      logger.debug("Listing family diary entries", {
        familyId: normalizedFamilyId,
        startDate,
        endDate,
      });

      return this.diaryRepository.findFamilyEntriesInDateRange(
        toObjectId(normalizedFamilyId, "familyId"),
        startDate,
        endDate,
      );
    } catch (error) {
      logger.error("Failed to list family diary entries", {
        familyId: normalizedFamilyId ?? familyId,
        error,
      });
      throw error;
    }
  }

  async getFamilyEntry(familyId: string, entryId: string): Promise<DiaryEntry> {
    const entry = await this.findFamilyEntry(familyId, entryId);
    if (!entry) {
      throw HttpError.notFound("Diary entry not found");
    }
    return entry;
  }

  async updateFamilyEntry(
    familyId: string,
    entryId: string,
    input: UpdateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    let normalizedEntryId: ObjectIdString | undefined;
    try {
      normalizedEntryId = validateObjectId(entryId, "entryId");
      const entry = await this.findFamilyEntry(familyId, normalizedEntryId);

      if (!entry) {
        throw HttpError.notFound("Diary entry not found");
      }

      const updatedEntry = await this.diaryRepository.updateEntry(
        toObjectId(normalizedEntryId, "entryId"),
        input,
      );

      if (!updatedEntry) {
        throw HttpError.notFound("Diary entry not found");
      }

      return updatedEntry;
    } catch (error) {
      logger.error("Failed to update family diary entry", {
        familyId,
        entryId: normalizedEntryId ?? entryId,
        error,
      });
      throw error;
    }
  }

  async deleteFamilyEntry(familyId: string, entryId: string): Promise<void> {
    let normalizedEntryId: ObjectIdString | undefined;
    try {
      normalizedEntryId = validateObjectId(entryId, "entryId");
      const entry = await this.findFamilyEntry(familyId, normalizedEntryId);

      if (!entry) {
        throw HttpError.notFound("Diary entry not found");
      }

      const deleted = await this.diaryRepository.deleteEntry(
        toObjectId(normalizedEntryId, "entryId"),
      );

      if (!deleted) {
        throw HttpError.notFound("Diary entry not found");
      }
    } catch (error) {
      logger.error("Failed to delete family diary entry", {
        familyId,
        entryId: normalizedEntryId ?? entryId,
        error,
      });
      throw error;
    }
  }

  async findEntryById(entryId: string): Promise<DiaryEntry | null> {
    const normalizedEntryId = validateObjectId(entryId, "entryId");
    return this.diaryRepository.findById(
      toObjectId(normalizedEntryId, "entryId"),
    );
  }

  private async findPersonalEntry(
    entryId: string,
    userId: string,
  ): Promise<DiaryEntry | null> {
    const normalizedEntryId = validateObjectId(entryId, "entryId");
    const normalizedUserId = validateObjectId(userId, "userId");

    const entry = await this.diaryRepository.findById(
      toObjectId(normalizedEntryId, "entryId"),
    );

    if (!entry) {
      return null;
    }

    if (
      entry.createdBy.toString() !== normalizedUserId ||
      entry.isPersonal === false
    ) {
      return null;
    }

    return entry;
  }

  private async findFamilyEntry(
    familyId: string,
    entryId: string,
  ): Promise<DiaryEntry | null> {
    const normalizedFamilyId = validateObjectId(familyId, "familyId");
    const normalizedEntryId = validateObjectId(entryId, "entryId");

    const entry = await this.diaryRepository.findById(
      toObjectId(normalizedEntryId, "entryId"),
    );

    if (!entry || !entry.familyId) {
      return null;
    }

    if (entry.familyId.toString() !== normalizedFamilyId || entry.isPersonal) {
      return null;
    }

    return entry;
  }

  private async recordActivityEvent(
    userId: ObjectIdString,
    type: "DIARY" | "FAMILY_DIARY",
    title: string,
    entryText: string,
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
        description: entryText.substring(0, 100),
        detail,
      });
    } catch (error) {
      logger.error("Failed to record diary activity event", {
        userId,
        type,
        error,
      });
    }
  }
}
