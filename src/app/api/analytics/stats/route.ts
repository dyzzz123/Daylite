import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取总事件数
    const totalEventsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM analytics_events WHERE timestamp >= ?`,
      args: [startDate.toISOString()],
    });

    // 按事件类型分组统计
    const eventsByTypeResult = await db.execute({
      sql: `
        SELECT eventType, COUNT(*) as count
        FROM analytics_events
        WHERE timestamp >= ?
        GROUP BY eventType
        ORDER BY count DESC
      `,
      args: [startDate.toISOString()],
    });

    // 按事件名称分组统计（Top 20）
    const topEventsResult = await db.execute({
      sql: `
        SELECT eventName, COUNT(*) as count
        FROM analytics_events
        WHERE timestamp >= ?
        GROUP BY eventName
        ORDER BY count DESC
        LIMIT 20
      `,
      args: [startDate.toISOString()],
    });

    // 按日期统计每日事件数
    const dailyEventsResult = await db.execute({
      sql: `
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM analytics_events
        WHERE timestamp >= ?
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `,
      args: [startDate.toISOString()],
    });

    // 唯一会话数
    const uniqueSessionsResult = await db.execute({
      sql: `SELECT COUNT(DISTINCT sessionId) as count FROM analytics_events WHERE timestamp >= ?`,
      args: [startDate.toISOString()],
    });

    // 最近的事件（最新 50 条）
    const recentEventsResult = await db.execute({
      sql: `
        SELECT eventName, eventType, properties, pageUrl, timestamp
        FROM analytics_events
        ORDER BY timestamp DESC
        LIMIT 50
      `,
    });

    return NextResponse.json({
      totalEvents: totalEventsResult.rows[0]?.count || 0,
      uniqueSessions: uniqueSessionsResult.rows[0]?.count || 0,
      eventsByType: eventsByTypeResult.rows,
      topEvents: topEventsResult.rows,
      dailyEvents: dailyEventsResult.rows,
      recentEvents: recentEventsResult.rows.map((row: any) => ({
        ...row,
        properties: row.properties ? JSON.parse(row.properties) : null,
      })),
    });
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics stats" },
      { status: 500 }
    );
  }
}
