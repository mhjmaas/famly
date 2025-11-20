"use client";

import { useCallback } from "react";
import type { Locale } from "@/i18n/config";
import { updateProfile } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/user.slice";

/**
 * Persist the selected language for authenticated users.
 * Falls back silently if the request fails (to avoid blocking navigation).
 */
export function usePersistLanguage() {
  const dispatch = useAppDispatch();

  return useCallback(
    async (locale: Locale) => {
      try {
        const response = await updateProfile({ language: locale });
        if (response?.user) {
          dispatch(setUser(response.user));
        }
      } catch (_error) {
        // Non-blocking: ignore errors to keep navigation smooth
      }
    },
    [dispatch],
  );
}
