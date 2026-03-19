import { NextRequest, NextResponse } from "next/server";

// 服务端代理获取 favicon，避免浏览器跨域和第三方服务访问问题
const FAVICON_SERVICES = [
  (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
  (domain: string) => `https://${domain}/favicon.ico`,
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return new NextResponse(null, { status: 400 });
  }

  // 依次尝试各个 favicon 服务
  for (const service of FAVICON_SERVICES) {
    try {
      const url = service(domain);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FaviconBot/1.0)",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "image/x-icon";
        // 过滤掉非图片响应（如 HTML 错误页面）
        if (contentType.includes("image") || contentType.includes("icon")) {
          const buffer = await response.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400", // 缓存 24 小时
            },
          });
        }
      }
    } catch {
      continue;
    }
  }

  // 所有服务都失败，返回 404
  return new NextResponse(null, { status: 404 });
}
