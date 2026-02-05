"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Rss, Check, ChevronRight, RefreshCw } from "lucide-react";
import type { FeedItem, FeedSource } from "@/types";

interface FeedCardProps {
  items: FeedItem[];
  sources?: FeedSource[];
  onRefresh?: () => void;
}

export function FeedCard({ items, sources = [], onRefresh }: FeedCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredItems = filterSource
    ? items.filter(item => item.source === filterSource)
    : items;

  const lastUpdateTime = items.length > 0
    ? new Date(Math.max(...items.map(item => new Date(item.publishTime).getTime())))
    : null;

  function formatTime(date: Date | string) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (hours < 48) {
      return `${Math.floor(hours / 24)}天前`;
    }
    return '更早';
  }

  function getSourceIcon(source: string) {
    const found = sources.find(s => s.type === source);
    return found?.icon || '📄';
  }

  async function handleRefresh() {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      // Trigger fetch to get new data
      await fetch('/api/fetch', { method: 'POST' });
      // Then refresh the display
      await onRefresh();
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Rss className="w-4 h-4 text-gray-500" />
            信息流
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdateTime && (
              <span className="text-xs text-gray-400">
                更新于 {formatTime(lastUpdateTime)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 源过滤器 */}
        {sources.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterSource(null)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filterSource === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              全部
            </button>
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => setFilterSource(filterSource === source.type ? null : source.type)}
                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                  filterSource === source.type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{source.icon}</span>
                <span className="hidden sm:inline">{source.name}</span>
                {filterSource === source.type && (
                  <Check className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* 信息列表 */}
        <div className="space-y-2">
          {filteredItems.map(item => {
            const isExpanded = expanded === item.id;
            const sourceIcon = getSourceIcon(item.source);

            return (
              <div
                key={item.id}
                className="border-l-2 rounded-lg overflow-hidden transition-all bg-white hover:shadow-sm"
              >
                <div className="p-3">
                  {/* 头部 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {sourceIcon}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.sourceName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(item.publishTime)}
                    </span>
                  </div>

                  {/* 标题 */}
                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>

                  {/* 摘要 */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {item.summary}
                  </p>

                  {/* 标签 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {item.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] h-5 px-1.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 展开/收起 */}
                  {item.url && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 py-2 mt-1"
                    >
                      <span>{isExpanded ? '收起' : '查看详情'}</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  )}

                  {/* 展开内容 */}
                  {isExpanded && item.url && (
                    <div className="pt-2 border-t border-gray-100">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        查看原文 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              暂无信息
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
