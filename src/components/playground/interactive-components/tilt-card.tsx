'use client';

import { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

/**
 * 3D 倾斜卡片
 * 跟随鼠标移动产生 3D 倾斜效果
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 10,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card transition-transform duration-200 ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export function TiltCardDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="w-40 h-24">
        <TiltCard
          className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center border border-primary/30"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">🎴</div>
            <div className="text-xs font-medium">移动鼠标</div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
