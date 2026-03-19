/**
 * Favicon utility functions
 * 通过服务端代理获取 favicon，避免跨域和第三方服务访问问题
 */

/**
 * Extract domain from URL
 * Example: https://36kr.com/feed -> 36kr.com
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * 获取网站 Favicon URL
 * 使用本地代理路由，服务端负责实际获取
 *
 * @param feedUrl - RSS 订阅链接
 * @param siteUrl - 网站首页链接（可选，来自 RSS metadata.link）
 * @returns Favicon URL 或 null
 */
export function getFaviconUrl(
  feedUrl: string,
  siteUrl?: string
): string | null {
  const targetUrl = siteUrl || feedUrl;
  const domain = extractDomain(targetUrl);

  if (!domain) {
    return null;
  }

  // 使用本地代理路由，避免浏览器直接访问第三方服务
  return `/api/favicon?domain=${domain}`;
}

/**
 * 获��备用 Favicon URL 列表（本地代理不需要备用）
 */
export function getFaviconFallbackUrls(
  feedUrl: string,
  siteUrl?: string
): string[] {
  return [];
}
