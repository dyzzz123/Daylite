import { NextRequest, NextResponse } from "next/server";
import {
  deleteFeedItemsBySource,
  deleteAllFeedItems,
  getFeedItemsCount
} from "@/lib/feed-service";

/**
 * POST /api/feeds/clean
 * Cleans up feed items by source or deletes all items
 * Body: { source?: string, deleteAll?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, deleteAll } = body;

    // Get count before deletion
    const beforeCount = await getFeedItemsCount();

    let deletedCount = 0;
    let message = "";

    if (deleteAll === true) {
      // Delete all feed items
      deletedCount = await deleteAllFeedItems();
      message = `已清空所有信息流（共 ${deletedCount} 条）`;
    } else if (source) {
      // Delete feed items from specific source
      deletedCount = await deleteFeedItemsBySource(source);
      message = `已删除 ${source} 的所有内容（共 ${deletedCount} 条）`;
    } else {
      return NextResponse.json(
        { error: "请指定要删除的来源或使用 deleteAll=true" },
        { status: 400 }
      );
    }

    // Get count after deletion
    const afterCount = await getFeedItemsCount();

    return NextResponse.json({
      success: true,
      message,
      deletedCount,
      beforeCount,
      afterCount,
    });
  } catch (error) {
    console.error("Clean API error:", error);
    return NextResponse.json(
      { error: "清理失败" },
      { status: 500 }
    );
  }
}
