'use client';

import { useState, useEffect } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

/**
 * 文字解码/乱码效果
 * 模拟黑客风格的文字解码动画
 */
export function ScrambleText({ text, className = '' }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  const scramble = (input: string, progress: number): string => {
    return input
      .split('')
      .map((char, index) => {
        if (index < progress) return input[index];
        return characters[Math.floor(Math.random() * characters.length)];
      })
      .join('');
  };

  useEffect(() => {
    if (!isHovering) return;

    let frame = 0;
    const totalFrames = 30;

    const animate = () => {
      frame++;
      const progress = Math.floor((frame / totalFrames) * text.length);
      setDisplayText(scramble(text, progress));

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
      }
    };

    animate();
  }, [isHovering, text]);

  return (
    <span
      className={`scramble-text cursor-pointer inline-block ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
    </span>
  );
}

export function ScrambleTextDemo() {
  return (
    <div className="flex items-center justify-center p-8 bg-card rounded-lg border min-h-[200px]">
      <div className="text-2xl font-medium">
        <ScrambleText text="悬停这里看解码效果" />
      </div>
    </div>
  );
}
