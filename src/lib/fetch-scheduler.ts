import { getEnabledSources, updateSource } from './source-service';
import { createFeedItems } from './feed-service';
import { fetchRSS as fetchRSSDirect } from './fetchers/rss-fetcher';
import { fetchRSSWithProxy } from './fetchers/proxied-rss-fetcher';
import { fetchRSSHub } from './fetchers/rsshub-fetcher';
import { fetchZhihuHot } from './fetchers/zhihu-fetcher';
import { fetchWeiboHot } from './fetchers/weibo-fetcher';
import { fetchXiaohongshu } from './fetchers/xiaohongshu-fetcher';
import { getFaviconUrl } from './favicon-fetcher';
import type { FeedItem, FeedSource } from '@/types';

/**
 * 确保源有 faviconUrl，如果没有则获取并保存
 */
async function ensureSourceFavicon(source: FeedSource): Promise<string | undefined> {
  // 如果已有 faviconUrl，直接返回
  if (source.faviconUrl) {
    return source.faviconUrl;
  }

  // 只有 RSS 源且有 URL 的情况才获取 favicon
  if (source.type !== 'rss' || !source.url) {
    return undefined;
  }

  try {
    console.log(`[Fetch Scheduler] 获取 ${source.name} 的 favicon...`);
    const faviconUrl = await getFaviconUrl(source.url);
    if (faviconUrl) {
      // 保存到源配置
      await updateSource(source.id, { faviconUrl });
      console.log(`[Fetch Scheduler] ✓ 已保存 ${source.name} 的 favicon: ${faviconUrl}`);
      return faviconUrl;
    }
  } catch (error) {
    console.log(`[Fetch Scheduler] 无法获取 ${source.name} 的 favicon`);
  }

  return undefined;
}

// Fetch all enabled sources
export async function fetchAllSources(): Promise<{
  success: number;
  failed: number;
  totalItems: number;
}> {
  const sources = await getEnabledSources();

  console.log(`[Fetch Scheduler] 开始并行爬取 ${sources.length} 个信息源`);
  const startTime = Date.now();

  // 并行爬取所有源
  const fetchPromises = sources.map(async (source) => {
    try {
      let items: FeedItem[] = [];

      switch (source.type) {
        case 'rss':
          if (source.url) {
            // 确保 favicon 存在
            const faviconUrl = await ensureSourceFavicon(source);

            // 检测是否是 RSSHub 链接
            const isRsshubUrl = source.url.includes('rsshub.app') ||
                               source.url.includes('rsshub.') ||
                               source.url.includes('rss.forever');

            if (isRsshubUrl) {
              // 使用专门的 RSSHub fetcher
              console.log(`[Fetch Scheduler] 检测到 RSSHub 源: ${source.name}`);
              items = await fetchRSSHub({
                url: source.url,
                sourceName: source.name,
                icon: source.icon,
                faviconUrl,
              });
            } else {
              // 普通 RSS 源，优先使用代理获取（适合国内源）
              try {
                console.log(`[Fetch Scheduler] 尝试使用代理获取 ${source.name}`);
                items = await fetchRSSWithProxy({
                  url: source.url,
                  sourceName: source.name,
                  icon: source.icon,
                  faviconUrl,
                  useProxy: true,
                });
              } catch (proxyError) {
                console.log(`[Fetch Scheduler] 代理失败，尝试直接连接 ${source.name}`);
                // 代理失败，尝试直接连接
                items = await fetchRSSDirect({
                  url: source.url,
                  sourceName: source.name,
                  icon: source.icon,
                  faviconUrl,
                });
              }
            }
          }
          break;

        case 'zhihu':
          items = await fetchZhihuHot({ limit: 50 });
          break;

        case 'xiaohongshu':
          items = await fetchXiaohongshu({
            limit: 30,
            category: source.config?.category || 'all',
          });
          break;

        case 'weibo':
          items = await fetchWeiboHot({ limit: 50 });
          break;

        case 'forum':
          // TODO: Implement forum fetcher
          console.log(`Forum fetcher not implemented yet for ${source.name}`);
          break;

        default:
          console.log(`Unknown source type: ${source.type}`);
      }

      // 保存到数据库
      if (items.length > 0) {
        await createFeedItems(items);
        console.log(`✓ ${source.name}: ${items.length} 篇文章`);
        return { success: true, count: items.length, source: source.name };
      } else {
        console.log(`✗ ${source.name}: 无内容`);
        return { success: false, count: 0, source: source.name };
      }
    } catch (error) {
      console.error(`✗ ${source.name}: 失败`, error);
      return { success: false, count: 0, source: source.name, error };
    }
  });

  // 等待所有爬取完成
  const results = await Promise.all(fetchPromises);

  // 统计结果
  let successCount = 0;
  let failedCount = 0;
  let totalItems = 0;

  for (const result of results) {
    if (result.success) {
      successCount++;
      totalItems += result.count;
    } else {
      failedCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[Fetch Scheduler] 完成: ${successCount} 成功, ${failedCount} 失败, ${totalItems} 篇文章 (耗时 ${elapsed}s)`
  );

  return {
    success: successCount,
    failed: failedCount,
    totalItems,
  };
}

// Fetch a specific source by ID
export async function fetchSourceById(sourceId: string): Promise<number> {
  const { getSourceById } = await import('./source-service');
  const source = await getSourceById(sourceId);

  if (!source) {
    throw new Error(`Source with id ${sourceId} not found`);
  }

  if (!source.enabled) {
    throw new Error(`Source ${source.name} is disabled`);
  }

  let items: FeedItem[] = [];

  switch (source.type) {
    case 'rss':
      if (source.url) {
        // 确保 favicon 存在
        const faviconUrl = await ensureSourceFavicon(source);

        // 检测是否是 RSSHub 链接
        const isRsshubUrl = source.url.includes('rsshub.app') ||
                           source.url.includes('rsshub.') ||
                           source.url.includes('rss.forever');

        if (isRsshubUrl) {
          // 使用专门的 RSSHub fetcher
          console.log(`[Fetch Source] 检测到 RSSHub 源: ${source.name}`);
          items = await fetchRSSHub({
            url: source.url,
            sourceName: source.name,
            icon: source.icon,
            faviconUrl,
          });
        } else {
          // 普通 RSS 源，优先使用代理获取（适合国内源）
          try {
            console.log(`[Fetch Source] 尝试使用代理获取 ${source.name}`);
            items = await fetchRSSWithProxy({
              url: source.url,
              sourceName: source.name,
              icon: source.icon,
              faviconUrl,
              useProxy: true,
            });
          } catch (proxyError) {
            console.log(`[Fetch Source] 代理失败，尝试直接连接 ${source.name}:`, proxyError);
            // 代理失败，尝试直接连接
            items = await fetchRSSDirect({
              url: source.url,
              sourceName: source.name,
              icon: source.icon,
              faviconUrl,
            });
          }
        }
      }
      break;

    case 'zhihu':
      items = await fetchZhihuHot({ limit: 50 });
      break;

    case 'xiaohongshu':
      items = await fetchXiaohongshu({
        limit: 30,
        category: source.config?.category || 'all',
      });
      break;

    case 'weibo':
      items = await fetchWeiboHot({ limit: 50 });
      break;

    case 'forum':
      // TODO: Implement forum fetcher
      throw new Error('Forum fetcher not implemented yet');

    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }

  if (items.length > 0) {
    await createFeedItems(items);
  }

  return items.length;
}

// Fetch sources by type
export async function fetchSourcesByType(type: string): Promise<number> {
  const { getSourcesByType } = await import('./source-service');
  const sources = await getSourcesByType(type as any);

  let totalItems = 0;

  for (const source of sources) {
    if (!source.enabled) continue;

    try {
      const itemCount = await fetchSourceById(source.id);
      totalItems += itemCount;
    } catch (error) {
      console.error(`Failed to fetch source ${source.name}:`, error);
    }
  }

  return totalItems;
}

// Schedule fetch with retry logic
export async function scheduledFetch(maxRetries: number = 3): Promise<void> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      await fetchAllSources();
      return; // Success
    } catch (error) {
      lastError = error as Error;
      attempt++;
      console.error(`Fetch attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Failed to fetch after ${maxRetries} attempts: ${lastError?.message}`);
}
