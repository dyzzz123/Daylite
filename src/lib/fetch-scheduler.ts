import { getEnabledSources } from './source-service';
import { createFeedItems } from './feed-service';
import { fetchRSS } from './fetchers/rss-fetcher';
import { fetchZhihuHot } from './fetchers/zhihu-fetcher';
import { fetchWeiboHot } from './fetchers/weibo-fetcher';
import { fetchXiaohongshu } from './fetchers/xiaohongshu-fetcher';
import type { FeedItem } from '@/types';

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
      let items: FeedItem[] = [];

      switch (source.type) {
        case 'rss':
          if (source.url) {
            items = await fetchRSS({
              url: source.url,
              sourceName: source.name,
              icon: source.icon,
            });
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

      if (items.length > 0) {
        await createFeedItems(items);
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
        items = await fetchRSS({
          url: source.url,
          sourceName: source.name,
          icon: source.icon,
        });
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
