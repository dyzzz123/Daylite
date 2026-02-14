import { NextRequest, NextResponse } from "next/server";
import { getDailyReports, getThisWeekReports, getThisMonthReports } from "@/lib/report-service";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "recent";
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    let reports;
    switch (range) {
      case "week": reports = await getThisWeekReports(); break;
      case "month": reports = await getThisMonthReports(); break;
      default: reports = await getDailyReports(limit);
    }
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
