import { db, generateId, boolToInt, intToBool, parseJSON, stringifyJSON } from './db';
import type { FeedItem, FeedItemRow, GetFeedsParams } from '@/types';

// Convert database row to FeedItem
function rowToFeedItem(row: FeedItemRow): FeedItem {
  return {
    id: row.id,
    source: row.source as any,
    sourceName: row.sourceName,
    title: row.title,
    summary: row.summary,
    url: row.url || undefined,
    publishTime: new Date(row.publishTime),
    read: intToBool(row.read),
    tags: parseJSON<string[]>(row.tags, []),
    aiSummary: row.aiSummary || undefined,
    createdAt: new Date(row.createdAt),
  };
}

// Get feed items with filtering and pagination
export async function getFeedItems(params: GetFeedsParams = {}): Promise<FeedItem[]> {
  const {
    limit = 20,
    offset = 0,
    source,
    unreadOnly = false,
    startDate,
    endDate,
  } = params;

  let query = 'SELECT * FROM feed_items WHERE 1=1';
  const queryParams: any[] = [];

  if (source) {
    query += ' AND source = ?';
    queryParams.push(source);
  }

  if (unreadOnly) {
    query += ' AND read = 0';
  }

  if (startDate) {
    query += ' AND publishTime >= ?';
    queryParams.push(startDate);
  }

  if (endDate) {
    query += ' AND publishTime <= ?';
    queryParams.push(endDate);
  }

  query += ' ORDER BY publishTime DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const result = await db.execute({
    sql: query,
    args: queryParams,
  });

  return result.rows.map((row) => rowToFeedItem(row as unknown as FeedItemRow));
}

// Get total count of feed items
export async function getFeedItemsCount(params: GetFeedsParams = {}): Promise<number> {
  const { source, unreadOnly = false, startDate, endDate } = params;

  let query = 'SELECT COUNT(*) as count FROM feed_items WHERE 1=1';
  const queryParams: any[] = [];

  if (source) {
    query += ' AND source = ?';
    queryParams.push(source);
  }

  if (unreadOnly) {
    query += ' AND read = 0';
  }

  if (startDate) {
    query += ' AND publishTime >= ?';
    queryParams.push(startDate);
  }

  if (endDate) {
    query += ' AND publishTime <= ?';
    queryParams.push(endDate);
  }

  const result = await db.execute({
    sql: query,
    args: queryParams,
  });

  return (result.rows[0] as any).count;
}

// Get a single feed item by ID
export async function getFeedItemById(id: string): Promise<FeedItem | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM feed_items WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;

  return rowToFeedItem(result.rows[0] as unknown as FeedItemRow);
}

// Create a new feed item
export async function createFeedItem(item: Omit<FeedItem, 'id' | 'createdAt'>): Promise<FeedItem> {
  const id = generateId();
  const createdAt = new Date();

  await db.execute({
    sql: `
      INSERT INTO feed_items (
        id, source, sourceName, title, summary, url,
        publishTime, read, tags, aiSummary, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      item.source,
      item.sourceName,
      item.title,
      item.summary,
      item.url || null,
      item.publishTime.toISOString(),
      boolToInt(item.read),
      item.tags ? stringifyJSON(item.tags) : null,
      item.aiSummary || null,
      createdAt.toISOString(),
    ],
  });

  // Update FTS index
  await db.execute({
    sql: `
      INSERT INTO feed_items_fts (rowid, title, summary)
      SELECT rowid, title, summary FROM feed_items WHERE id = ?
    `,
    args: [id],
  });

  return {
    ...item,
    id,
    createdAt,
  };
}

// Bulk create feed items
export async function createFeedItems(items: Omit<FeedItem, 'id' | 'createdAt'>[]): Promise<void> {
  for (const item of items) {
    // Check if item already exists (by URL or title+publishTime)
    const existing = await db.execute({
      sql: `
        SELECT id FROM feed_items
        WHERE (url = ? AND url IS NOT NULL)
        OR (title = ? AND publishTime = ?)
        LIMIT 1
      `,
      args: [item.url || null, item.title, item.publishTime.toISOString()],
    });

    if (existing.rows.length === 0) {
      await createFeedItem(item);
    }
  }
}

// Mark a feed item as read
export async function markAsRead(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE feed_items SET read = 1 WHERE id = ?',
    args: [id],
  });
}

// Mark all feed items as read
export async function markAllAsRead(): Promise<void> {
  await db.execute('UPDATE feed_items SET read = 1');
}

// Update AI summary for a feed item
export async function updateAISummary(id: string, aiSummary: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE feed_items SET aiSummary = ? WHERE id = ?',
    args: [aiSummary, id],
  });
}

// Search feed items using full-text search
export async function searchFeedItems(
  query: string,
  params: GetFeedsParams = {}
): Promise<FeedItem[]> {
  const { limit = 20, offset = 0, source, startDate, endDate } = params;

  let sql = `
    SELECT f.* FROM feed_items f
    JOIN feed_items_fts fts ON f.rowid = fts.rowid
    WHERE fts.feed_items_fts MATCH ?
  `;
  const queryParams: any[] = [query];

  if (source) {
    sql += ' AND f.source = ?';
    queryParams.push(source);
  }

  if (startDate) {
    sql += ' AND f.publishTime >= ?';
    queryParams.push(startDate);
  }

  if (endDate) {
    sql += ' AND f.publishTime <= ?';
    queryParams.push(endDate);
  }

  sql += ' ORDER BY f.publishTime DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const result = await db.execute({
    sql,
    args: queryParams,
  });

  return result.rows.map((row) => rowToFeedItem(row as unknown as FeedItemRow));
}

// Delete old feed items (older than specified days)
export async function deleteOldFeedItems(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await db.execute({
    sql: 'DELETE FROM feed_items WHERE publishTime < ?',
    args: [cutoffDate.toISOString()],
  });

  return result.rowsAffected;
}

// Delete all feed items from a specific source
export async function deleteFeedItemsBySource(source: string): Promise<number> {
  const result = await db.execute({
    sql: 'DELETE FROM feed_items WHERE source = ?',
    args: [source],
  });

  console.log(`Deleted ${result.rowsAffected} feed items from source: ${source}`);
  return result.rowsAffected;
}

// Delete all feed items (for cleanup or reset)
export async function deleteAllFeedItems(): Promise<number> {
  const result = await db.execute({
    sql: 'DELETE FROM feed_items',
  });

  console.log(`Deleted all ${result.rowsAffected} feed items`);
  return result.rowsAffected;
}

// Get today's feed items
export async function getTodayFeedItems(): Promise<FeedItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getFeedItems({
    startDate: today.toISOString(),
    limit: 100,
  });
}
