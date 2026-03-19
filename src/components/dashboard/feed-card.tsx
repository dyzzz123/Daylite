"use client";

import React, { useState } from "react";
import type { FeedItem } from "@/types";
import { LoadMoreTrigger } from "./load-more-trigger";
import { getFaviconUrl, getFaviconFallbackUrls, extractDomain } from "@/lib/favicon";

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
 * 来源图标组件
 * 支持 emoji 字符串和 URL 两种格式
 * URL 格式支持降级加载
 */
function SourceIcon({ icon, name }: { icon?: string; name: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const fallback = (
    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-primary">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (!icon) return fallback;

  // 判断是否为 URL（包括相对路径）
  const isUrl = icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/');

  if (isUrl) {
    return (
      <>
        {!isLoaded && fallback}
        <img
          src={icon}
          alt={name}
          className="w-5 h-5 rounded-sm object-cover shrink-0"
          style={{ display: isLoaded ? 'block' : 'none' }}
          onLoad={() => setIsLoaded(true)}
          onError={() => { /* 保��显示首字母回退 */ }}
        />
      </>
    );
  }

  // Emoji 图标
  return (
    <span className="text-sm shrink-0" aria-hidden="true">
      {icon}
    </span>
  );
}

/**
 * 将相邻且同源的信息分组
 */
function groupAdjacentBySource(items: FeedItem[]): FeedItem[][] {
  const groups: FeedItem[][] = [];
  let currentGroup: FeedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prevItem = i > 0 ? items[i - 1] : null;

    // 如果是第一条，或者与前一条同源，加入当前组
    if (!prevItem || item.sourceName === prevItem.sourceName) {
      currentGroup.push(item);
    } else {
      // 来源不同，开始新组
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [item];
    }
  }

  // 添加最后一组
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * 单个来源分组组件
 * 将相邻且同源的信息放在一个大框内
 */
function SourceGroup({
  items
}: {
  items: FeedItem[];
}) {
  const sourceName = items[0].sourceName;
  const sourceIcon = items[0].sourceIcon;

  return (
    <div className="mb-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* 大框容器 */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {/* 来源标题栏 */}
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <SourceIcon icon={sourceIcon} name={sourceName} />
            <h3 className="text-xs font-semibold text-foreground">
              {sourceName}
            </h3>
          </div>
        </div>

        {/* 信息列表 */}
        <div>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* 有链接：整条可点击 */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 hover:bg-muted/30 transition-colors duration-150 group"
                >
                  {/* 标题行：标题左对齐 + 日期右对齐 */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium text-foreground flex-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                      {formatTime(item.publishTime)}
                    </span>
                  </div>

                  {/* 摘要 */}
                  {item.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  )}
                </a>
              ) : (
                /* 无链接：降级显示 */
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h4 className="text-sm font-medium text-foreground flex-1 line-clamp-2">
                      {item.title}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                      {formatTime(item.publishTime)}
                    </span>
                  </div>
                  {item.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  )}
                </div>
              )}

              {/* 手动分割线 - 两端留空 */}
              {index < items.length - 1 && (
                <div className="mx-3 h-px bg-border/50" />
              )}
            </React.Fragment>
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
  // 将相邻且同源的信息分组
  const groupedItems = groupAdjacentBySource(items);

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

      {/* 正常信息列表 - 按相邻且同源分组显示 */}
      {!loading && groupedItems.length > 0 && (
        <>
          {groupedItems.map((group, index) => (
            <SourceGroup key={`${group[0].sourceName}-${index}`} items={group} />
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
