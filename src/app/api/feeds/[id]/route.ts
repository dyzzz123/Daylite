import { NextRequest, NextResponse } from "next/server";
import { markAsRead, markAllAsRead, updateAISummary } from "@/lib/feed-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (id === "all") {
      await markAllAsRead();
      return NextResponse.json({ success: true });
    }
    await markAsRead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await updateAISummary(id, body.aiSummary);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update AI summary" }, { status: 500 });
  }
}
