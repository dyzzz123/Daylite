'use client';

import { useEffect, useRef, useState } from 'react';

interface CursorTrailProps {
  color?: string;
  size?: number;
  trailLength?: number;
}

interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

/**
 * 光标拖尾效果
 * 光标移动时留下逐渐消失的轨迹
 */
export function CursorTrail({
  color = '#ab9f99',
  size = 15,
  trailLength = 10,
}: CursorTrailProps) {
  const [trails, setTrails] = useState<TrailPoint[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail: TrailPoint = {
        x: e.clientX,
        y: e.clientY,
        id: counterRef.current++,
      };

      setTrails(prev => [...prev.slice(-trailLength + 1), newTrail]);

      // 移除旧的轨迹点
      setTimeout(() => {
        setTrails(prev => prev.filter(t => t.id !== newTrail.id));
      }, 500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trailLength]);

  return (
    <>
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="cursor-trail fixed top-0 left-0 rounded-full pointer-events-none z-40"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            left: trail.x - size / 2,
            top: trail.y - size / 2,
            opacity: (index + 1) / trails.length * 0.5,
            transform: `scale(${(index + 1) / trails.length})`,
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        />
      ))}
    </>
  );
}

export function CursorTrailDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center">
        <div className="text-2xl mb-1">✨</div>
        <p className="text-xs text-muted-foreground">光标拖尾</p>
      </div>
    </div>
  );
}
