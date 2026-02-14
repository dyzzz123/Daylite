'use client';

interface WaveTextProps {
  text: string;
  className?: string;
}

/**
 * 波浪文字效果
 * 每个字母都有上下波浪动画
 */
export function WaveText({ text, className = '' }: WaveTextProps) {
  return (
    <span className={`wave-text inline-flex ${className}`}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block animate-wave"
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export function WaveTextDemo() {
  return (
    <div className="flex items-center justify-center p-8 bg-card rounded-lg border min-h-[200px]">
      <div className="text-2xl font-medium">
        <WaveText text="Hello Wave Animation" />
      </div>
    </div>
  );
}
