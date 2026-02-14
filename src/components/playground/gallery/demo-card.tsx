'use client';

import { DemoComponent } from '@/types/playground';

interface DemoCardProps {
  demo: DemoComponent;
}

/**
 * 演示卡片组件
 */
export function DemoCard({ demo }: DemoCardProps) {
  const DemoComponent = demo.component;

  return (
    <div className="group relative bg-card rounded-xl border hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* 演示预览区域 */}
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <DemoComponent />
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{demo.meta.thumbnail}</span>
          <h3 className="font-medium text-sm">{demo.meta.title}</h3>
        </div>
      </div>
    </div>
  );
}
