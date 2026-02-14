"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types";

interface FeedCardProps {
  items: FeedItem[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function FeedCard({ items, onRefresh, loading = false }: FeedCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  function formatTime(date: Date | string) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
    <div>
      {/* 顶部工具栏 - 隐藏刷新按钮因为已经整合到顶部 */}
      {/* <div className="flex items-center justify-end mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </Button>
      </div> */}

        {/* 信息列表 */}
        <div className="space-y-3">
          {/* 骨架屏加载状态 - 脉冲加载 */}
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl border-0
                                  bg-white dark:bg-gray-800
                                  shadow-lg p-4
                                  animate-in slide-in-from-bottom-4 fade-in duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* 脉冲加载动画 */}
                  <div className="h-3 w-20 bg-primary/10 rounded mb-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  <div className="h-5 w-full bg-primary/10 rounded mb-1.5 animate-pulse" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                  <div className="h-5 w-3/4 bg-primary/10 rounded mb-1.5 animate-pulse" style={{ animationDelay: `${i * 100 + 300}ms` }} />
                  <div className="h-3 w-16 bg-primary/10 rounded mb-3 animate-pulse" style={{ animationDelay: `${i * 100 + 450}ms` }} />
                  <div className="h-4 w-full bg-primary/10 rounded mb-1 animate-pulse" style={{ animationDelay: `${i * 100 + 600}ms` }} />
                  <div className="h-4 w-5/6 bg-primary/10 rounded mb-1 animate-pulse" style={{ animationDelay: `${i * 100 + 750}ms` }} />
                  <div className="h-4 w-4/5 bg-primary/10 rounded animate-pulse" style={{ animationDelay: `${i * 100 + 900}ms` }} />
                </div>
              ))}
            </div>
          )}

          {/* 正常信息列表 - 现代阴影风格 + 上浮效果 + 滑入动画 */}
          {!loading && items.map((item, index) => {
            // 判断是否应该显示摘要
            const shouldShowSummary = item.summary &&
              item.summary.trim() !== item.title.trim() &&
              !item.summary.includes(item.title);

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border-0
                                bg-white dark:bg-gray-800
                                shadow-lg hover:shadow-2xl
                                hover:-translate-y-2
                                transition-all duration-200 ease-out
                                animate-in slide-in-from-bottom-4 fade-in duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative p-4">
                  {/* 文章来源和时间 - 同一行 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {/* Favicon */}
                      {item.faviconUrl && (
                        <img
                          src={item.faviconUrl}
                          alt=""
                          className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback: 隐藏图片
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="text-xs font-medium text-muted-foreground">
                        {item.sourceName}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(item.publishTime)}
                    </div>
                  </div>

                  {/* 标题 - 在来源下方，无图标 */}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-foreground
                                 mb-1.5 line-clamp-2 block
                                 group-hover:text-primary
                                 transition-colors"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <h3 className="text-base font-semibold text-foreground mb-1.5 line-clamp-2
                                group-hover:text-primary
                                transition-colors">
                      {item.title}
                    </h3>
                  )}

                  {/* 摘要 - 只在和标题不同时显示 */}
                  {shouldShowSummary && (
                    <p className="text-sm text-muted-foreground
                               leading-relaxed
                               line-clamp-3">
                      {item.summary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>暂无信息</p>
            </div>
          )}
        </div>
    </div>
  );
}
