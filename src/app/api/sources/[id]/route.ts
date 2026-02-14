import { NextRequest, NextResponse } from "next/server";
import { updateSource, deleteSource, toggleSourceEnabled } from "@/lib/source-service";
import type { UpdateSourceRequest } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: UpdateSourceRequest = await request.json();
    const source = await updateSource(id, body);
    return NextResponse.json({ source });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteSource(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    if (body.action === "toggle") {
      const source = await toggleSourceEnabled(id);
      return NextResponse.json({ source });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to patch source" }, { status: 500 });
  }
}
