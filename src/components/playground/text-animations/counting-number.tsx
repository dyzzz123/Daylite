'use client';

import { useState, useEffect, useRef } from 'react';

interface CountingNumberProps {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

/**
 * 数字计数动画
 * 从 0 逐渐增加到目标数字
 */
export function CountingNumber({
  end,
  start = 0,
  duration = 2000,
  className = '',
  suffix = '',
  prefix = '',
}: CountingNumberProps) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let frame: number;
    const startTime = performance.now();
    const range = end - start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutQuart 缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(start + range * easeOutQuart);

      setCount(currentCount);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [isVisible, start, end, duration]);

  return (
    <span ref={ref} className={`counting-number ${className}`}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function CountingNumberDemo() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center">
        <div className="text-3xl font-bold text-primary">
          <CountingNumber end={2026} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">年度计数</p>
      </div>
    </div>
  );
}
