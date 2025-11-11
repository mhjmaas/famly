"use client";

interface ClearSessionResponse {
  success: boolean;
  error?: string;
}

export async function clearSessionCookieClient() {
  try {
    const response = await fetch("/api/auth/clear-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = (await response.json()) as ClearSessionResponse;

    if (!data.success) {
      throw new Error(data.error || "Unknown error clearing session");
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to clear session cookie");
  }
}
