'use client';

import { useState } from 'react';

/**
 * 形状变形效果
 * 在圆形和方形之间变形
 */
export function MorphingShape() {
  const [isCircle, setIsCircle] = useState(true);

  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div
        onClick={() => setIsCircle(!isCircle)}
        className={`bg-primary transition-all duration-500 cursor-pointer ${
          isCircle ? 'rounded-full w-16 h-16' : 'rounded-lg w-20 h-14'
        }`}
      />
    </div>
  );
}

export function MorphingShapeDemo() {
  return <MorphingShape />;
}
