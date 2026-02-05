import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// 设置数据存储路径
const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

// 设置数据类型
export interface AISettings {
  provider: "openai" | "deepseek" | "claude" | "custom";
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

export interface CalendarSettings {
  provider: "google" | "apple" | "outlook" | "ical" | "manual";
  apiKey?: string;
  calendarUrl?: string; // iCal URL
  enabled: boolean;
  description?: string;
}

export interface TodoSettings {
  provider: "notion" | "todoist" | "ticktick" | "manual";
  apiKey?: string;
  databaseId?: string; // For Notion
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
  pin?: string; // PIN码（明文存储，简单保护）
  aiSettings?: AISettings;
  calendar?: CalendarSettings;
  todo?: TodoSettings;
  feed?: FeedSettings;
  updatedAt: string;
}

// 确保数据目录存在
async function ensureDataDir(): Promise<void> {
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取设置
export async function getSettings(): Promise<Settings | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    return JSON.parse(data) as Settings;
  } catch {
    return null;
  }
}

// 保存设置
export async function saveSettings(settings: Settings): Promise<void> {
  await ensureDataDir();
  settings.updatedAt = new Date().toISOString();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// 验证 PIN 码
export async function verifyPin(inputPin: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings?.pin) return true; // 未设置 PIN 则无需验证
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
