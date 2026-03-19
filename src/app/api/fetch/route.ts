import { NextRequest, NextResponse } from "next/server";
import { fetchAllSources, fetchAllSourcesStreaming } from "@/lib/fetch-scheduler";

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

// SSE 流式抓取，每个源完成后立即推送
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await fetchAllSourcesStreaming((result) => {
          send({ type: 'source_done', ...result });
        });
        send({ type: 'done' });
      } catch (error) {
        send({ type: 'error', message: 'Fetch failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
