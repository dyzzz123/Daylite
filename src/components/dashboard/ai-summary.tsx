"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { MOCK_DATA } from "@/lib/mock-data";
import { SettingsDrawer } from "@/components/settings/settings-drawer";

interface SummaryResponse {
  summary: string;
  isMock?: boolean;
  error?: string;
}

export function AISummary() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 手动刷新功能
  async function handleRefresh() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: MOCK_DATA }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch AI summary:", err);
      setError("生成失败，请重试");
      setData({
        summary: "点击刷新以生成今日总结",
        isMock: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // 初始状态：显示提示
  if (!data && !loading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-500" />
            今日 AI 概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 py-2">
            点击下方按钮生成今日总结
          </p>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full mt-2"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {loading ? "生成中..." : "刷新分析"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
            AI 正在分析...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-gray-100" />
            <Skeleton className="h-4 w-[90%] bg-gray-100" />
            <Skeleton className="h-4 w-[95%] bg-gray-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-600" />
              今日 AI 概览
              {data?.isMock && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                  演示
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="text-gray-500 hover:text-gray-700 h-7 px-2"
            >
              <Settings className="w-3.5 h-3.5 mr-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-start gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">
              {data?.summary}
            </p>
          )}
        </CardContent>
      </Card>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
