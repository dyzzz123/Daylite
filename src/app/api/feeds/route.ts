import { NextRequest, NextResponse } from "next/server";
import { getFeedItems, getFeedItemsCount } from "@/lib/feed-service";
import type { GetFeedsResponse, SourceType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get('source');
    const source: SourceType | undefined = (sourceParam as SourceType) || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const items = await getFeedItems({ source, unreadOnly, limit, offset });
    const total = await getFeedItemsCount({ source, unreadOnly });
    const unreadCount = await getFeedItemsCount({ unreadOnly: true });

    const response: GetFeedsResponse = { items, total, unreadCount };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Feeds GET error:", error);
    return NextResponse.json({ error: "Failed to fetch feeds" }, { status: 500 });
  }
}
