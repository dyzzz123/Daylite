"use client";

import { useEffect, useRef } from "react";

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  disabled: boolean;
}

/**
 * 无限滚动触发器组件
 * 使用 Intersection Observer API 在元素进入视口时触发加载更多
 */
export function LoadMoreTrigger({ onLoadMore, disabled }: LoadMoreTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 如果被禁用，不创建 observer
    if (disabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // 当元素进入视口且未被禁用时触发
        if (entries[0].isIntersecting && !disabled) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,      // 元素进入视口 10% 时触发
        rootMargin: "200px"   // 提前 200px 触发，提升用户体验
      }
    );

    const currentRef = triggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // 清理 observer
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [onLoadMore, disabled]);

  return <div ref={triggerRef} className="h-10" aria-hidden="true" />;
}
