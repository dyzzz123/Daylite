'use client';

import { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  color?: string;
  size?: number;
  blendMode?: string;
}

/**
 * 自定义圆形光标
 * 替换默认鼠标指针的圆形光标效果
 */
export function CustomCursor({
  color = '#ab9f99',
  size = 20,
  blendMode = 'normal',
}: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // 隐藏默认光标
    document.body.style.cursor = 'none';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor fixed top-0 left-0 rounded-full pointer-events-none z-50 mix-blend-difference"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        transform: `translate(${position.x - size / 2}px, ${position.y - size / 2}px)`,
        mixBlendMode: blendMode as any,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
}

export function CustomCursorDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center">
        <div className="text-2xl mb-1">🎯</div>
        <p className="text-xs text-muted-foreground">圆形光标</p>
      </div>
    </div>
  );
}
