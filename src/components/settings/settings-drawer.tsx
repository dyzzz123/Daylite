"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, X, Eye, EyeOff, ChevronRight, Calendar, CheckSquare, Rss } from "lucide-react";

interface SettingsData {
  pinSet: boolean;
  aiConfigured: boolean;
  provider?: string;
  apiKeyPreview?: string;
  calendar?: CalendarSettings;
  todo?: TodoSettings;
  feed?: FeedSettings;
}

interface CalendarSettings {
  provider: string;
  enabled: boolean;
  description?: string;
}

interface TodoSettings {
  provider: string;
  enabled: boolean;
  description?: string;
}

interface FeedSettings {
  provider: string;
  enabled: boolean;
  description?: string;
  rssUrl?: string;
}

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);

  // AI 设置表单
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [showKey, setShowKey] = useState(false);

  // 数据源设置
  const [calendarProvider, setCalendarProvider] = useState("manual");
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [todoProvider, setTodoProvider] = useState("manual");
  const [todoEnabled, setTodoEnabled] = useState(false);
  const [feedProvider, setFeedProvider] = useState("manual");
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [rssUrl, setRssUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 加载设置
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings?pin=${pin}`, {
        headers: { "x-pin": pin },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.provider) setProvider(data.provider);
        if (data.calendar) {
          setCalendarProvider(data.calendar.provider);
          setCalendarEnabled(data.calendar.enabled);
        }
        if (data.todo) {
          setTodoProvider(data.todo.provider);
          setTodoEnabled(data.todo.enabled);
        }
        if (data.feed) {
          setFeedProvider(data.feed.provider);
          setFeedEnabled(data.feed.enabled);
          setRssUrl(data.feed.rssUrl || "");
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
    setLoading(false);
  }

  // 验证 PIN
  async function verifyPin() {
    const res = await fetch(`/api/settings?pin=${pin}`, {
      headers: { "x-pin": pin },
    });
    if (res.ok) {
      setVerified(true);
      const data = await res.json();
      setSettings(data);
      if (data.provider) setProvider(data.provider);
      if (data.calendar) {
        setCalendarProvider(data.calendar.provider);
        setCalendarEnabled(data.calendar.enabled);
      }
      if (data.todo) {
        setTodoProvider(data.todo.provider);
        setTodoEnabled(data.todo.enabled);
      }
      if (data.feed) {
        setFeedProvider(data.feed.provider);
        setFeedEnabled(data.feed.enabled);
        setRssUrl(data.feed.rssUrl || "");
      }
    } else {
      setMessage("PIN 码错误");
    }
  }

  // 保存设置
  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const aiSettings = {
        provider: provider as "openai" | "deepseek" | "claude" | "custom",
        apiKey: apiKey || undefined,
        apiUrl: customUrl || undefined,
        model: customModel || undefined,
      };

      const calendar: CalendarSettings = {
        provider: calendarProvider,
        enabled: calendarEnabled,
        description: getCalendarDescription(calendarProvider),
      };

      const todo: TodoSettings = {
        provider: todoProvider,
        enabled: todoEnabled,
        description: getTodoDescription(todoProvider),
      };

      const feed: FeedSettings = {
        provider: feedProvider,
        enabled: feedEnabled,
        description: getFeedDescription(feedProvider),
        rssUrl: rssUrl || undefined,
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          aiSettings,
          calendar,
          todo,
          feed,
          currentPin: pin,
        }),
      });

      if (res.ok) {
        setMessage("保存成功！");
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        const data = await res.json();
        setMessage(data.error || "保存失败");
      }
    } catch (err) {
      setMessage("网络错误");
    }

    setSaving(false);
  }

  function getCalendarDescription(provider: string): string {
    switch (provider) {
      case "google": return "Google Calendar API";
      case "apple": return "Apple iCloud Calendar";
      case "outlook": return "Microsoft Outlook Calendar";
      case "ical": return "iCal URL 订阅";
      default: return "手动输入日程";
    }
  }

  function getTodoDescription(provider: string): string {
    switch (provider) {
      case "notion": return "Notion Database";
      case "todoist": return "Todoist API";
      case "ticktick": return "TickTick API";
      default: return "手动管理待办";
    }
  }

  function getFeedDescription(provider: string): string {
    switch (provider) {
      case "rss": return "RSS 订阅源";
      case "zhihu": return "知乎热榜（需自建 API）";
      case "xiaohongshu": return "小红书热门（需自建 API）";
      default: return "手动添加动态";
    }
  }

  // 提供商选项
  const providers = [
    { id: "openai", name: "OpenAI", icon: "🅾️", desc: "GPT-3.5/GPT-4" },
    { id: "deepseek", name: "DeepSeek", icon: "🔷", desc: "国内可用，性价比高" },
    { id: "claude", name: "Claude", icon: "🟣", desc: "Anthropic 官方" },
    { id: "custom", name: "自定义", icon: "⚙️", desc: "其他兼容 API" },
  ];

  // 日历提供商
  const calendarProviders = [
    { id: "manual", name: "手动输入", icon: "✏️", desc: "在代码中直接编辑" },
    { id: "ical", name: "iCal 订阅", icon: "📅", desc: "通过日历 URL 订阅" },
    { id: "google", name: "Google Calendar", icon: "📆", desc: "需 Google API Key（较复杂）" },
  ];

  // 待办提供商
  const todoProviders = [
    { id: "manual", name: "手动输入", icon: "✏️", desc: "在代码中直接编辑" },
    { id: "notion", name: "Notion", icon: "📋", desc: "通过 Notion API 集成" },
    { id: "todoist", name: "Todoist", icon: "✅", desc: "通过 Todoist API" },
  ];

  // 信息流提供商
  const feedProviders = [
    { id: "manual", name: "手动输入", icon: "✏️", desc: "在代码中直接编辑" },
    { id: "rss", name: "RSS 订阅", icon: "📡", desc: "订阅博客/新闻 RSS" },
    { id: "zhihu", name: "知乎热榜", icon: "🔥", desc: "需自建爬虫 API（见文档）" },
    { id: "xiaohongshu", name: "小红书", icon: "📕", desc: "需自建爬虫 API（较困难）" },
  ];

  if (!open) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold">设置</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              {/* PIN 验证 */}
              {settings?.pinSet && !verified && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🔐 输入 PIN 码</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      type="password"
                      placeholder="4位数字 PIN"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    />
                    <Button
                      className="w-full"
                      onClick={verifyPin}
                      disabled={pin.length < 4}
                    >
                      验证
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 设置 PIN */}
              {(!settings?.pinSet || verified) && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {settings?.pinSet ? "🔐 修改 PIN 码" : "🔐 设置 PIN 码（可选）"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        type="password"
                        placeholder="4位数字，留空则不设置"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        PIN 码用于保护您的 API Key
                      </p>
                    </CardContent>
                  </Card>

                  {/* AI 设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🤖 AI 服务商（用于生成总结）</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 提供商选择 */}
                      <div className="grid grid-cols-2 gap-2">
                        {providers.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setProvider(p.id)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              provider === p.id
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-lg">{p.icon}</div>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* API Key */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key</label>
                        <div className="relative">
                          <Input
                            type={showKey ? "text" : "password"}
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {settings?.apiKeyPreview && !apiKey && (
                          <p className="text-xs text-gray-500">
                            已配置: {settings.apiKeyPreview}
                          </p>
                        )}
                      </div>

                      {/* 自定义选项 */}
                      {provider === "custom" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">API URL</label>
                            <Input
                              placeholder="https://api.example.com/v1/chat/completions"
                              value={customUrl}
                              onChange={(e) => setCustomUrl(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">模型名称</label>
                            <Input
                              placeholder="gpt-3.5-turbo"
                              value={customModel}
                              onChange={(e) => setCustomModel(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 日历设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        日历数据源（即将推出）
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                        💡 <strong>提示：</strong>目前使用代码中的模拟数据。后续将支持以下数据源：
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {calendarProviders.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded border border-gray-200 text-sm opacity-60"
                          >
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.desc}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 待办设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        待办数据源（即将推出）
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                        💡 目前使用代码中的模拟数据。后续将支持：
                      </div>
                      <div className="space-y-2">
                        {todoProviders.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded border border-gray-200 text-sm opacity-60"
                          >
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-gray-500">{p.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 信息流设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Rss className="w-4 h-4" />
                        信息流数据源（即将推出）
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                        💡 目前使用代码中的模拟数据。
                      </div>

                      {/* RSS 配置 */}
                      <div className="space-y-3">
                        <div className="font-medium text-sm text-gray-700">支持的来源：</div>
                        <div className="grid grid-cols-2 gap-2">
                          {feedProviders.map((p) => (
                            <div
                              key={p.id}
                              className={`p-2 rounded border text-sm ${
                                p.id === "manual" || p.id === "rss"
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 opacity-60"
                              }`}
                            >
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-gray-500">{p.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RSS URL 输入 */}
                      <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium">RSS 订阅地址（可选）</label>
                        <Input
                          placeholder="https://example.com/feed.xml"
                          value={rssUrl}
                          onChange={(e) => setRssUrl(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          添加 RSS 源后，信息流将显示该源的内容
                        </p>
                      </div>

                      {/* 社交媒体说明 */}
                      <div className="p-3 bg-blue-50 rounded-lg text-sm">
                        <div className="font-medium text-blue-800 mb-1">关于社交媒体接入</div>
                        <div className="text-blue-700 space-y-1">
                          <p>• <strong>知乎/小红书：</strong>官方没有开放 API，需要自建爬虫服务</p>
                          <p>• <strong>替代方案：</strong>使用 RSSHub 等开源工具生成 RSS 源</p>
                          <p>• <strong>推荐：</strong>先用 RSS 订阅博客、新闻网站</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 保存按钮 */}
                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${
                      message.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={saveSettings}
                    disabled={saving || (provider === "custom" && (!customUrl || !customModel))}
                  >
                    {saving ? "保存中..." : "保存设置"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
