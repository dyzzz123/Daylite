'use client';

import { useEffect, useRef } from 'react';
import TypeIt from 'typeit';

interface TypewriterEffectProps {
  text?: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  className?: string;
}

/**
 * 打字机效果演示
 * 使用 TypeIt 库实现经典的打字机动画
 */
export function TypewriterEffect({
  text = 'Hello, World! 欢迎使用 UI 演示工坊',
  speed = 50,
  delay = 300,
  loop = false,
  className = '',
}: TypewriterEffectProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<TypeIt | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    // 清理之前的实例
    if (instanceRef.current) {
      instanceRef.current.destroy();
    }

    // 创建新的打字机实例
    instanceRef.current = new TypeIt(elementRef.current, {
      speed,
      startDelay: delay,
      loop,
      cursor: true,
      cursorChar: '|',
      cursorSpeed: 300,
    }).type(text).go();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [text, speed, delay, loop]);

  return (
    <div className={`typewriter-container ${className}`}>
      <div
        ref={elementRef}
        className="text-2xl font-medium text-foreground"
        style={{ minHeight: '40px' }}
      />
    </div>
  );
}

// 演示组件 - 用于画廊展示
export function TypewriterDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <TypewriterEffect
        text="打字机效果"
        speed={150}
        delay={0}
        loop={true}
      />
    </div>
  );
}
