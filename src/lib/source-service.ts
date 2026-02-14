import { db, generateId, boolToInt, intToBool, parseJSON, stringifyJSON } from './db';
import { getFaviconUrl } from './favicon-fetcher';
import type { FeedSource, FeedSourceRow, SourceType } from '@/types';

// Convert database row to FeedSource
function rowToFeedSource(row: FeedSourceRow): FeedSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type as SourceType,
    icon: row.icon,
    url: row.url || undefined,
    faviconUrl: row.faviconUrl || undefined,
    enabled: intToBool(row.enabled),
    config: parseJSON<Record<string, any>>(row.config, {}),
    createdAt: new Date(row.createdAt),
  };
}

// Get all feed sources
export async function getSources(): Promise<FeedSource[]> {
  const result = await db.execute('SELECT * FROM feed_sources ORDER BY createdAt ASC');
  return result.rows.map((row) => rowToFeedSource(row as unknown as FeedSourceRow));
}

// Get enabled feed sources only
export async function getEnabledSources(): Promise<FeedSource[]> {
  const result = await db.execute('SELECT * FROM feed_sources WHERE enabled = 1 ORDER BY createdAt ASC');
  return result.rows.map((row) => rowToFeedSource(row as unknown as FeedSourceRow));
}

// Get a single feed source by ID
export async function getSourceById(id: string): Promise<FeedSource | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM feed_sources WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;

  return rowToFeedSource(result.rows[0] as unknown as FeedSourceRow);
}

// Get sources by type
export async function getSourcesByType(type: SourceType): Promise<FeedSource[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM feed_sources WHERE type = ? ORDER BY createdAt ASC',
    args: [type],
  });

  return result.rows.map((row) => rowToFeedSource(row as unknown as FeedSourceRow));
}

// Create a new feed source
export async function createSource(
  source: Omit<FeedSource, 'id' | 'createdAt'>
): Promise<FeedSource> {
  const id = generateId();
  const createdAt = new Date();

  // 自动获取 favicon（仅对 RSS 源且有 URL 的情况）
  let faviconUrl: string | null = null;
  if (source.type === 'rss' && source.url) {
    try {
      faviconUrl = await getFaviconUrl(source.url);
      console.log(`[Source Service] 获取到 favicon: ${faviconUrl}`);
    } catch (error) {
      console.log(`[Source Service] 无法获取 favicon，跳过`);
    }
  }

  await db.execute({
    sql: `
      INSERT INTO feed_sources (id, name, type, icon, url, faviconUrl, enabled, config, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      source.name,
      source.type,
      source.icon,
      source.url || null,
      faviconUrl,
      boolToInt(source.enabled),
      source.config ? stringifyJSON(source.config) : null,
      createdAt.toISOString(),
    ],
  });

  return {
    ...source,
    id,
    faviconUrl: faviconUrl || undefined,
    createdAt,
  };
}

// Update a feed source
export async function updateSource(
  id: string,
  updates: Partial<Omit<FeedSource, 'id' | 'createdAt'>>
): Promise<void> {
  const source = await getSourceById(id);
  if (!source) {
    throw new Error(`Source with id ${id} not found`);
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }

  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url || null);

    // 如果 URL 改变了，重新获取 favicon
    if (updates.url && source.type === 'rss') {
      try {
        const faviconUrl = await getFaviconUrl(updates.url);
        if (faviconUrl) {
          fields.push('faviconUrl = ?');
          values.push(faviconUrl);
        }
      } catch (error) {
        console.log(`[Source Service] 无法获取新的 favicon`);
      }
    }
  }

  if (updates.faviconUrl !== undefined) {
    fields.push('faviconUrl = ?');
    values.push(updates.faviconUrl || null);
  }

  if (updates.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(boolToInt(updates.enabled));
  }

  if (updates.config !== undefined) {
    fields.push('config = ?');
    values.push(stringifyJSON(updates.config));
  }

  if (fields.length === 0) return;

  values.push(id);

  await db.execute({
    sql: `UPDATE feed_sources SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });
}

// Delete a feed source and all its feed items
export async function deleteSource(id: string): Promise<void> {
  const source = await getSourceById(id);
  if (!source) {
    throw new Error(`Source with id ${id} not found`);
  }

  // Delete all feed items from this source
  await db.execute({
    sql: 'DELETE FROM feed_items WHERE sourceName = ?',
    args: [source.name],
  });

  console.log(`Deleted feed items from source: ${source.name}`);

  // Delete the source itself
  await db.execute({
    sql: 'DELETE FROM feed_sources WHERE id = ?',
    args: [id],
  });

  console.log(`Deleted source: ${source.name}`);
}

// Toggle source enabled status
export async function toggleSourceEnabled(id: string): Promise<void> {
  const source = await getSourceById(id);
  if (!source) {
    throw new Error(`Source with id ${id} not found`);
  }

  await updateSource(id, { enabled: !source.enabled });
}

// Initialize default sources
export async function initializeDefaultSources(): Promise<void> {
  const existingSources = await getSources();
  if (existingSources.length > 0) {
    return; // Already initialized
  }

  const defaultSources: Omit<FeedSource, 'id' | 'createdAt'>[] = [
    {
      name: '36氪',
      type: 'rss',
      icon: '📕',
      url: 'https://36kr.com/feed',
      enabled: true,
      config: {},
    },
    {
      name: '少数派',
      type: 'rss',
      icon: '📘',
      url: 'https://sspai.com/feed',
      enabled: true,
      config: {},
    },
    {
      name: '知乎热榜',
      type: 'zhihu',
      icon: '🔥',
      enabled: true,
      config: {},
    },
    {
      name: '微博热搜',
      type: 'weibo',
      icon: '📰',
      enabled: true,
      config: {},
    },
  ];

  for (const source of defaultSources) {
    await createSource(source);
  }

  console.log('Default sources initialized');
}
