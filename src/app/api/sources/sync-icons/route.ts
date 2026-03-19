import { NextResponse } from "next/server";
import { getSources, updateSource } from "@/lib/source-service";
import { getFaviconUrl } from "@/lib/favicon";

/**
 * POST /api/sources/sync-icons
 * Sync all sources' icons by fetching favicons from their URLs
 * Useful for updating existing sources to use favicons instead of emoji
 */
export async function POST() {
  try {
    const sources = await getSources();
    const results = [];

    for (const source of sources) {
      if (source.url) {
        const faviconUrl = getFaviconUrl(source.url);
        if (faviconUrl) {
          await updateSource(source.id, { icon: faviconUrl });
          results.push({
            id: source.id,
            name: source.name,
            icon: faviconUrl
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      sources: results
    });
  } catch (error) {
    console.error("Failed to sync icons:", error);
    return NextResponse.json(
      { error: "Failed to sync icons" },
      { status: 500 }
    );
  }
}
