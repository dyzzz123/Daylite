"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/dashboard/feed-card";
import { SettingsSidebar } from "@/components/dashboard/settings-sidebar";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import type { FeedItem, FeedSource } from "@/types";

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  isMock?: boolean;
  fromCache?: boolean;
  isFresh?: boolean;
  error?: string;
}

export default function DashboardPage() {
  // Data state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const today = new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // 根据时间获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  // 获取生成时间
  const getGeneratedTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Fetch feed items
  async function fetchFeeds() {
    try {
      const response = await fetch("/api/feeds?limit=20");
      if (!response.ok) throw new Error("Failed to fetch feeds");

      const data = await response.json();
      setFeed(data.items || []);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
      setError("获取信息流失败");
    }
  }

  // Fetch sources (only enabled ones)
  async function fetchSources() {
    try {
      const response = await fetch("/api/sources");
      if (!response.ok) throw new Error("Failed to fetch sources");

      const data = await response.json();
      // Filter to only show enabled sources in the feed
      setSources((data.sources || []).filter((s: FeedSource) => s.enabled));
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    }
  }

  // Fetch AI summary
  async function fetchSummary() {
    try {
      setSummaryLoading(true);
      setError(null);

      console.log('[fetchSummary] 开始请求AI汇总...');

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forceRefresh: true }), // 强制刷新，不使用缓存
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const result = await response.json();

      console.log('[fetchSummary] AI汇总响应:', {
        isMock: result.isMock,
        isFresh: result.isFresh,
        fromCache: result.fromCache,
        hasSummary: !!result.summary,
        hasKeyPoints: !!result.keyPoints,
      });

      setSummaryData(result);
    } catch (err) {
      console.error("Failed to fetch AI summary:", err);
      setError("获取 AI 汇报失败");
    } finally {
      setSummaryLoading(false);
    }
  }

  // Initial data load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      await Promise.all([fetchFeeds(), fetchSources(), fetchSummary()]);
      setLoading(false);
    }

    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {today}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {getGreeting()}，John
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.href = '/playground'}
              >
                <Sparkles className="w-4 h-4" />
                UI 演示工坊
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* 今日 AI 汇报 */}
          <div className="p-6">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {summaryData?.isMock && (
                  <span className="text-xs text-muted-foreground">
                    演示模式
                  </span>
                )}
                {!summaryData?.isMock && summaryData?.fromCache && (
                  <span className="text-xs text-muted-foreground">
                    已缓存
                  </span>
                )}
                {!summaryData?.isMock && summaryData?.isFresh && (
                  <span className="text-xs text-muted-foreground">
                    {getGeneratedTime()} 生成
                  </span>
                )}
              </div>
              <Button
                onClick={fetchSummary}
                disabled={summaryLoading}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* 加载状态 */}
            {summaryLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>AI 正在整理你的信息...</span>
                </div>
              </div>
            )}

            {/* 内容 */}
            {!summaryLoading && summaryData && (
              <div className="space-y-4">
                {/* 总结 */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-base text-foreground leading-relaxed">
                    {summaryData.summary}
                  </p>
                </div>

                {/* 关键点 */}
                {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                  <ul className="space-y-2">
                    {summaryData.keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground
                                     animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${(index + 1) * 100}ms` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 错误状态 */}
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 信息流 */}
          <FeedCard items={feed} onRefresh={fetchFeeds} />
        </div>

        {/* Settings Sidebar */}
        <SettingsSidebar
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSourcesUpdate={fetchSources}
        />

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              个人信息聚合仪表盘 • {summaryData?.isMock ? '演示模式' : 'AI 汇报'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
