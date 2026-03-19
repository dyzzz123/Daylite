import { fetchRSS } from './rss-fetcher';
import type { FeedItemInput } from '@/types';

export interface BlogFetcherConfig {
  blogUrl: string;
  sourceName: string;
  icon?: string;
}

/**
 * 自动发现博客的 RSS Feed
 * 尝试常见��� RSS 路径
 */
async function discoverBlogFeed(blogUrl: string): Promise<string | null> {
  let url: URL;

  try {
    url = new URL(blogUrl);
  } catch {
    // 如果提供的 URL 不完整，尝试添加 https://
    if (!blogUrl.startsWith('http://') && !blogUrl.startsWith('https://')) {
      try {
        url = new URL(`https://${blogUrl}`);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  // 常见的 RSS feed 路径
  const possiblePaths = [
    '/rss',
    '/feed',
    '/atom.xml',
    '/rss.xml',
    '/feed.xml',
    '/blog/rss',         // 某些博客的 RSS 在 /blog 下
    '/index.xml',        // Typecho 默认 RSS
  ];

  // 针对不同平台的特殊路径
  const hostname = url.hostname.toLowerCase();

  if (hostname.includes('cnblogs.com')) {
    // CNBlogs: 保留作者路径，如 https://www.cnblogs.com/dddy/rss
    // 从原始路径提取作者部分
    const pathMatch = url.pathname.match(/^\/([^\/]+)/);
    if (pathMatch) {
      const authorPath = pathMatch[1]; // 如 'dddy'
      possiblePaths.unshift(`/${authorPath}/rss`);
      possiblePaths.unshift(`/${authorPath}/rss/`);
    }
    // 也尝试站点级 RSS（作为后备）
    possiblePaths.push('/rss');
  } else if (hostname.includes('juejin.cn')) {
    // 掘金: 需要特殊处理，暂时跳过
    possiblePaths.unshift('/articles/rss');
  } else if (hostname.includes('zhuanlan.zhihu.com')) {
    // 知乎专栏: 暂时跳过，需要特殊处理
    return null;
  }

  for (const path of possiblePaths) {
    const feedUrl = `${url.origin}${path}`;
    try {
      const response = await fetch(feedUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`[Blog Fetcher] 发现 RSS feed: ${feedUrl}`);
        return feedUrl;
      }
    } catch {
      // 继续尝试下一个路径
      continue;
    }
  }

  console.log(`[Blog Fetcher] 未发现 RSS feed: ${blogUrl}`);
  return null;
}

/**
 * 抓取博客内容（通过 RSS 自动发现）
 */
export async function fetchBlog(config: BlogFetcherConfig): Promise<FeedItemInput[]> {
  try {
    console.log(`[Blog Fetcher] 开始抓取博客: ${config.blogUrl}`);

    // 1. 尝试自动发现 RSS feed
    const feedUrl = await discoverBlogFeed(config.blogUrl);

    if (feedUrl) {
      // 2. 使用现有 RSS fetcher 抓取
      console.log(`[Blog Fetcher] 使用 RSS feed 抓取: ${feedUrl}`);
      const items = await fetchRSS({
        url: feedUrl,
        sourceName: config.sourceName,
        icon: config.icon || '📝',
      });

      // 3. 将 source 从 'rss' 改为 'blog'
      return items.map(item => ({
        ...item,
        source: 'blog' as const,
      }));
    }

    // 4. 如果没有发现 RSS，返回空数组
    console.log(`[Blog Fetcher] 无法抓取博客内容，未发现 RSS feed`);
    return [];
  } catch (error) {
    console.error(`[Blog Fetcher] 抓取失败:`, error);
    return [];
  }
}

/**
 * 验证博客 URL
 * 检查博客是否可访问，并尝试发现 RSS feed
 */
export async function validateBlogUrl(blogUrl: string): Promise<{
  valid: boolean;
  error?: string;
  feedUrl?: string;
}> {
  try {
    // 规范化 URL
    let normalizedUrl = blogUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // 验证 URL 格式
    new URL(normalizedUrl);

    // 尝试发现 RSS feed
    const feedUrl = await discoverBlogFeed(normalizedUrl);

    if (feedUrl) {
      return {
        valid: true,
        feedUrl,
      };
    }

    return {
      valid: false,
      error: '未发现 RSS feed，该博客可能不支持订阅',
    };
  } catch (error) {
    return {
      valid: false,
      error: '无效的博客 URL',
    };
  }
}

/**
 * 获取博客元数据
 */
export async function getBlogMetadata(blogUrl: string): Promise<{
  title?: string;
  description?: string;
  link?: string;
  icon?: string;
} | null> {
  try {
    const feedUrl = await discoverBlogFeed(blogUrl);

    if (!feedUrl) {
      return null;
    }

    // 使用 RSS metadata 获取
    const { getRSSMetadata } = await import('./rss-fetcher');
    return await getRSSMetadata(feedUrl);
  } catch (error) {
    console.error(`[Blog Fetcher] 获取元数据失败:`, error);
    return null;
  }
}
