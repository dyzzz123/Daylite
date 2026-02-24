import { createClient } from '@libsql/client';

// Initialize Turso database client
// For local development, you can use a local SQLite file
// For production, use Turso cloud database
export const db = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Initialize database schema
export async function initDatabase() {
  // Create feed_items table (with sourceId)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feed_items (
      id TEXT PRIMARY KEY,
      sourceId TEXT NOT NULL,
      source TEXT NOT NULL,
      sourceName TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      url TEXT,
      publishTime TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      tags TEXT,
      aiSummary TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sourceId) REFERENCES feed_sources(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add sourceId column if it doesn't exist (for existing databases)
  // This must run before creating the index on sourceId
  let addedColumn = false;
  try {
    await db.execute(`ALTER TABLE feed_items ADD COLUMN sourceId TEXT`);
    console.log('Added sourceId column to feed_items table (migration)');
    addedColumn = true;
  } catch (error: any) {
    // Column already exists or other error, ignore
    if (!error.message?.includes('duplicate column')) {
      console.log('sourceId column migration check:', error);
    }
  }

  // Migration: Fill sourceId for existing feed items that have empty sourceId
  // This runs after adding the column (or on subsequent startups if some items still have empty sourceId)
  try {
    const result = await db.execute(`
      UPDATE feed_items
      SET sourceId = (
        SELECT id FROM feed_sources
        WHERE feed_sources.name = feed_items.sourceName
        LIMIT 1
      )
      WHERE sourceId IS NULL OR sourceId = ''
    `);
    if (result.rowsAffected > 0) {
      console.log(`Migrated ${result.rowsAffected} feed items with sourceId`);
    }
  } catch (error: any) {
    console.log('sourceId data migration note:', error);
  }

  // Create indexes for feed_items
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_feed_items_publishTime
    ON feed_items(publishTime DESC)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_feed_items_read
    ON feed_items(read)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_feed_items_source
    ON feed_items(source)
  `);

  // Create index for sourceId (only works after column exists)
  try {
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_feed_items_sourceId
      ON feed_items(sourceId)
    `);
  } catch (error) {
    console.log('sourceId index creation note:', error);
  }

  // Create full-text search index
  await db.execute(`
    CREATE VIRTUAL TABLE IF NOT EXISTS feed_items_fts USING fts5(
      title,
      summary,
      content=feed_items,
      content_rowid=rowid
    )
  `);

  // Create feed_sources table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feed_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      url TEXT,
      enabled INTEGER DEFAULT 1,
      config TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create daily_reports table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      keyPoints TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for daily_reports
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date
    ON daily_reports(date DESC)
  `);

  // Create analytics_events table for user behavior tracking
  await db.execute(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      eventType TEXT NOT NULL,
      eventName TEXT NOT NULL,
      properties TEXT,
      pageUrl TEXT,
      timestamp TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for analytics
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
    ON analytics_events(timestamp DESC)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_sessionId
    ON analytics_events(sessionId)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_eventType
    ON analytics_events(eventType)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_eventName
    ON analytics_events(eventName)
  `);

  console.log('Database initialized successfully');
}

// Helper function to generate UUID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to convert boolean to SQLite integer
export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

// Helper function to convert SQLite integer to boolean
export function intToBool(value: number): boolean {
  return value === 1;
}

// Helper function to parse JSON safely
export function parseJSON<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Helper function to stringify JSON safely
export function stringifyJSON(value: any): string {
  return JSON.stringify(value);
}
