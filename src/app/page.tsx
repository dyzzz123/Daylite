"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/dashboard/feed-card";
import { SourceManager } from "@/components/dashboard/source-manager";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import type { FeedItem, FeedSource } from "@/types";

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  isMock?: boolean;
  fromCache?: boolean;
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

  const today = new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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

  // Fetch sources
  async function fetchSources() {
    try {
      const response = await fetch("/api/sources");
      if (!response.ok) throw new Error("Failed to fetch sources");

      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    }
  }

  // Fetch AI summary
  async function fetchSummary() {
    try {
      setSummaryLoading(true);
      setError(null);

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const result = await response.json();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {today}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                早安，Lenny
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-gray-400">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* 今日 AI 汇报 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100/50 shadow-sm">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    今日 AI 汇报
                  </h2>
                  {summaryData?.isMock && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">
                      演示
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={fetchSummary}
                disabled={summaryLoading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                {summaryLoading ? "生成中..." : "刷新汇总"}
              </Button>
            </div>

            {/* 加载状态 */}
            {summaryLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI 正在整理你的信息...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-blue-100 rounded animate-pulse" />
                  <div className="h-2 bg-blue-100/50 rounded animate-pulse" />
                  <div className="h-2 bg-blue-100/30 rounded animate-pulse" />
                </div>
              </div>
            )}

            {/* 内容 */}
            {!summaryLoading && summaryData && (
              <div className="space-y-4">
                {/* 总结 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    今日总结
                  </p>
                  <p className="text-base text-gray-900 leading-relaxed">
                    {summaryData.summary}
                  </p>
                </div>

                {/* 关键点 */}
                {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      关键要点
                    </p>
                    <ul className="space-y-1">
                      {summaryData.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 错误状态 */}
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 信息流 */}
          <FeedCard items={feed} sources={sources} onRefresh={fetchFeeds} />
          <SourceManager onSourcesUpdate={fetchSources} />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-200">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs text-gray-400">
              个人信息聚合仪表盘 • {summaryData?.isMock ? '演示模式' : 'AI 汇报'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
