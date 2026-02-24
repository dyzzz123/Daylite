import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, eventName, properties, pageUrl } = body;

    // 验证必填字段
    if (!eventType || !eventName) {
      return NextResponse.json(
        { error: "eventType and eventName are required" },
        { status: 400 }
      );
    }

    // 生成事件 ID
    const eventId = generateId();
    const timestamp = new Date().toISOString();

    // 插入事件记录
    await db.execute({
      sql: `
        INSERT INTO analytics_events (id, sessionId, eventType, eventName, properties, pageUrl, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        eventId,
        sessionId || generateId(),
        eventType,
        eventName,
        properties ? JSON.stringify(properties) : null,
        pageUrl || null,
        timestamp,
      ],
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// 批量上报事件（减少请求次数）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "events array is required" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // 批量插入事件
    for (const event of events) {
      const { sessionId, eventType, eventName, properties, pageUrl } = event;

      if (!eventType || !eventName) continue;

      const eventId = generateId();

      await db.execute({
        sql: `
          INSERT INTO analytics_events (id, sessionId, eventType, eventName, properties, pageUrl, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          eventId,
          sessionId || generateId(),
          eventType,
          eventName,
          properties ? JSON.stringify(properties) : null,
          pageUrl || null,
          event.timestamp || timestamp,
        ],
      });
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error("Analytics batch track error:", error);
    return NextResponse.json(
      { error: "Failed to track events" },
      { status: 500 }
    );
  }
}
