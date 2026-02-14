"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Rss, Plus, Settings, Trash2 } from "lucide-react";
import type { FeedSource } from "@/types";

interface SourceManagerProps {
  onSourcesUpdate?: () => void;
}

export function SourceManager({ onSourcesUpdate }: SourceManagerProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sources on mount
  useEffect(() => {
    fetchSources();
  }, []);

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

  async function handleToggle(sourceId: string) {
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });

      if (response.ok) {
        // Update local state
        setSources(sources =>
          sources.map(s =>
            s.id === sourceId ? { ...s, enabled: !s.enabled } : s
          )
        );
        // Notify parent to refresh
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

  const enabledSources = sources.filter(s => s.enabled);
  const enabledCount = enabledSources.length;

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-sm text-gray-500">
            加载中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Rss className="w-4 h-4 text-gray-500" />
            信息源
          </CardTitle>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 已启用源列表 */}
        <div className="space-y-3">
          {enabledSources.map(source => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{source.icon}</span>
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
        </div>

        {/* 禁用的源 */}
        {showConfig && sources.filter(s => !s.enabled).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              已禁用
            </h4>
            <div className="space-y-2">
              {sources.filter(s => !s.enabled).map(source => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{source.icon}</span>
                    <span className="text-sm text-gray-600">{source.name}</span>
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
        {showConfig && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              添加信息源
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <Plus className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  自定义 RSS
                </span>
                <p className="text-xs text-gray-400">
                  输入 RSS 链接
                </p>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <Rss className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  热榜/API
                </span>
                <p className="text-xs text-gray-400">
                  知乎热榜、微博热搜等
                </p>
              </button>
            </div>
            <p className="text-xs text-gray-400 col-span-2 text-center pt-2">
              添加新源功能即将推出
            </p>
          </div>
        )}

        {/* 空状态 */}
        {enabledCount === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">
              暂无信息源
            </p>
            <button
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              添加信息源
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
