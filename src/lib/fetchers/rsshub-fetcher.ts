import Parser from 'rss-parser';
import type { FeedItem } from '@/types';
import { getFaviconUrl } from '@/lib/favicon-fetcher';

// RSSHub专用的fetcher，使用多种策略绕过反爬

const parser = new Parser({
  timeout: 60000, // RSSHub需要更长的超时时间
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  },
});

export interface RSSHubFetcherConfig {
  url: string;
  sourceName: string;
  icon?: string;
  faviconUrl?: string;  // 源已保存的 favicon
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
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  } else {
    return window.location.origin;
  }
}

/**
 * 可用的代理服务列表（按优先级排序）
 */
const PROXY_SERVICES = [
  {
    name: 'AllOrigins',
    getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'CORS Proxy',
    getUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    name: 'AllOrigins (backup)',
    getUrl: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&callback=`,
  },
];

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 尝试通过代理获取RSS内容
 */
async function fetchViaProxy(url: string, proxyService: typeof PROXY_SERVICES[0], attempt: number): Promise<string | null> {
  try {
    const proxyUrl = proxyService.getUrl(url);
    console.log(`[RSSHub Fetcher] 尝试 ${proxyService.name} (第${attempt}次): ${url}`);

    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(45000), // 45秒超时，给RSSHub更多时间
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      console.log(`[RSSHub Fetcher] ${proxyService.name} 返回 ${response.status}`);
      return null;
    }

    const text = await response.text();

    // 检查是否是有效的RSS内容
    if (!text || text.length < 100) {
      console.log(`[RSSHub Fetcher] ${proxyService.name} 返回内容过短`);
      return null;
    }

    // 检查是否是错误页面
    if (text.includes('<title>Just a moment...</title>') ||
        text.includes('Cloudflare') ||
        text.includes('Checking your browser') ||
        text.includes('challenge-platform')) {
      console.log(`[RSSHub Fetcher] ${proxyService.name} 遇到Cloudflare挑战`);
      return null;
    }

    // 检查是否包含RSS特征
    const hasRssContent = text.includes('<rss') ||
                         text.includes('<feed') ||
                         text.includes('<item>') ||
                         text.includes('<entry>');

    if (!hasRssContent) {
      console.log(`[RSSHub Fetcher] ${proxyService.name} 返回的不是RSS内容`);
      return null;
    }

    console.log(`[RSSHub Fetcher] ✓ ${proxyService.name} 成功获取内容 (${text.length} 字符)`);
    return text;
  } catch (error: any) {
    console.log(`[RSSHub Fetcher] ${proxyService.name} 失败:`, error.message);
    return null;
  }
}

/**
 * 获取RSSHub内容（使用多种策略和重试）
 */
async function fetchRSSHubContent(url: string): Promise<string> {
  console.log(`[RSSHub Fetcher] 开始获取 RSSHub 内容: ${url}`);

  // 尝试所有代理服务，每个最多重试2次
  for (const proxyService of PROXY_SERVICES) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const content = await fetchViaProxy(url, proxyService, attempt);

      if (content) {
        return content;
      }

      // 如果不是最后一次尝试，等待2秒再重试
      if (attempt < 2) {
        console.log(`[RSSHub Fetcher] 等待2秒后重试...`);
        await delay(2000);
      }
    }
  }

  throw new Error('所有代理服务均失败，无法获取RSSHub内容');
}

/**
 * 验证RSSHub URL
 */
export async function validateRSSHubUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`[RSSHub Fetcher] 验证 RSSHub URL: ${url}`);

    // 尝试获取内容
    const content = await fetchRSSHubContent(url);

    if (!content) {
      return { valid: false, error: '无法获取RSS内容' };
    }

    // 尝试解析
    const feed = await parser.parseString(content);

    if (!feed.title) {
      return { valid: false, error: 'RSS源无效' };
    }

    console.log(`[RSSHub Fetcher] ✓ RSSHub URL 验证成功: ${feed.title}`);
    return { valid: true };
  } catch (error: any) {
    console.error('[RSSHub Fetcher] 验证失败:', error);
    return { valid: false, error: error.message || '验证失败' };
  }
}

/**
 * 获取RSSHub元数据
 */
export async function getRSSHubMetadata(url: string): Promise<any | null> {
  try {
    console.log(`[RSSHub Fetcher] 获取 RSSHub 元数据: ${url}`);

    const content = await fetchRSSHubContent(url);
    const feed = await parser.parseString(content);

    return {
      title: feed.title || 'RSSHub 源',
      description: feed.description || '',
      link: feed.link || url,
    };
  } catch (error) {
    console.error('[RSSHub Fetcher] 获取元数据失败:', error);
    return null;
  }
}

/**
 * 获取RSSHub内容
 */
export async function fetchRSSHub(config: RSSHubFetcherConfig): Promise<FeedItem[]> {
  try {
    console.log(`[RSSHub Fetcher] 获取 RSSHub: ${config.url}`);

    const xmlContent = await fetchRSSHubContent(config.url);
    const feed = await parser.parseString(xmlContent);

    // 使用传入的 faviconUrl，如果没有则尝试获取
    let faviconUrl: string | undefined = config.faviconUrl;
    if (!faviconUrl) {
      try {
        faviconUrl = await getFaviconUrl(config.url) || undefined;
        console.log(`[RSSHub Fetcher] 获取到 favicon: ${faviconUrl}`);
      } catch (error) {
        console.log(`[RSSHub Fetcher] 无法获取 favicon，跳过`);
      }
    } else {
      console.log(`[RSSHub Fetcher] 使用已保存的 favicon: ${faviconUrl}`);
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

      // 处理不同的内容字段
      let content = '';
      if (item.content) {
        content = typeof item.content === 'string' ? item.content : String(item.content || '');
      } else if (item.summary) {
        content = item.summary;
      } else if (item['content:encoded']) {
        content = item['content:encoded'];
      }

      // 清理HTML标签
      const cleanContent = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      items.push({
        id: item.guid || item.link || `${config.url}-${item.title}`,
        title: item.title,
        summary: cleanContent || item.title,
        url: item.link || config.url,
        faviconUrl,
        sourceName: config.sourceName,
        source: 'rss',
        publishTime,
        read: false,
        tags: item.categories || [],
        createdAt: new Date(),
      });
    }

    console.log(`[RSSHub Fetcher] ✓ 成功获取 ${items.length} 篇文章`);
    return items;
  } catch (error) {
    console.error('[RSSHub Fetcher] 获取失败:', error);
    throw error;
  }
}
