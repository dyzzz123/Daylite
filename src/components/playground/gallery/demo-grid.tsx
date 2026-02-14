'use client';

import { DemoComponent } from '@/types/playground';
import { DemoCard } from './demo-card';

interface DemoGridProps {
  demos: DemoComponent[];
}

/**
 * 演示网格组件
 */
export function DemoGrid({ demos }: DemoGridProps) {
  if (demos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-2">🔍</div>
        <p className="text-muted-foreground">没有找到演示</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {demos.map(demo => (
        <DemoCard key={demo.meta.id} demo={demo} />
      ))}
    </div>
  );
}
