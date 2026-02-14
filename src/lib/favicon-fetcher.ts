/**
 * Favicon 获取工具
 * 从网站获取 favicon URL
 */

/**
 * 获取网站的 favicon URL
 * 优先级：
 * 1. Google Favicon Service（最可靠）
 * 2. DuckDuckGo Favicon Service
 * 3. 直接从域名获取 /favicon.ico
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
  try {
    // 从 URL 提取域名
    let domain: string;

    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } else {
      // 假设输入的是域名
      domain = url;
    }

    // 移除 www. 前缀（统一处理）
    const cleanDomain = domain.replace(/^www\./, '');

    console.log(`[Favicon Fetcher] 获取 favicon: ${cleanDomain}`);

    // 策略 1: 使用 Google Favicon Service（最快，最可靠）
    // 格式: https://www.google.com/s2/favicons?domain=example.com&sz=64
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;

    // 验证 Google 服务是否可用
    try {
      const response = await fetch(googleFaviconUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`[Favicon Fetcher] ✓ 使用 Google Favicon Service: ${googleFaviconUrl}`);
        return googleFaviconUrl;
      }
    } catch (error) {
      console.log(`[Favicon Fetcher] Google Service 不可用，尝试下一个策略`);
    }

    // 策略 2: 使用 DuckDuckGo Favicon Service
    // 格式: https://icons.duckduckgo.com/ip3/example.com.ico
    const ddgFaviconUrl = `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;

    try {
      const response = await fetch(ddgFaviconUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`[Favicon Fetcher] ✓ 使用 DuckDuckGo Favicon Service: ${ddgFaviconUrl}`);
        return ddgFaviconUrl;
      }
    } catch (error) {
      console.log(`[Favicon Fetcher] DuckDuckGo Service 不可用，尝试下一个策略`);
    }

    // 策略 3: 直接尝试从域名获取 favicon.ico
    const directFaviconUrl = `https://${cleanDomain}/favicon.ico`;

    try {
      const response = await fetch(directFaviconUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`[Favicon Fetcher] ✓ 使用直接 favicon.ico: ${directFaviconUrl}`);
        return directFaviconUrl;
      }
    } catch (error) {
      console.log(`[Favicon Fetcher] 直接 favicon.ico 不可用`);
    }

    // 所有策略都失败
    console.log(`[Favicon Fetcher] ✗ 无法获取 favicon: ${cleanDomain}`);
    return null;
  } catch (error) {
    console.error(`[Favicon Fetcher] 获取失败:`, error);
    return null;
  }
}

/**
 * 批量获取多个域名的 favicon
 */
export async function getFaviconsBatch(urls: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // 并行获取，限制并发数为 10
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      const favicon = await getFaviconUrl(url);
      return { url, favicon };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, favicon }) => {
      results.set(url, favicon);
    });
  }

  return results;
}
