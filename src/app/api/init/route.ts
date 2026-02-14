import { NextResponse } from "next/server";
import { initializeApp } from "@/lib/init";

/**
 * POST /api/init
 * Initializes the application with default data if needed.
 * This is safe to call multiple times - it checks if initialization
 * has already been done before proceeding.
 */
export async function POST() {
  try {
    await initializeApp();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Initialization failed:", error);
    return NextResponse.json(
      { success: false, error: "Initialization failed" },
      { status: 500 }
    );
  }
}
