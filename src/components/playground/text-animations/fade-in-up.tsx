'use client';

import { useState } from 'react';

/**
 * 淡入向上动画
 * 元素从底部淡入
 */
export function FadeInUp() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div
        className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        onClick={() => setVisible(!visible)}
        style={{ cursor: 'pointer' }}
      >
        <div className="text-3xl mb-1">🌟</div>
        <p className="text-xs text-muted-foreground">点击切换</p>
      </div>
    </div>
  );
}

export function FadeInUpDemo() {
  return <FadeInUp />;
}
