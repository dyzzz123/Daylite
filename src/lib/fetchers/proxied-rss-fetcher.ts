import Parser from 'rss-parser';
import type { FeedItem } from '@/types';

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
  useProxy?: boolean;
}

/**
 * 使用代理获取 RSS（适合国内源）
 */
export async function fetchRSSWithProxy(config: RSSFetcherConfig): Promise<FeedItem[]> {
  try {
    console.log(`[Proxied RSS Fetcher] 获取 ${config.url} (使用代理)`);

    // 使用本地代理 API
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(config.url)}`;

    const feed = await parser.parseURL(proxyUrl);

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
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    await parser.parseURL(proxyUrl);
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
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const feed = await parser.parseURL(proxyUrl);

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
