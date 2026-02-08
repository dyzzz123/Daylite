import { NextRequest, NextResponse } from 'next/server';

/**
 * 代理 API 路由
 * 通过服务器端代理访问 RSS 源，避免 CORS 和地域限制
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  try {
    console.log(`[Proxy API] 请求 URL: ${url}`);

    // 使用 allorigins 代理
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      // Next.js edge runtime timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    console.log(`[Proxy API] 成功获取内容，长度: ${text.length}`);

    // 返回 RSS 内容
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Proxy API] 错误:', error);
    return NextResponse.json(
      {
        error: '获取 RSS 内容失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
