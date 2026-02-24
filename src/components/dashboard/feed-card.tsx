"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { FeedItem } from "@/types";
import { LoadMoreTrigger } from "./load-more-trigger";

interface FeedCardProps {
  items: FeedItem[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * 格式化时间函数
 */
function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 单个来源分组组件
 * 将同一来源的所有信息放在一个大框内
 */
function SourceGroup({
  sourceName,
  items
}: {
  sourceName: string;
  items: FeedItem[];
}) {
  return (
    <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* 大框容器 */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {/* 来源标题栏 */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {sourceName}
          </h3>
        </div>

        {/* 信息列表 */}
        <div className="divide-y divide-border/50">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group p-4 hover:bg-muted/30 transition-colors duration-150"
            >
              {/* 标题 */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground block mb-1.5 line-clamp-2 group-hover:text-primary transition-colors"
                >
                  {item.title}
                </a>
              ) : (
                <h4 className="text-sm font-medium text-foreground mb-1.5 line-clamp-2">
                  {item.title}
                </h4>
              )}

              {/* 时间和摘要 */}
              <div className="text-xs text-muted-foreground mb-2">
                {formatTime(item.publishTime)}
              </div>

              {item.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedCard({
  items,
  loading = false,
  loadingMore = false,
  hasMore = true,
  onLoadMore
}: FeedCardProps) {
  // 按来源分组
  const groupedItems = items.reduce((groups, item) => {
    const source = item.sourceName;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(item);
    return groups;
  }, {} as Record<string, FeedItem[]>);

  return (
    <Card>
      <CardContent className="pt-6">
        {/* 信息列表 */}
        <div>
          {/* 骨架屏加载状态 */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/20 p-4 animate-pulse"
                >
                  <div className="h-4 w-24 bg-muted rounded mb-3" />
                  <div className="space-y-3">
                    <div className="h-3.5 w-full bg-muted/50 rounded" />
                    <div className="h-3.5 w-3/4 bg-muted/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 正常信息列表 - 按来源分组显示 */}
          {!loading && Object.keys(groupedItems).length > 0 && (
            <>
              {Object.entries(groupedItems).map(([sourceName, sourceItems]) => (
                <SourceGroup key={sourceName} sourceName={sourceName} items={sourceItems} />
              ))}
            </>
          )}

          {/* 暂无信息 */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>暂无信息</p>
            </div>
          )}

          {/* 加载更多提示 */}
          {loadingMore && (
            <div className="text-center py-4 text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary" />
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          )}

          {/* 没有更多数据 */}
          {!hasMore && items.length > 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-xs">没有更多内容了</p>
            </div>
          )}

          {/* 加载触发器 */}
          {hasMore && !loadingMore && !loading && onLoadMore && (
            <LoadMoreTrigger onLoadMore={onLoadMore} disabled={loadingMore} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
