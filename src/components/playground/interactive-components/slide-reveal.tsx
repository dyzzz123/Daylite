'use client';

import { useState } from 'react';

/**
 * 滑动揭示效果
 * 内容滑入显示
 */
export function SlideReveal() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <button
        onClick={() => setRevealed(!revealed)}
        className="relative overflow-hidden px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-all"
      >
        <div
          className={`transition-transform duration-500 ${revealed ? 'translate-y-0' : '-translate-y-full'}`}
        >
          {revealed ? '🎉 完成！' : '👆 点击揭示'}
        </div>
      </button>
    </div>
  );
}

export function SlideRevealDemo() {
  return <SlideReveal />;
}
