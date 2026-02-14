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

  // 常见的浏览器 User-Agent
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  try {
    console.log(`[Proxy API] 请求 URL: ${url}`);

    let text = '';
    let lastError: Error | null = null;

    // 策略 1: 直接请求，带上浏览器 User-Agent（优先）
    for (const userAgent of USER_AGENTS) {
      try {
        console.log(`[Proxy API] 尝试直接请求 (User-Agent: ${userAgent.substring(0, 50)}...)`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          text = await response.text();
          console.log(`[Proxy API] 直接请求成功，长度: ${text.length}`);

          // 返回 RSS 内容
          return new NextResponse(text, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } else {
          console.log(`[Proxy API] 直接请求返回 ${response.status}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`[Proxy API] 直接请求失败:`, (error as Error).message);
        lastError = error as Error;
      }
    }

    // 策略 2: 使用 AllOrigins 代理（作为后备）
    console.log(`[Proxy API] 直接请求失败，尝试 AllOrigins 代理`);
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(35000),
      });

      if (response.ok) {
        text = await response.text();
        console.log(`[Proxy API] AllOrigins 代理成功，长度: ${text.length}`);

        // 返回 RSS 内容
        return new NextResponse(text, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (error) {
      console.log(`[Proxy API] AllOrigins 代理也失败:`, (error as Error).message);
    }

    // 所有策略都失败
    throw lastError || new Error('所有获取方式均失败');
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
