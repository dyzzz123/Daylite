"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  totalEvents: number;
  uniqueSessions: number;
  eventsByType: Array<{ eventType: string; count: number }>;
  topEvents: Array<{ eventName: string; count: number }>;
  dailyEvents: Array<{ date: string; count: number }>;
  recentEvents: Array<{
    eventName: string;
    eventType: string;
    properties: any;
    pageUrl: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [days]);

  async function fetchStats() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/stats?days=${days}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">数据统计</h1>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📊 数据统计</h1>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="1">最近 1 天</option>
            <option value="7">最近 7 天</option>
            <option value="30">最近 30 天</option>
          </select>
        </div>

        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>总事件数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalEvents || 0}</p>
              <p className="text-sm text-gray-500 mt-2">最近 {days} 天</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>唯一会话数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.uniqueSessions || 0}</p>
              <p className="text-sm text-gray-500 mt-2">不同用户访问</p>
            </CardContent>
          </Card>
        </div>

        {/* 事件类型分布 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>事件类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.eventsByType.map((item) => (
                <div key={item.eventType} className="flex items-center">
                  <div className="w-32 text-sm font-medium">{item.eventType}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{
                        width: `${(item.count / (stats?.totalEvents || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 事件 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>最常见事件 (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.topEvents.slice(0, 10).map((item, index) => (
                <div key={item.eventName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 mr-3">{index + 1}</span>
                    <span className="text-sm font-medium">{item.eventName}</span>
                  </div>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近事件 */}
        <Card>
          <CardHeader>
            <CardTitle>最近事件 (最新 20 条)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats?.recentEvents.slice(0, 20).map((event, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{event.eventName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {event.eventType} {event.properties && `| ${JSON.stringify(event.properties)}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
