'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDemosByCategory, getAllDemos } from '@/lib/playground/demo-data';
import { DemoGrid } from '@/components/playground/gallery/demo-grid';
import { CategoryFilter } from '@/components/playground/gallery/category-filter';

/**
 * UI 演示工坊主页
 */
function PlaygroundPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  // 过滤演示
  const filteredDemos = useMemo(() => {
    return categoryParam === 'all'
      ? getAllDemos()
      : getDemosByCategory(categoryParam);
  }, [categoryParam]);

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">UI 演示工坊</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {getAllDemos().length} 个交互效果
        </p>
      </div>

      {/* 类别筛选 */}
      <CategoryFilter currentCategory={categoryParam} />

      {/* 演示网格 */}
      <DemoGrid demos={filteredDemos} />
    </div>
  );
}

/**
 * 包装在 Suspense 中
 */
export default function PlaygroundWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    }>
      <PlaygroundPage />
    </Suspense>
  );
}
