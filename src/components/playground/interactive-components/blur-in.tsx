'use client';

import { useState, useEffect } from 'react';

/**
 * 模糊淡入效果
 * 从模糊到清晰
 */
export function BlurIn() {
  const [blur, setBlur] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlur(prev => Math.max(0, prev - 1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div
        className="text-center transition-all duration-300"
        style={{ filter: `blur(${blur}px)` }}
      >
        <div className="text-3xl mb-1">🔍</div>
        <p className="text-xs text-muted-foreground">模糊淡入</p>
      </div>
    </div>
  );
}

export function BlurInDemo() {
  return <BlurIn />;
}
