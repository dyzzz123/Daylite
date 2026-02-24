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
 * 单个信息内容组件
 * 包含标题、时间、摘要的显示逻辑
 */
function FeedItemContent({ item }: { item: FeedItem }) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border-0
                      bg-white dark:bg-gray-800
                      shadow-lg hover:shadow-2xl
                      hover:-translate-y-2
                      transition-all duration-200 ease-out
                      animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="relative p-4">
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

        {/* 发布时间 */}
        <div className="text-xs text-muted-foreground mb-3">
          {formatTime(item.publishTime)}
        </div>

        {/* 摘要 */}
        {item.summary && (
          <p className="text-sm text-muted-foreground
                             leading-relaxed
                             line-clamp-3">
            {item.summary}
          </p>
        )}
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
  function formatTime(date: Date | string) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* 信息列表 */}
        <div className="space-y-2">
          {/* 骨架屏加载状态 - 脉冲加载 */}
          {loading && (
            <div className="space-y-2">
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
                  <div className="h-4 w-4/5 bg-primary/10 rounded mb-1 animate-pulse" style={{ animationDelay: `${i * 100 + 900}ms` }} />
                </div>
              ))}
            </div>
          )}

          {/* 正常信息列表 - 同源合并显示 */}
          {!loading && items.map((item, index) => {
            // 判断是否需要显示来源名称
            // 第一条总是显示，或者当前来源与前一条不同时显示
            const isFirstOfSource =
              index === 0 || item.sourceName !== items[index - 1].sourceName;

            return (
              <div key={item.id}>
                {/* 只在第一条或切换来源时显示来源 */}
                {isFirstOfSource && (
                  <div className="text-xs font-medium text-muted-foreground mb-2 mt-3 first:mt-0">
                    {item.sourceName}
                  </div>
                )}

                {/* 信息内容 */}
                <FeedItemContent item={item} />
              </div>
            );
          })}

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
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary" />
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          )}

          {/* 没有更多数据 */}
          {!hasMore && items.length > 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">没有更多内容了</p>
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
