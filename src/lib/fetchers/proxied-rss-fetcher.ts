import Parser from 'rss-parser';
import type { FeedItem } from '@/types';
import { getFaviconUrl } from '@/lib/favicon-fetcher';

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

export interface RSSFetcherConfig {
  url: string;
  sourceName: string;
  icon?: string;
  faviconUrl?: string;  // 源已保存的 favicon
  useProxy?: boolean;
}

/**
 * 检测是否在服务端运行
 */
function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * 获取站点基础 URL
 */
function getBaseUrl(): string {
  if (isServerSide()) {
    // 服务端：使用环境变量或 localhost
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  } else {
    // 客户端：使用当前页面的 origin
    return window.location.origin;
  }
}

/**
 * 使用代理获取 RSS 内容
 */
async function fetchRSSContent(url: string): Promise<string> {
  // 常见的浏览器 User-Agent
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  let lastError: Error | null = null;

  // 策略 1: 直接请求，带上浏览器 User-Agent（优先）
  for (const userAgent of USER_AGENTS) {
    try {
      console.log(`[Proxied RSS] 尝试直接请求 (User-Agent: ${userAgent.substring(0, 50)}...)`);

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
        const text = await response.text();
        console.log(`[Proxied RSS] 直接请求成功，长度: ${text.length}`);
        return text;
      } else {
        console.log(`[Proxied RSS] 直接请求返回 ${response.status}`);
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`[Proxied RSS] 直接请求失败:`, (error as Error).message);
      lastError = error as Error;
    }
  }

  // 策略 2: 客户端使用本地代理 API
  if (!isServerSide()) {
    const baseUrl = getBaseUrl();
    const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}`;
    console.log(`[Proxied RSS] 尝试本地代理 API: ${url}`);

    try {
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(35000),
      });

      if (response.ok) {
        const text = await response.text();
        console.log(`[Proxied RSS] 本地代理成功，长度: ${text.length}`);
        return text;
      }
    } catch (error) {
      console.log(`[Proxied RSS] 本地代理失败:`, (error as Error).message);
      lastError = error as Error;
    }
  }

  // 策略 3: 使用 AllOrigins 代理（作为后备）
  console.log(`[Proxied RSS] 尝试 AllOrigins 代理`);
  try {
    const alloriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(alloriginsUrl, {
      signal: AbortSignal.timeout(35000),
    });

    if (response.ok) {
      const text = await response.text();
      console.log(`[Proxied RSS] AllOrigins 代理成功，长度: ${text.length}`);
      return text;
    }
  } catch (error) {
    console.log(`[Proxied RSS] AllOrigins 代理失败:`, (error as Error).message);
    lastError = error as Error;
  }

  // 所有策略都失败
  throw lastError || new Error('所有获取方式均失败');
}

/**
 * 使用代理获取 RSS（适合国内源）
 */
export async function fetchRSSWithProxy(config: RSSFetcherConfig): Promise<FeedItem[]> {
  try {
    console.log(`[Proxied RSS Fetcher] 获取 ${config.url} (使用代理)`);

    // 获取 RSS 内容
    const xmlContent = await fetchRSSContent(config.url);

    // 解析 RSS 内容
    const feed = await parser.parseString(xmlContent);

    // 使用传入的 faviconUrl，如果没有则尝试获取
    let faviconUrl: string | undefined = config.faviconUrl;
    if (!faviconUrl) {
      try {
        faviconUrl = await getFaviconUrl(config.url) || undefined;
        console.log(`[Proxied RSS Fetcher] 获取到 favicon: ${faviconUrl}`);
      } catch (error) {
        console.log(`[Proxied RSS Fetcher] 无法获取 favicon，跳过`);
      }
    } else {
      console.log(`[Proxied RSS Fetcher] 使用已保存的 favicon: ${faviconUrl}`);
    }

    const items: FeedItem[] = [];

    for (const item of feed.items) {
      if (!item.title) continue;

      let publishTime = new Date();
      if (item.pubDate) {
        publishTime = new Date(item.pubDate);
      } else if (item.isoDate) {
        publishTime = new Date(item.isoDate);
      }

      let summary = '';
      if (item.contentSnippet) {
        summary = item.contentSnippet.substring(0, 300);
      } else if (item.content) {
        summary = item.content.replace(/<[^>]*>/g, '').substring(0, 300);
      } else if (item.summary) {
        summary = item.summary.substring(0, 300);
      }

      const tags: string[] = [];
      if (item.categories) {
        tags.push(...item.categories);
      }

      items.push({
        id: '',
        source: 'rss',
        sourceName: config.sourceName,
        title: item.title,
        summary: summary || item.title,
        url: item.link,
        faviconUrl,
        publishTime,
        read: false,
        tags: tags.length > 0 ? tags : undefined,
        createdAt: new Date(),
      });
    }

    console.log(`[Proxied RSS Fetcher] 成功获取 ${items.length} 篇文章`);
    return items;
  } catch (error) {
    console.error(`[Proxied RSS Fetcher] 失败:`, (error as Error).message);
    throw error;
  }
}

/**
 * 验证 RSS URL（使用代理）
 */
export async function validateRSSUrlWithProxy(url: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const xmlContent = await fetchRSSContent(url);
    await parser.parseString(xmlContent);
    console.log(`[Proxied RSS Validator] 验证成功: ${url}`);
    return { valid: true };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`[Proxied RSS Validator] 验证失败:`, errorMsg);

    if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('timeout')) {
      return { valid: false, error: '连接超时，请稍后重试' };
    } else if (errorMsg.includes('ENOTFOUND')) {
      return { valid: false, error: '无法解析域名，请检查URL' };
    } else if (errorMsg.includes('404')) {
      return { valid: false, error: 'RSS源不存在(404)' };
    } else if (errorMsg.includes('parse') || errorMsg.includes('XML')) {
      return { valid: false, error: 'RSS格式错误' };
    }

    return { valid: false, error: `无法解析RSS源: ${errorMsg}` };
  }
}

/**
 * 获取 RSS 元数据（使用代理）
 */
export async function getRSSMetadataWithProxy(url: string): Promise<{
  title?: string;
  description?: string;
  link?: string;
} | null> {
  try {
    const xmlContent = await fetchRSSContent(url);
    const feed = await parser.parseString(xmlContent);

    return {
      title: feed.title,
      description: feed.description,
      link: feed.link,
    };
  } catch (error) {
    console.error(`[Proxied RSS Metadata] 失败:`, (error as Error).message);
    return null;
  }
}
