'use client';

import { useState } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * 涟漪按钮
 * 点击时产生 Material Design 风格的涟漪效果
 */
export function RippleButton({
  children,
  className = '',
  onClick,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples([...ripples, newRipple]);

    // 移除涟漪
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      className={`ripple-button relative overflow-hidden px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '0',
            height: '0',
          }}
        />
      ))}
    </button>
  );
}

export function RippleButtonDemo() {
  return (
    <div className="flex items-center justify-center gap-2 p-4 w-full h-full bg-transparent">
      <RippleButton>点击我</RippleButton>
    </div>
  );
}
