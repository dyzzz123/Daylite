import { db } from "@/lib/db";

// 设置数据类型
export interface AISettings {
  provider: "openai" | "deepseek" | "claude" | "custom";
  apiKey: string;
  apiUrl?: string;
  model?: string;
  aiRole?: string;
}

export interface CalendarSettings {
  provider: "google" | "apple" | "outlook" | "ical" | "manual";
  apiKey?: string;
  calendarUrl?: string;
  enabled: boolean;
  description?: string;
}

export interface TodoSettings {
  provider: "notion" | "todoist" | "ticktick" | "manual";
  apiKey?: string;
  databaseId?: string;
  enabled: boolean;
  description?: string;
}

export interface FeedSettings {
  provider: "rss" | "twitter" | "zhihu" | "xiaohongshu" | "manual";
  rssUrl?: string;
  apiKey?: string;
  enabled: boolean;
  sources?: string[];
  description?: string;
}

export interface Settings {
  pin?: string;
  aiSettings?: AISettings;
  aiSummaryEnabled?: boolean;
  calendar?: CalendarSettings;
  todo?: TodoSettings;
  feed?: FeedSettings;
  updatedAt: string;
}

// 读取设置（从数据库）
export async function getSettings(): Promise<Settings | null> {
  try {
    const result = await db.execute({
      sql: "SELECT data FROM settings WHERE id = 'default'",
      args: [],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return JSON.parse(result.rows[0].data as string) as Settings;
  } catch (error) {
    console.error("Error reading settings from database:", error);
    return null;
  }
}

// 保存设置（到数据库）
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    settings.updatedAt = new Date().toISOString();
    const data = JSON.stringify(settings);

    await db.execute({
      sql: `
        INSERT INTO settings (id, data, updatedAt)
        VALUES ('default', ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updatedAt = excluded.updatedAt
      `,
      args: [data, settings.updatedAt],
    });
  } catch (error) {
    console.error("Error saving settings to database:", error);
    throw error;
  }
}

// 验证 PIN 码
export async function verifyPin(inputPin: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings?.pin) return true;
  return settings.pin === inputPin;
}

// 检查是否已设置
export async function hasSettings(): Promise<boolean> {
  const settings = await getSettings();
  return !!settings?.aiSettings?.apiKey;
}

// 获取 AI 配置
export async function getAIConfig(): Promise<{
  apiKey: string;
  apiUrl: string;
  model: string;
} | null> {
  const settings = await getSettings();
  if (!settings?.aiSettings?.apiKey) return null;

  const { provider, apiKey, apiUrl, model } = settings.aiSettings;

  const presets: Record<string, { url: string; model: string }> = {
    openai: {
      url: "https://api.openai.com/v1/chat/completions",
      model: "gpt-3.5-turbo",
    },
    deepseek: {
      url: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat",
    },
    claude: {
      url: "https://api.anthropic.com/v1/messages",
      model: "claude-3-5-sonnet-20241022",
    },
  };

  const preset = presets[provider];

  return {
    apiKey,
    apiUrl: apiUrl || preset?.url || presets.openai.url,
    model: model || preset?.model || presets.openai.model,
  };
}

// 获取数据源配置
export async function getDataSourceConfig() {
  const settings = await getSettings();
  return {
    calendar: settings?.calendar,
    todo: settings?.todo,
    feed: settings?.feed,
  };
}
