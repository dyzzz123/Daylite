// Type definitions for the information aggregation dashboard

export type SourceType = 'rss' | 'xiaohongshu' | 'zhihu' | 'weibo' | 'forum';

export interface FeedItem {
  id: string;
  source: SourceType;
  sourceName: string;
  title: string;
  summary: string;
  url?: string;
  faviconUrl?: string;
  publishTime: Date;
  read: boolean;
  tags?: string[];
  aiSummary?: string;
  createdAt: Date;
}

export interface FeedSource {
  id: string;
  name: string;
  type: SourceType;
  icon: string;
  url?: string;
  faviconUrl?: string;
  enabled: boolean;
  config?: Record<string, any>;
  createdAt: Date;
}

export interface DailyReport {
  id: string;
  date: Date;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
}

// Database row types (with JSON fields as strings)
export interface FeedItemRow {
  id: string;
  source: string;
  sourceName: string;
  title: string;
  summary: string;
  url: string | null;
  publishTime: string;
  read: number;
  tags: string | null;
  aiSummary: string | null;
  createdAt: string;
}

export interface FeedSourceRow {
  id: string;
  name: string;
  type: string;
  icon: string;
  url: string | null;
  faviconUrl: string | null;
  enabled: number;
  config: string | null;
  createdAt: string;
}

export interface DailyReportRow {
  id: string;
  date: string;
  summary: string;
  keyPoints: string;
  createdAt: string;
}

// API request/response types
export interface GetFeedsParams {
  limit?: number;
  offset?: number;
  source?: SourceType;
  unreadOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface GetFeedsResponse {
  items: FeedItem[];
  total: number;
  unreadCount: number;
}

export interface SearchHistoryParams {
  query: string;
  source?: SourceType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSourceRequest {
  name: string;
  type: SourceType;
  icon: string;
  url?: string;
  enabled?: boolean;
  config?: Record<string, any>;
}

export interface UpdateSourceRequest {
  name?: string;
  icon?: string;
  url?: string;
  enabled?: boolean;
  config?: Record<string, any>;
}

// Settings types
export interface AISettings {
  apiKey: string;
  model: string;
}

export interface Settings {
  pin?: string;
  ai?: AISettings;
  updatedAt: string;
}
