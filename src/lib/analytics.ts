/**
 * 埋点 SDK - 用于追踪用户行为
 */

// 事件类型定义
export type AnalyticsEventType =
  | "page_view" // 页面浏览
  | "action" // 用户操作
  | "config" // 配置变更
  | "error"; // 错误事件

// 会话管理
let sessionId: string | null = null;
let eventQueue: AnalyticsEvent[] = [];
let isBatchSending = false;
const BATCH_SIZE = 10; // 批量发送大小
const BATCH_INTERVAL = 5000; // 5秒自动发送

interface AnalyticsEvent {
  sessionId: string;
  eventType: AnalyticsEventType;
  eventName: string;
  properties?: Record<string, any>;
  pageUrl?: string;
  timestamp?: string;
}

// 获取或生成会话 ID
function getSessionId(): string {
  if (!sessionId) {
    // 检查是否在浏览器环境
    if (typeof window !== "undefined") {
      // 尝试从 localStorage 获取
      const stored = localStorage.getItem("analytics_session_id");
      if (stored) {
        sessionId = stored;
      } else {
        // 生成新的会话 ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem("analytics_session_id", sessionId);
      }
    } else {
      // 服务器环境，生成临时会话 ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
  }
  return sessionId;
}

// 发送事件到服务器
async function sendEvent(event: AnalyticsEvent): Promise<boolean> {
  try {
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        sessionId: event.sessionId || getSessionId(),
        pageUrl: event.pageUrl || window.location.href,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Analytics send error:", error);
    return false;
  }
}

// 批量发送事件
async function sendBatch(): Promise<boolean> {
  if (eventQueue.length === 0 || isBatchSending) {
    return true;
  }

  isBatchSending = true;
  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    const response = await fetch("/api/analytics/track", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: eventsToSend }),
    });

    isBatchSending = false;

    if (!response.ok) {
      // 发送失败，重新加入队列
      eventQueue = [...eventsToSend, ...eventQueue];
    }

    return response.ok;
  } catch (error) {
    console.error("Analytics batch send error:", error);
    isBatchSending = false;
    // 发送失败，重新加入队列
    eventQueue = [...eventsToSend, ...eventQueue];
    return false;
  }
}

// 定时批量发送（避免重复创建定时器）
let intervalId: ReturnType<typeof setInterval> | null = null;

if (typeof window !== "undefined") {
  // 清理旧的定时器（防止热重载时创建多个定时器）
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(sendBatch, BATCH_INTERVAL);

  // 页面卸载时发送剩余事件并清理定时器
  window.addEventListener("beforeunload", () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (eventQueue.length > 0) {
      navigator.sendBeacon(
        "/api/analytics/track",
        JSON.stringify({ events: eventQueue })
      );
    }
  });
}

/**
 * 追踪单个事件
 */
export function track(
  eventType: AnalyticsEventType,
  eventName: string,
  properties?: Record<string, any>
): void {
  // 确保在浏览器环境
  if (typeof window === "undefined") {
    return;
  }

  try {
    const event: AnalyticsEvent = {
      sessionId: getSessionId(),
      eventType,
      eventName,
      properties,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // 加入队列
    eventQueue.push(event);

    // 如果队列达到批量大小，立即发送
    if (eventQueue.length >= BATCH_SIZE) {
      sendBatch();
    }
  } catch (err) {
    // 静默失败，不阻塞业务代码
    console.error("Analytics tracking error:", err);
  }
}

/**
 * 追踪页面浏览
 */
export function trackPageView(pageName: string): void {
  track("page_view", "page_view", { pageName });
}

/**
 * 追踪用户操作
 */
export function trackAction(actionName: string, properties?: Record<string, any>): void {
  track("action", actionName, properties);
}

/**
 * 追踪配置变更
 */
export function trackConfig(configName: string, properties?: Record<string, any>): void {
  track("config", configName, properties);
}

/**
 * 追踪错误
 */
export function trackError(errorName: string, properties?: Record<string, any>): void {
  track("error", errorName, properties);
}

// 预定义的事件名称常量
export const EventNames = {
  // AI 相关
  AI_SUMMARY_GENERATE: "ai_summary_generate",
  AI_SUMMARY_REFRESH: "ai_summary_refresh",
  AI_CONFIG_SAVE: "ai_config_save",
  AI_CONFIG_TEST: "ai_config_test",
  AI_ROLE_CHANGE: "ai_role_change",

  // 信息源相关
  SOURCE_ADD: "source_add",
  SOURCE_DELETE: "source_delete",
  SOURCE_TOGGLE: "source_toggle",
  FEED_FETCH: "feed_fetch",

  // 内容互动
  FEED_MARK_READ: "feed_mark_read",
  FEED_CLICK: "feed_click",
  SEARCH: "search",

  // 页面
  HOME_VIEW: "home_view",
  SETTINGS_VIEW: "settings_view",
} as const;
