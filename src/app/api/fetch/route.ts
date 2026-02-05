import { NextRequest, NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/fetch-scheduler";

export async function POST(request: NextRequest) {
  try {
    const result = await fetchAllSources();
    return NextResponse.json({
      success: true,
      fetchedCount: result.totalItems,
      sourcesSucceeded: result.success,
      sourcesFailed: result.failed,
    });
  } catch (error) {
    console.error("Fetch POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sources" }, { status: 500 });
  }
}
