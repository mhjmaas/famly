import { NextResponse } from "next/server";
import { clearInvalidSession } from "@/lib/auth-actions";

export async function POST() {
  try {
    await clearInvalidSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear invalid session via API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear session cookie" },
      { status: 500 },
    );
  }
}
