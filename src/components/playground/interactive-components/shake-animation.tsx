'use client';

import { useState } from 'react';

/**
 * 抖动动画效果
 * 点击时抖动
 */
export function ShakeAnimation() {
  const [shaking, setShaking] = useState(false);

  const handleClick = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div
        onClick={handleClick}
        className={`text-center cursor-pointer ${shaking ? 'animate-shake' : ''}`}
      >
        <div className="text-3xl mb-1">📳</div>
        <p className="text-xs text-muted-foreground">点击抖动</p>
      </div>
    </div>
  );
}

export function ShakeAnimationDemo() {
  return <ShakeAnimation />;
}
