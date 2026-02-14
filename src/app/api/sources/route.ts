import { NextRequest, NextResponse } from "next/server";
import { getSources, getEnabledSources, createSource } from "@/lib/source-service";
import type { CreateSourceRequest } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get("enabled") === "true";
    const sources = enabledOnly ? await getEnabledSources() : await getSources();
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSourceRequest = await request.json();
    // Provide default value for enabled if not specified
    const sourceData = {
      ...body,
      enabled: body.enabled ?? true,
    };
    const source = await createSource(sourceData);
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
