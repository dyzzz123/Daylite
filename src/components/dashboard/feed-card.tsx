"use client";

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
 * 如果是今天，只显示时间（如 12:08）
 * 如果不是今天，显示日期和时间（如 2月23日 12:08）
 */
function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (isToday) {
    return timeStr;
  }

  // 不是今天，显示日期
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${month}月${day}日 ${timeStr}`;
}

/**
 * 单个来源分组组件
 * 将同一来源且时间相近的信息放在一个大框内
 */
function SourceGroup({
  sourceName,
  items
}: {
  sourceName: string;
  items: FeedItem[];
}) {
  return (
    <div className="mb-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* 大框容器 */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {/* 来源标题栏 */}
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground">
            {sourceName}
          </h3>
        </div>

        {/* 信息列表 */}
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="group p-3 hover:bg-muted/30 transition-colors duration-150"
            >
              {/* 标题 */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground block mb-1 line-clamp-2 group-hover:text-primary transition-colors"
                >
                  {item.title}
                </a>
              ) : (
                <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                  {item.title}
                </h4>
              )}

              {/* 时间和摘要 */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-muted-foreground">
                  {formatTime(item.publishTime)}
                </span>
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
  // 按来源和时间分组
  // 优先按时间排序（已经在后端完成），然后按来源合并
  const groupedItems = items.reduce((groups, item) => {
    const source = item.sourceName;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(item);
    return groups;
  }, {} as Record<string, FeedItem[]>);

  return (
    <div className="space-y-4">
      {/* 骨架屏加载状态 */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/20 p-4 animate-pulse"
            >
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted/50 rounded" />
                <div className="h-3 w-3/4 bg-muted/50 rounded" />
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
  );
}
