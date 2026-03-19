import { getEnabledSources } from './source-service';
import { createFeedItems } from './feed-service';
import { fetchRSS as fetchRSSDirect } from './fetchers/rss-fetcher';
import { fetchRSSWithProxy } from './fetchers/proxied-rss-fetcher';
import { fetchZhihuHot } from './fetchers/zhihu-fetcher';
import { fetchWeiboHot } from './fetchers/weibo-fetcher';
import { fetchXiaohongshu } from './fetchers/xiaohongshu-fetcher';
import { fetchBlog } from './fetchers/blog-fetcher';
import type { FeedItem, FeedItemInput } from '@/types';

// Fetch all enabled sources
export async function fetchAllSources(): Promise<{
  success: number;
  failed: number;
  totalItems: number;
}> {
  const sources = await getEnabledSources();
  let successCount = 0;
  let failedCount = 0;
  let totalItems = 0;

  console.log(`Starting fetch for ${sources.length} enabled sources`);

  for (const source of sources) {
    try {
      let items: FeedItemInput[] = [];

      switch (source.type) {
        case 'rss':
          if (source.url) {
            // 优先使用代理获取 RSS（适合国内源）
            try {
              console.log(`[Fetch Scheduler] 尝试使用代理获取 ${source.name}`);
              items = await fetchRSSWithProxy({
                url: source.url,
                sourceName: source.name,
                icon: source.icon,
                useProxy: true,
              });
            } catch (proxyError) {
              console.log(`[Fetch Scheduler] 代理失败，尝试直接连接 ${source.name}:`, proxyError);
              // 代理失败，尝试直接连接
              items = await fetchRSSDirect({
                url: source.url,
                sourceName: source.name,
                icon: source.icon,
              });
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

        case 'blog':
          if (source.url) {
            items = await fetchBlog({
              blogUrl: source.url,
              sourceName: source.name,
              icon: source.icon,
            });
          }
          break;

        case 'forum':
          // TODO: Implement forum fetcher
          console.log(`Forum fetcher not implemented yet for ${source.name}`);
          break;

        default:
          console.log(`Unknown source type: ${source.type}`);
      }

      if (items.length > 0) {
        // Add sourceId to each item before creating
        const itemsWithSourceId = items.map(item => ({
          ...item,
          sourceId: source.id,
        }));
        await createFeedItems(itemsWithSourceId);
        successCount++;
        totalItems += items.length;
        console.log(`✓ Fetched ${items.length} items from ${source.name}`);
      } else {
        failedCount++;
        console.log(`✗ No items fetched from ${source.name}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`✗ Failed to fetch from ${source.name}:`, error);
    }
  }

  console.log(
    `Fetch completed: ${successCount} succeeded, ${failedCount} failed, ${totalItems} total items`
  );

  return {
    success: successCount,
    failed: failedCount,
    totalItems,
  };
}

// 流式抓取所有源，每个源完成后立即回调
export async function fetchAllSourcesStreaming(
  onSourceDone: (result: {
    sourceName: string;
    itemCount: number;
    success: boolean;
  }) => void
): Promise<{ success: number; failed: number; totalItems: number }> {
  const sources = await getEnabledSources();
  let successCount = 0;
  let failedCount = 0;
  let totalItems = 0;

  for (const source of sources) {
    try {
      let items: FeedItemInput[] = [];

      switch (source.type) {
        case 'rss':
          if (source.url) {
            try {
              items = await fetchRSSWithProxy({ url: source.url, sourceName: source.name, icon: source.icon, useProxy: true });
            } catch {
              items = await fetchRSSDirect({ url: source.url, sourceName: source.name, icon: source.icon });
            }
          }
          break;
        case 'zhihu':
          items = await fetchZhihuHot({ limit: 50 });
          break;
        case 'xiaohongshu':
          items = await fetchXiaohongshu({ limit: 20 });
          break;
        case 'weibo':
          items = await fetchWeiboHot({ limit: 50 });
          break;
        case 'blog':
          if (source.url) {
            items = await fetchBlog({ blogUrl: source.url, sourceName: source.name, icon: source.icon });
          }
          break;
      }

      if (items.length > 0) {
        const itemsWithSourceId = items.map(item => ({ ...item, sourceId: source.id }));
        await createFeedItems(itemsWithSourceId);
        successCount++;
        totalItems += items.length;
        onSourceDone({ sourceName: source.name, itemCount: items.length, success: true });
      } else {
        failedCount++;
        onSourceDone({ sourceName: source.name, itemCount: 0, success: false });
      }
    } catch (error) {
      failedCount++;
      onSourceDone({ sourceName: source.name, itemCount: 0, success: false });
    }
  }

  return { success: successCount, failed: failedCount, totalItems };
}


export async function fetchSourceById(sourceId: string): Promise<number> {
  const { getSourceById } = await import('./source-service');
  const source = await getSourceById(sourceId);

  if (!source) {
    throw new Error(`Source with id ${sourceId} not found`);
  }

  if (!source.enabled) {
    throw new Error(`Source ${source.name} is disabled`);
  }

  let items: FeedItemInput[] = [];

  switch (source.type) {
    case 'rss':
      if (source.url) {
        // 优先使用代理获取 RSS（适合国内源）
        try {
          console.log(`[Fetch Source] 尝试使用代理获取 ${source.name}`);
          items = await fetchRSSWithProxy({
            url: source.url,
            sourceName: source.name,
            icon: source.icon,
            useProxy: true,
          });
        } catch (proxyError) {
          console.log(`[Fetch Source] 代理失败，尝试直接连接 ${source.name}:`, proxyError);
          // 代理失败，尝试直接连接
          items = await fetchRSSDirect({
            url: source.url,
            sourceName: source.name,
            icon: source.icon,
          });
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

    case 'blog':
      if (source.url) {
        items = await fetchBlog({
          blogUrl: source.url,
          sourceName: source.name,
          icon: source.icon,
        });
      }
      break;

    case 'forum':
      // TODO: Implement forum fetcher
      throw new Error('Forum fetcher not implemented yet');

    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }

  if (items.length > 0) {
    // Add sourceId to each item before creating
    const itemsWithSourceId = items.map(item => ({
      ...item,
      sourceId: source.id,
    }));
    await createFeedItems(itemsWithSourceId);
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
