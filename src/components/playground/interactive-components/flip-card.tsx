'use client';

import { useState } from 'react';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

/**
 * 3D 翻转卡片
 * 点击时翻转显示背面内容
 */
export function FlipCard({ front, back, className = '' }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`flip-card-container ${className}`}
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="flip-card relative w-full h-full transition-transform duration-700 preserve-3d cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 正面 */}
        <div
          className="flip-card-front absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* 背面 */}
        <div
          className="flip-card-back absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

export function FlipCardDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="w-40 h-24">
        <FlipCard
          front={
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center text-white text-sm font-bold p-4">
              点击翻转
            </div>
          }
          back={
            <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/70 rounded-lg flex items-center justify-center text-foreground text-sm font-bold p-4">
              背面
            </div>
          }
        />
      </div>
    </div>
  );
}
