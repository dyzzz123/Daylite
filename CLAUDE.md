# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **personal information aggregation dashboard** (个人信息聚合仪表盘) - a "magic newspaper" style application that aggregates information from multiple sources into a unified timeline feed with AI-powered daily summaries.

**Core Concept:**
- Unified timeline view (not separate sections)
- All information sources displayed chronologically
- Source icon on the left, title as main content
- Expandable AI interpretation for each item
- Click title to jump to original content

**Tech Stack:**
- Next.js 16.1.6 with App Router
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components (New York style)
- SQLite database (via Turso or Vercel Postgres for serverless)
- DeepSeek AI (fixed provider for cost efficiency)

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

### Core Features

1. **Information Source Management**
   - RSS feeds (universal support)
   - Zhihu Hot Topics (知乎热榜)
   - Xiaohongshu (小红书)
   - Weibo Hot Search (微博热搜)
   - Forums and other Chinese information sources
   - User can enable/disable sources

2. **Timeline Feed Display**
   - Single column layout
   - Chronologically sorted (newest first)
   - Source icon on left side
   - Title + summary + tags
   - Expandable for AI interpretation
   - Read/unread status

3. **AI Daily Summary**
   - DeepSeek-powered daily report
   - 3-5 key points extraction
   - One-click mark all as read
   - Displayed at top of page

4. **History & Search**
   - Full-text search (title, summary, tags)
   - Time range filtering (this week, this month, all)
   - Source filtering
   - Pagination support

### Database Schema

**SQLite Tables:**

```sql
-- Feed items (information entries)
CREATE TABLE feed_items (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,           -- Source type (rss, zhihu, xiaohongshu, etc.)
  sourceName TEXT NOT NULL,       -- Display name (36氪, 少数派, etc.)
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT,
  publishTime DATETIME NOT NULL,
  read BOOLEAN DEFAULT 0,
  tags TEXT,                      -- JSON array of tags
  aiSummary TEXT,                 -- AI-generated interpretation (lazy loaded)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feed sources (source configuration)
CREATE TABLE feed_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,             -- rss, zhihu, xiaohongshu, weibo, forum
  icon TEXT NOT NULL,             -- Emoji or icon URL
  url TEXT,                       -- RSS URL or API endpoint
  enabled BOOLEAN DEFAULT 1,
  config TEXT,                    -- JSON config for source-specific settings
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily reports (AI summaries)
CREATE TABLE daily_reports (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  keyPoints TEXT NOT NULL,        -- JSON array of key points
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Directory Structure

```
demo/daily-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── feeds/
│   │   │   │   ├── route.ts              # GET feed items (paginated)
│   │   │   │   └── [id]/route.ts         # PATCH mark as read, GET AI summary
│   │   │   ├── sources/
│   │   │   │   ├── route.ts              # GET/POST sources
│   │   │   │   └── [id]/route.ts         # PUT/DELETE source
│   │   │   ├── summary/route.ts          # POST generate daily summary (DeepSeek)
│   │   │   ├── fetch/route.ts            # POST manual fetch trigger
│   │   │   ├── cron/route.ts             # GET Vercel Cron endpoint
│   │   │   ├── history/route.ts          # GET search history
│   │   │   └── settings/route.ts         # GET/POST settings
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Main timeline page
│   │   └── globals.css                   # Global styles
│   ├── components/
│   │   ├── feed/
│   │   │   ├── feed-timeline.tsx         # Timeline container
│   │   │   ├── feed-item.tsx             # Single feed item card
│   │   │   ├── ai-summary-card.tsx       # Daily AI summary card
│   │   │   └── source-filter.tsx         # Source filter UI
│   │   ├── history/
│   │   │   └── history-drawer.tsx        # History search drawer
│   │   ├── settings/
│   │   │   └── settings-modal.tsx        # Settings modal
│   │   └── ui/                           # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts                         # SQLite database connection
│   │   ├── feed-service.ts               # Feed CRUD operations
│   │   ├── source-service.ts             # Source management
│   │   ├── report-service.ts             # Daily report management
│   │   ├── fetch-scheduler.ts            # Fetch orchestration
│   │   ├── fetchers/
│   │   │   ├── rss-fetcher.ts            # RSS feed parser
│   │   │   ├── zhihu-fetcher.ts          # Zhihu hot topics
│   │   │   ├── xiaohongshu-fetcher.ts    # Xiaohongshu scraper
│   │   │   └── weibo-fetcher.ts          # Weibo hot search
│   │   ├── settings.ts                   # Settings management
│   │   └── utils.ts                      # Utility functions
│   └── types/
│       └── index.ts                      # TypeScript type definitions
├── data/                                 # Runtime data (settings.json)
├── vercel.json                           # Vercel Cron configuration
└── package.json
```

## Key Architectural Patterns

### 1. Data Flow

```
Vercel Cron (every 2 hours)
    ↓
/api/cron → fetch-scheduler
    ↓
Fetchers (RSS, Zhihu, Xiaohongshu, Weibo)
    ↓
feed-service.createFeedItems()
    ↓
SQLite Database
    ↓
/api/feeds → Frontend Timeline
```

### 2. Information Source Fetchers

Each fetcher implements a common interface:

```typescript
interface Fetcher {
  fetch(): Promise<FeedItem[]>;
  validate(): boolean;
}
```

**RSS Fetcher** ([src/lib/fetchers/rss-fetcher.ts](demo/daily-dashboard/src/lib/fetchers/rss-fetcher.ts)):
- Uses `rss-parser` library
- Supports any RSS/Atom feed
- Extracts title, summary, link, publish date

**Zhihu Fetcher** ([src/lib/fetchers/zhihu-fetcher.ts](demo/daily-dashboard/src/lib/fetchers/zhihu-fetcher.ts)):
- Fetches Zhihu hot topics API
- Parses trending questions/articles

**Xiaohongshu Fetcher** ([src/lib/fetchers/xiaohongshu-fetcher.ts](demo/daily-dashboard/src/lib/fetchers/xiaohongshu-fetcher.ts)):
- Web scraping or third-party API
- Handles anti-scraping measures

**Weibo Fetcher** ([src/lib/fetchers/weibo-fetcher.ts](demo/daily-dashboard/src/lib/fetchers/weibo-fetcher.ts)):
- Weibo hot search API
- Extracts trending topics

### 3. AI Summary Generation

**DeepSeek Integration** ([src/app/api/summary/route.ts](demo/daily-dashboard/src/app/api/summary/route.ts)):
- Fixed provider (no multi-provider support)
- API: `https://api.deepseek.com/v1/chat/completions`
- Model: `deepseek-chat`
- Generates 3-5 key points from today's feed items
- Caches daily summaries to avoid redundant API calls

**Prompt Structure:**
```
You are a personal information assistant. Summarize today's information feed into 3-5 key points.

Feed items:
1. [Source] Title - Summary
2. [Source] Title - Summary
...

Generate:
1. Overall summary (2-3 sentences)
2. 3-5 key points (one sentence each)
```

### 4. Vercel Cron Jobs

**Configuration** ([vercel.json](demo/daily-dashboard/vercel.json)):
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

**Cron Handler** ([src/app/api/cron/route.ts](demo/daily-dashboard/src/app/api/cron/route.ts)):
- Verifies request is from Vercel (check `x-vercel-cron` header)
- Triggers fetch-scheduler
- Returns 200 on success, 500 on error
- Logs execution for debugging

### 5. Database Service Layer

**Feed Service** ([src/lib/feed-service.ts](demo/daily-dashboard/src/lib/feed-service.ts)):
```typescript
export async function getFeedItems(options: {
  limit?: number;
  offset?: number;
  source?: string;
  unreadOnly?: boolean;
}): Promise<FeedItem[]>

export async function createFeedItem(item: FeedItem): Promise<void>

export async function markAsRead(id: string): Promise<void>

export async function getAISummary(id: string): Promise<string>
```

**Source Service** ([src/lib/source-service.ts](demo/daily-dashboard/src/lib/source-service.ts)):
```typescript
export async function getSources(): Promise<FeedSource[]>

export async function createSource(source: FeedSource): Promise<void>

export async function updateSource(id: string, updates: Partial<FeedSource>): Promise<void>

export async function deleteSource(id: string): Promise<void>
```

## UI Design Guidelines

### Color Scheme (Minimalist Cold Style)

```css
:root {
  --bg-primary: #6366f1;      /* Deep gray-blue */
  --bg-secondary: #f8fafc;    /* Light gray-white */
  --accent: #94a3b8;          /* Dark brown, low saturation */
  --text-muted: #6b7280;      /* Dark gray, not harsh */
  --border: #e5e7eb;          /* Light gray border */
}
```

### Typography

- **Font**: Inter / Source Han Sans (思源黑体)
- **Sizes**: Body 14px / Heading 16px / Secondary 12px
- **Spacing**: Card spacing 16px / Element spacing 8px
- **Border Radius**: 8px (not too sharp)

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Header (Fixed Top)                             │
│  ┌──────────────────────────────┬──────────────┐│
│  │ 📅 2025年2月5日 周三         │  ⚙️ Settings ││
│  │ 晚上好，用户名                │              ││
│  └──────────────────────────────┴──────────────┘│
│                                                  │
│  ┌──────────────── AI Summary Area ────────────┐│
│  │ 今日3件重要事                                ││
│  │                                              ││
│  │ 1. GitHub repo released new version          ││
│  │ 2. Xiaohongshu discussion on AI products     ││
│  │ 3. 36Kr published 2024 programming trends    ││
│  │                                              ││
│  │ [Expand] [Mark All Read] [Share]            ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  ┌────────────── Timeline Feed ─────────────────┐│
│  │ 📕 [36Kr] OpenAI releases GPT-5              ││
│  │    Summary: New model with enhanced...       ││
│  │    [Expand AI Interpretation]                ││
│  │                                              ││
│  │ 📘 [Zhihu] How to design a good PRD?        ││
│  │    Summary: PRD is the bridge between...    ││
│  │    [Expand AI Interpretation]                ││
│  │                                              ││
│  │ ... (more items)                             ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  ┌────────────── History Drawer ────────────────┐│
│  │ [This Week] [This Month] [All] [🔍 Search]  ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Create `.env.local`:
```bash
# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your_api_key_here

# Database (if using Turso)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your_auth_token

# Optional: Custom RSS feeds
DEFAULT_RSS_FEEDS=https://example.com/feed.xml,https://another.com/rss
```

### Settings Management

Settings stored in `data/settings.json`:
```json
{
  "pin": "1234",
  "ai": {
    "apiKey": "sk-...",
    "model": "deepseek-chat"
  },
  "sources": [
    {
      "id": "rss-36kr",
      "name": "36氪",
      "type": "rss",
      "url": "https://36kr.com/feed",
      "enabled": true
    }
  ]
}
```

## Adding New Features

### Adding a New Information Source

1. **Create Fetcher** in [src/lib/fetchers/](demo/daily-dashboard/src/lib/fetchers/):
```typescript
export async function fetchNewSource(): Promise<FeedItem[]> {
  // Implement fetching logic
  return items;
}
```

2. **Register in Scheduler** ([src/lib/fetch-scheduler.ts](demo/daily-dashboard/src/lib/fetch-scheduler.ts)):
```typescript
import { fetchNewSource } from './fetchers/new-source-fetcher';

export async function fetchAllSources() {
  const sources = await getSources();

  for (const source of sources) {
    if (source.type === 'new-source' && source.enabled) {
      const items = await fetchNewSource();
      await saveFeedItems(items);
    }
  }
}
```

3. **Add UI Option** in settings modal

### Adding a New API Endpoint

1. Create route handler in `src/app/api/[name]/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Use database services for data access
4. Return `NextResponse` with appropriate status codes

Example:
```typescript
import { NextResponse } from 'next/server';
import { getFeedItems } from '@/lib/feed-service';

export async function GET(request: Request) {
  try {
    const items = await getFeedItems({ limit: 20 });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
```

## Important Notes

- **Language**: UI text and comments are in Chinese (中文)
- **Database**: SQLite requires special handling on Vercel (use Turso or Vercel Postgres)
- **AI Provider**: Fixed to DeepSeek (no multi-provider support for simplicity)
- **Cron Frequency**: Every 2 hours to balance freshness and API costs
- **Anti-Scraping**: Some sources (Xiaohongshu, Weibo) may require proxy or third-party APIs
- **Path Aliases**: `@/*` maps to `./src/*` (configured in [tsconfig.json](demo/daily-dashboard/tsconfig.json))
- **Styling**: Minimalist cold style with low-saturation colors
- **Icons**: Emoji for source icons (📕📘📰💻🚀)

## Testing Strategy

### Manual Testing Checklist

1. **Feed Fetching**
   - Trigger manual fetch via `/api/fetch`
   - Verify items appear in database
   - Check each source type (RSS, Zhihu, etc.)

2. **Timeline Display**
   - Items sorted by publish time (newest first)
   - Source icons display correctly
   - Expand/collapse works
   - Mark as read updates UI

3. **AI Summary**
   - Generate daily summary
   - Verify 3-5 key points
   - Check DeepSeek API call
   - Test one-click mark all read

4. **History Search**
   - Full-text search returns correct results
   - Time range filtering works
   - Source filtering works
   - Pagination loads more items

5. **Cron Jobs**
   - Deploy to Vercel
   - Wait for cron trigger (check logs)
   - Verify new items fetched automatically

## Troubleshooting

### Database Connection Issues

If using Turso:
```bash
npm install @libsql/client
```

Update [src/lib/db.ts](demo/daily-dashboard/src/lib/db.ts):
```typescript
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});
```

### Vercel Cron Not Triggering

- Check Vercel dashboard → Project → Cron Jobs
- Verify `vercel.json` is in project root
- Ensure `/api/cron` endpoint returns 200
- Check function logs for errors

### DeepSeek API Errors

- Verify API key is correct
- Check rate limits (DeepSeek has generous limits)
- Implement exponential backoff for retries
- Add fallback to simple text summary if API fails

## Performance Optimization

1. **Database Indexing**:
   - Index on `publishTime` for timeline queries
   - Index on `read` status for filtering
   - Full-text search index on `title` and `summary`

2. **Caching**:
   - Cache daily summaries (regenerate only once per day)
   - Cache feed items for 5 minutes on frontend
   - Use SWR or React Query for data fetching

3. **Lazy Loading**:
   - AI interpretations loaded on demand (not with initial feed)
   - Infinite scroll for timeline (load 20 items at a time)
   - Image lazy loading for source icons

4. **API Rate Limiting**:
   - Limit AI summary generation to once per day
   - Throttle manual fetch requests (max once per 5 minutes)
   - Implement request queuing for fetchers

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (DEEPSEEK_API_KEY, DATABASE_URL, etc.)
4. Deploy
5. Verify Cron Jobs are configured in Vercel dashboard

### Database Setup (Turso)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create personal-dashboard

# Get connection URL
turso db show personal-dashboard

# Create auth token
turso db tokens create personal-dashboard
```

Add to Vercel environment variables:
- `DATABASE_URL`: libsql://[your-db].turso.io
- `DATABASE_AUTH_TOKEN`: [your-token]

## Future Enhancements (Post-MVP)

- AI Agent feature (OpenClaw-style task assignment)
- Email digest (daily summary via email)
- Mobile app (React Native)
- Browser extension (quick add sources)
- Social sharing (share interesting items)
- Reading analytics (track reading habits)
- Custom AI prompts (user-defined summary style)
- Multi-user support (family/team dashboards)
