import { NextResponse } from 'next/server';
import { getSources, updateSource } from '@/lib/source-service';
import { getFaviconUrl } from '@/lib/favicon-fetcher';

/**
 * 为所有没有 favicon 的 RSS 源更新 favicon
 * GET /api/sources/update-favicons
 */
export async function GET() {
  try {
    const sources = await getSources();
    const rssSources = sources.filter(s => s.type === 'rss' && s.url && !s.faviconUrl);

    console.log(`[Update Favicons] 发现 ${rssSources.length} 个需要更新 favicon 的源`);

    const results: { name: string; faviconUrl: string | null; success: boolean }[] = [];

    for (const source of rssSources) {
      try {
        console.log(`[Update Favicons] 获取 ${source.name} 的 favicon...`);
        const faviconUrl = await getFaviconUrl(source.url!);

        if (faviconUrl) {
          await updateSource(source.id, { faviconUrl });
          console.log(`[Update Favicons] ✓ ${source.name}: ${faviconUrl}`);
          results.push({ name: source.name, faviconUrl, success: true });
        } else {
          console.log(`[Update Favicons] ✗ ${source.name}: 无法获取 favicon`);
          results.push({ name: source.name, faviconUrl: null, success: false });
        }
      } catch (error) {
        console.error(`[Update Favicons] ✗ ${source.name}:`, error);
        results.push({ name: source.name, faviconUrl: null, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `已更新 ${successCount}/${rssSources.length} 个源的 favicon`,
      results,
    });
  } catch (error) {
    console.error('[Update Favicons] 错误:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 手动触发更新（POST 请求）
 */
export async function POST() {
  return GET();
}
