"use client";

import { useState, useEffect } from "react";
import { X, Rss, Plus, Settings, Trash2, Sparkles, Eye, EyeOff, Loader2, Check, AlertCircle, Edit, Pencil, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { validateRSSFromClient } from "@/lib/client-rss-fetcher";
import { AI_ROLE_TEMPLATES } from "@/lib/ai-roles";
import type { FeedSource } from "@/types";
import { trackAction, trackConfig, EventNames } from "@/lib/analytics";

interface AISettingsState {
  provider: "deepseek" | "custom";
  apiKey: string;
  apiUrl: string;
  model: string;
  aiRole: string;
}

interface QueueItem {
  url: string;
  status: 'validating' | 'success' | 'error';
  message: string;
  name?: string;
  icon?: string;
  type?: 'rss' | 'blog';
  abortController?: AbortController;
}

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdate?: () => void;
  onAISummaryToggle?: (enabled: boolean) => void;
}

export function SettingsSidebar({ isOpen, onClose, onSourcesUpdate, onAISummaryToggle }: SettingsSidebarProps) {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(false); // 初始值改为 false，避免面板未打开时显示加载中

  // AI配置状态
  const [aiSettings, setAiSettings] = useState<AISettingsState>({
    provider: "deepseek",
    apiKey: "",
    apiUrl: "",
    model: "",
    aiRole: AI_ROLE_TEMPLATES.default.prompt,
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>("default");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiEditMode, setAiEditMode] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{
    provider: string;
    apiUrl: string;
    model: string;
    apiKeyPreview: string;
  } | null>(null);

  // RSS 添加状态
  const [rssUrl, setRssUrl] = useState("");
  const [rssQueue, setRssQueue] = useState<QueueItem[]>([]);

  // 编辑状态
  const [editingSource, setEditingSource] = useState<FeedSource | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editValidating, setEditValidating] = useState(false);
  const [editValidationResult, setEditValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  // 后台验证订阅源（RSS 或博客）
  async function validateInBackground(
    itemUrl: string,
    itemName: string,
    abortSignal?: AbortSignal
  ): Promise<{ valid: boolean; name?: string; icon?: string; type?: 'rss' | 'blog'; message: string }> {
    // 规范化URL
    let normalizedUrl = itemUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // 检查是否已取消
      if (abortSignal?.aborted) {
        return {
          valid: false,
          message: "已取消",
        };
      }

      // 步骤1: 尝试服务端验证（通用订阅源验证）
      const serverResponse = await fetch("/api/sources/validate-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: abortSignal,
      });

      const serverData = await serverResponse.json();

      if (serverData.valid) {
        return {
          valid: true,
          name: serverData.metadata?.title || itemName,
          icon: serverData.metadata?.icon, // 获取 favicon URL
          type: serverData.type || 'rss', // 订阅源类型
          message: "✓ 验证成功",
        };
      }

      // 检查是否已取消
      if (abortSignal?.aborted) {
        return {
          valid: false,
          message: "已取消",
        };
      }

      // 步骤2: 服务端验证失败，尝试浏览器验证
      const clientResult = await validateRSSFromClient(normalizedUrl);

      if (clientResult.valid && clientResult.metadata) {
        return {
          valid: true,
          name: clientResult.metadata.title || itemName,
          message: "✓ 验证成功",
        };
      } else {
        return {
          valid: false,
          message: "验证失败，请检查链接",
        };
      }
    } catch (err) {
      return {
        valid: false,
        message: "网络错误",
      };
    }
  }

  // 添加到队列并开始后台验证
  function addToQueue() {
    if (!rssUrl.trim()) return;

    const normalizedUrl = rssUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      setRssUrl(`https://${normalizedUrl}`);
    }

    // 创建 AbortController 用于取消
    const abortController = new AbortController();

    // 添加到队列
    const newItem: QueueItem = {
      url: rssUrl.trim(),
      name: rssUrl.trim(), // 初始名称使用 URL，验证后会更新
      status: 'validating',
      message: '正在验证...',
      abortController,
    };

    setRssQueue(prev => [...prev, newItem]);

    // 清空输入框
    setRssUrl("");

    // 后台验证
    validateInBackground(newItem.url, newItem.name || newItem.url, abortController.signal).then(result => {
      // 如果验证被取消（message 为 "已取消"），不执行任何操作
      if (result.message === "已取消") {
        return;
      }

      setRssQueue(prev => prev.map(item =>
        item.url === newItem.url
          ? {
              ...item,
              status: result.valid ? 'success' : 'error',
              message: result.message,
              name: result.name || item.name,
              icon: result.icon,
            }
          : item
      ));

      // 如果验证成功，自动保存
      if (result.valid && result.name) {
        saveSource({
          url: newItem.url,
          name: result.name,
          icon: result.icon,
          type: result.type,
        });
      }
    }).catch(err => {
      // 如果是因为取消导致的错误，忽略
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Validation error:', err);
    });
  }

  // 取消验证
  function cancelValidation(index: number) {
    setRssQueue(prev => {
      const item = prev[index];
      if (item?.abortController) {
        item.abortController.abort();
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  // 保存订阅源
  async function saveSource({ url, name, icon, type }: { url: string; name: string; icon?: string; type?: 'rss' | 'blog' }) {
    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: type || "rss",  // 使用检测到的类型，默认为 rss
          icon: icon || (type === 'blog' ? "📝" : "📰"),  // 博客使用 📝，RSS 使用 📰
          url: url.trim(),
          enabled: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 自动触发抓取
        fetch("/api/fetch", { method: "POST" });

        // 立即更新本地 sources 列表
        setSources(prev => [...prev, data.source]);

        // 通知父组件
        if (onSourcesUpdate) onSourcesUpdate();

        // 更新队列状态
        setRssQueue(prev => prev.map(item =>
          item.url === url
            ? { ...item, status: 'success', message: '✓ 添加成功' }
            : item
        ));
      } else {
        const data = await response.json();
        setRssQueue(prev => prev.map(item =>
          item.url === url
            ? { ...item, status: 'error', message: data.error || '添加失败' }
            : item
        ));
      }
    } catch (err) {
      setRssQueue(prev => prev.map(item =>
        item.url === url
          ? { ...item, status: 'error', message: '网络错误' }
          : item
      ));
    }
  }

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
        setAiConfigured(true);
        // 保存当前配置信息（用于展示）
        setCurrentConfig({
          provider: data.provider || "deepseek",
          apiUrl: data.apiUrl || "",
          model: data.model || "",
          apiKeyPreview: data.apiKeyPreview || "",
        });

        // 判断是否是预设角色
        let matchedRoleKey = "custom";
        for (const [key, template] of Object.entries(AI_ROLE_TEMPLATES)) {
          if (data.aiRole === template.prompt) {
            matchedRoleKey = key;
            break;
          }
        }

        setAiSettings({
          provider: data.provider || "deepseek",
          apiKey: "", // 不读取API Key，只显示已配置状态
          apiUrl: data.apiUrl || "",
          model: data.model || "",
          aiRole: data.aiRole || AI_ROLE_TEMPLATES.default.prompt,
        });
        setSelectedRoleKey(matchedRoleKey);
        setAiEditMode(false); // 配置好后默认非编辑模式
      } else {
        setAiConfigured(false);
        setAiEditMode(true); // 未配置时默认编辑模式
      }
      setAiSummaryEnabled(data.aiSummaryEnabled ?? true);
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

      // 自定义模式需要验证API地址，模型ID可选
      if (aiSettings.provider === "custom") {
        if (!aiSettings.apiUrl) {
          alert("请填写 API 地址");
          return;
        }
      }

      const response = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiSettings, aiSummaryEnabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "保存失败");
        return;
      }

      const data = await response.json();

      // 埋点：AI 配置保存
      trackConfig(EventNames.AI_CONFIG_SAVE, {
        provider: aiSettings.provider,
        hasModel: !!aiSettings.model,
        hasCustomUrl: !!aiSettings.apiUrl,
        apiTestResult: data.testResult?.valid || false,
      });

      // 更新配置状态
      setAiConfigured(true);
      setCurrentConfig({
        provider: aiSettings.provider,
        apiUrl: aiSettings.apiUrl,
        model: aiSettings.model,
        apiKeyPreview: aiSettings.apiKey.slice(0, 4) + "****",
      });
      setAiEditMode(false);

      // 清空 API Key 输入（安全考虑）
      setAiSettings(prev => ({ ...prev, apiKey: "" }));

      // 检查测试结果
      if (data.testResult) {
        if (data.testResult.valid) {
          alert(`✓ ${data.testResult.message || "API 配置有效，连接成功"}`);
        } else {
          alert(`⚠️ 配置已保存，但 API 测试失败：\n${data.testResult.error || "未知错误"}`);
        }
      } else {
        alert("AI配置已保存");
      }
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

  // 开始编辑
  function startEdit(source: FeedSource) {
    setEditingSource(source);
    setEditName(source.name);
    setEditUrl(source.url || "");
    setEditValidationResult(null);
  }

  // 取消编辑
  function cancelEdit() {
    setEditingSource(null);
    setEditName("");
    setEditUrl("");
    setEditValidationResult(null);
    setEditValidating(false);
  }

  // 验证编辑的 URL
  async function validateEditUrl() {
    if (!editUrl.trim()) {
      setEditValidationResult({ valid: false, message: "请输入 RSS 链接" });
      return;
    }

    setEditValidating(true);
    setEditValidationResult(null);

    try {
      // 规范化URL
      let normalizedUrl = editUrl.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // 尝试服务端验证
      const serverResponse = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const serverData = await serverResponse.json();

      if (serverData.valid) {
        setEditValidationResult({
          valid: true,
          message: "✓ 验证成功",
        });
        // 更新输入框为规范化后的 URL
        setEditUrl(normalizedUrl);
      } else {
        // 尝试浏览器验证
        const clientResult = await validateRSSFromClient(normalizedUrl);

        if (clientResult.valid) {
          setEditValidationResult({
            valid: true,
            message: "✓ 验证成功",
          });
          setEditUrl(normalizedUrl);
        } else {
          setEditValidationResult({
            valid: false,
            message: "验证失败，请检查链接",
          });
        }
      }
    } catch (err) {
      setEditValidationResult({
        valid: false,
        message: "网络错误",
      });
    } finally {
      setEditValidating(false);
    }
  }

  // 保存编辑
  async function saveEdit() {
    if (!editingSource) return;

    // 如果 URL 被修改了，检查验证结果
    const urlChanged = editUrl !== (editingSource.url || "");
    if (urlChanged && editUrl.trim()) {
      if (!editValidationResult?.valid) {
        alert("请先验证 RSS 链接");
        return;
      }
    }

    try {
      const response = await fetch(`/api/sources/${editingSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          url: editUrl.trim() || undefined,
        }),
      });

      if (response.ok) {
        // 更新本地状态
        setSources(sources =>
          sources.map(s =>
            s.id === editingSource.id
              ? { ...s, name: editName.trim(), url: editUrl.trim() || undefined }
              : s
          )
        );

        // 通知父组件
        if (onSourcesUpdate) onSourcesUpdate();

        // 关闭编辑
        cancelEdit();
      } else {
        alert("保存失败");
      }
    } catch (err) {
      console.error("Failed to update source:", err);
      alert("保存失败");
    }
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      rss: '订阅源',
      blog: '博客',
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              设置
            </h2>
            <p className="text-xs text-gray-500">
              管理你的信息源
            </p>
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
                        {source.type === 'rss' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-blue-500"
                            onClick={() => startEdit(source)}
                            title="编辑"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
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
                          {source.type === 'rss' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-blue-500"
                              onClick={() => startEdit(source)}
                              title="编辑"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
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
                  添加订阅源
                </h3>

                {/* 队列显示 */}
                {rssQueue.length > 0 && (
                  <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                    {rssQueue.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2 border border-gray-200"
                      >
                        {item.status === 'validating' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                        )}
                        {item.status === 'success' && (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.url}</p>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{item.message}</span>
                        {item.status === 'validating' && (
                          <button
                            onClick={() => cancelValidation(index)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0 px-2 py-1 text-xs rounded hover:bg-red-50 transition-colors"
                          >
                            取消
                          </button>
                        )}
                        {(item.status === 'success' || item.status === 'error') && (
                          <button
                            onClick={() => setRssQueue(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* RSS 输入 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToQueue();
                        }
                      }}
                      placeholder="example.com/feed"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addToQueue}
                      disabled={!rssUrl.trim()}
                      className="whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI 配置 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  AI 汇报配置
                </h3>
                <div className="space-y-3">
                  {/* AI 汇报开关 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs text-gray-600">
                        启用 AI 汇报
                      </label>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        在首页显示 AI 生成的每日汇总
                      </p>
                    </div>
                    <Switch
                      checked={aiSummaryEnabled}
                      onCheckedChange={(checked) => {
                        setAiSummaryEnabled(checked);
                        // 通知父组件更新状态
                        if (onAISummaryToggle) {
                          onAISummaryToggle(checked);
                        }
                        // 立即保存开关状态
                        fetch("/api/settings/ai", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...aiSettings,
                            aiSummaryEnabled: checked,
                            apiKey: aiSettings.apiKey || "placeholder", // 避免验证失败
                          }),
                        }).catch(console.error);
                      }}
                      disabled={aiSaving}
                      className="scale-90"
                    />
                  </div>

                  {/* 已配置状态卡片 */}
                  {aiConfigured && currentConfig && !aiEditMode && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">API 已配置</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiEditMode(true)}
                          className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          编辑
                        </button>
                      </div>
                      <div className="space-y-1 text-xs text-green-700">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">服务商:</span>
                          <span className="font-medium">{currentConfig.provider === "deepseek" ? "DeepSeek" : "自定义"}</span>
                        </div>
                        {currentConfig.provider === "custom" && currentConfig.apiUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">地址:</span>
                            <span className="font-medium truncate max-w-[200px]" title={currentConfig.apiUrl}>
                              {currentConfig.apiUrl}
                            </span>
                          </div>
                        )}
                        {currentConfig.model && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">模型:</span>
                            <span className="font-medium">{currentConfig.model}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">API Key:</span>
                          <span className="font-medium font-mono">{currentConfig.apiKeyPreview}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 编辑模式或未配置时显示完整表单 */}
                  {(!aiConfigured || aiEditMode) && (
                    <>
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
                        {!aiEditMode && aiConfigured && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            留空保持当前 API Key 不变
                          </p>
                        )}
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
                              模型ID <span className="text-gray-400">(可选)</span>
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
                              不填写将使用默认模型 gpt-3.5-turbo
                            </p>
                          </div>
                        </>
                      )}

                      {/* AI 角色设定 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5">
                          AI 角色设定 <span className="text-gray-400">(可选)</span>
                        </label>

                        {/* 预设角色选择 */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            disabled={aiSaving}
                          >
                            <span>{AI_ROLE_TEMPLATES[selectedRoleKey as keyof typeof AI_ROLE_TEMPLATES]?.name || "自定义"}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showRoleDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                              {Object.entries(AI_ROLE_TEMPLATES).map(([key, template]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoleKey(key);
                                    setAiSettings({ ...aiSettings, aiRole: template.prompt });
                                    setShowRoleDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                >
                                  {template.name}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoleKey("custom");
                                  setShowRoleDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-gray-100 last:rounded-b-lg"
                              >
                                自定义
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 角色描述输入框 */}
                        <textarea
                          value={aiSettings.aiRole}
                          onChange={(e) => {
                            setAiSettings({ ...aiSettings, aiRole: e.target.value });
                            setSelectedRoleKey("custom");
                          }}
                          placeholder="设定 AI 的角色和关注重点，例如：你是一位人力资源专家，重点关注人事变动、招聘信息和组织架构调整..."
                          rows={3}
                          className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          disabled={aiSaving}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          设定 AI 的角色和关注重点，让汇报更符合你的需求
                        </p>
                      </div>

                      {/* 按钮组 */}
                      <div className="flex gap-2">
                        <Button
                          onClick={saveAISettings}
                          disabled={
                            aiSaving ||
                            !aiSettings.apiKey ||
                            (aiSettings.provider === "custom" && !aiSettings.apiUrl)
                          }
                          className="flex-1"
                        >
                          {aiSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              保存中
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              {aiEditMode ? "更新配置" : "保存配置"}
                            </>
                          )}
                        </Button>
                        {aiEditMode && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAiEditMode(false);
                              setAiSettings(prev => ({ ...prev, apiKey: "" }));
                            }}
                            disabled={aiSaving}
                          >
                            取消
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 text-center">
                        配置后可在主界面使用 AI 汇报功能
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 编辑对话框 */}
        {editingSource && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
              onClick={cancelEdit}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                      <Pencil className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        编辑订阅源
                      </h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelEdit}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Form */}
                <div className="px-6 py-4 space-y-4 flex-shrink-0 overflow-y-auto">
                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      名称
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="RSS 源名称"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      RSS 链接
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => {
                          setEditUrl(e.target.value);
                          setEditValidationResult(null);
                        }}
                        placeholder="https://example.com/feed"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={validateEditUrl}
                        disabled={!editUrl.trim() || editValidating}
                        className="whitespace-nowrap"
                      >
                        {editValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            验证中
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            验证
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 验证结果 */}
                    {editValidationResult && (
                      <div className={`mt-2 text-xs flex items-center gap-1 ${
                        editValidationResult.valid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {editValidationResult.valid ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {editValidationResult.message}
                      </div>
                    )}

                    {/* 提示信息 */}
                    {editUrl !== editingSource.url && editUrl.trim() && !editValidationResult && (
                      <p className="text-xs text-gray-400 mt-1">
                        ⚠️ 链接已修改，请先验证后再保存
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={saveEdit}
                    disabled={!editName.trim() || (editUrl !== editingSource.url && !editValidationResult?.valid)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
