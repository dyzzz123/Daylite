"use client";

import { useState, useEffect } from "react";
import { X, Rss, Plus, Settings, Trash2, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AddRssDialog } from "./add-rss-dialog";
import type { FeedSource } from "@/types";

interface AISettingsState {
  provider: "deepseek" | "custom";
  apiKey: string;
  apiUrl: string;
  model: string;
}

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdate?: () => void;
}

export function SettingsSidebar({ isOpen, onClose, onSourcesUpdate }: SettingsSidebarProps) {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addRssOpen, setAddRssOpen] = useState(false);

  // AI配置状态
  const [aiSettings, setAiSettings] = useState<AISettingsState>({
    provider: "deepseek",
    apiKey: "",
    apiUrl: "",
    model: "",
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch sources when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchSources();
      fetchAISettings();
    }
  }, [isOpen]);

  async function fetchSources() {
    try {
      setLoading(true);
      const response = await fetch("/api/sources");
      if (!response.ok) throw new Error("Failed to fetch sources");

      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAISettings() {
    try {
      const response = await fetch("/api/settings/ai");
      if (!response.ok) return;

      const data = await response.json();
      if (data.configured) {
        setAiSettings({
          provider: data.provider || "deepseek",
          apiKey: "", // 不读取API Key，只显示已配置状态
          apiUrl: data.apiUrl || "",
          model: data.model || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch AI settings:", err);
    }
  }

  async function saveAISettings() {
    try {
      setAiSaving(true);

      // 验证必填字段
      if (!aiSettings.apiKey) {
        alert("请填写 API Key");
        return;
      }

      // 自定义模式需要验证API地址和模型ID
      if (aiSettings.provider === "custom") {
        if (!aiSettings.apiUrl) {
          alert("请填写 API 地址");
          return;
        }
        if (!aiSettings.model) {
          alert("请填写模型ID");
          return;
        }
      }

      const response = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "保存失败");
        return;
      }

      alert("AI配置已保存");
    } catch (err) {
      console.error("Failed to save AI settings:", err);
      alert("保存失败，请重试");
    } finally {
      setAiSaving(false);
    }
  }

  async function handleToggle(sourceId: string) {
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });

      if (response.ok) {
        setSources(sources =>
          sources.map(s =>
            s.id === sourceId ? { ...s, enabled: !s.enabled } : s
          )
        );
        if (onSourcesUpdate) onSourcesUpdate();
      }
    } catch (err) {
      console.error("Failed to toggle source:", err);
    }
  }

  async function handleDelete(sourceId: string) {
    if (!confirm("确定要删除这个信息源吗？")) return;

    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSources(sources.filter(s => s.id !== sourceId));
        if (onSourcesUpdate) onSourcesUpdate();
      }
    } catch (err) {
      console.error("Failed to delete source:", err);
    }
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      rss: 'RSS 订阅',
      xiaohongshu: '小红书',
      zhihu: '知乎热榜',
      weibo: '微博热搜',
      forum: '论坛',
    };
    return labels[type] || type;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                设置
              </h2>
              <p className="text-xs text-gray-500">
                管理你的信息源
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto h-[calc(100%-73px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 已启用的源 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                  <span>已启用</span>
                  <span className="text-xs text-gray-400 font-normal">
                    {sources.filter(s => s.enabled).length} 个
                  </span>
                </h3>
                <div className="space-y-2">
                  {sources.filter(s => s.enabled).map(source => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{source.name}</p>
                          <p className="text-xs text-gray-500">
                            {getTypeLabel(source.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={source.enabled}
                          onCheckedChange={() => handleToggle(source.id)}
                          className="scale-90"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sources.filter(s => s.enabled).length === 0 && (
                    <div className="text-center py-6 text-sm text-gray-400">
                      暂无启用的信息源
                    </div>
                  )}
                </div>
              </div>

              {/* 已禁用的源 */}
              {sources.filter(s => !s.enabled).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>已禁用</span>
                    <span className="text-xs text-gray-400 font-normal">
                      {sources.filter(s => !s.enabled).length} 个
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {sources.filter(s => !s.enabled).map(source => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{source.name}</p>
                            <p className="text-xs text-gray-400">
                              {getTypeLabel(source.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={() => handleToggle(source.id)}
                            className="scale-90"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => handleDelete(source.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 添加新源 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  添加信息源
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setAddRssOpen(true)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                        自定义 RSS
                      </p>
                      <p className="text-xs text-gray-400">
                        输入 RSS 链接添加订阅
                      </p>
                    </div>
                  </button>
                  <button
                    disabled
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 opacity-50 cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Rss className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">
                        热榜/API
                      </p>
                      <p className="text-xs text-gray-400">
                        知乎热榜、微博热搜等
                      </p>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center pt-4">
                  更多信息源类型即将推出
                </p>
              </div>

              {/* AI 配置 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 汇报配置
                </h3>
                <div className="space-y-3">
                  {/* Provider 选择 */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      AI 服务商
                    </label>
                    <select
                      value={aiSettings.provider}
                      onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value as any, apiUrl: "", model: "" })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={aiSaving}
                    >
                      <option value="deepseek">DeepSeek (官方API)</option>
                      <option value="custom">自定义 (第三方/API代理)</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {aiSettings.provider === "deepseek"
                        ? "使用DeepSeek官方API，自动配置模型"
                        : "支持OpenAI兼容的第三方API服务"}
                    </p>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={aiSettings.apiKey}
                        onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={aiSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 自定义 API URL 和 Model（仅在 custom 模式下显示） */}
                  {aiSettings.provider === "custom" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5">
                          API 地址 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={aiSettings.apiUrl}
                          onChange={(e) => setAiSettings({ ...aiSettings, apiUrl: e.target.value })}
                          placeholder="https://api.example.com/v1/chat/completions"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={aiSaving}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          填写第三方API服务的完整地址
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5">
                          模型ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={aiSettings.model}
                          onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                          placeholder="例如: claude-sonnet-4-5-20250929 或 gpt-4o"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={aiSaving}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          填写API服务商提供的具体模型ID
                        </p>
                      </div>
                    </>
                  )}

                  {/* 保存按钮 */}
                  <Button
                    onClick={saveAISettings}
                    disabled={
                      aiSaving ||
                      !aiSettings.apiKey ||
                      (aiSettings.provider === "custom" && (!aiSettings.apiUrl || !aiSettings.model))
                    }
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {aiSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        保存中
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        保存 AI 配置
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    配置后可在主界面使用 AI 汇报功能
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add RSS Dialog */}
        <AddRssDialog
          isOpen={addRssOpen}
          onClose={() => setAddRssOpen(false)}
          onSourceAdded={() => {
            fetchSources();
            if (onSourcesUpdate) onSourcesUpdate();
          }}
        />
      </div>
    </>
  );
}
