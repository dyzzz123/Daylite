'use client';

interface MarqueeTextProps {
  text: string;
  speed?: number;
  className?: string;
}

/**
 * 跑马灯文字效果
 * 横向滚动的无限循环文字
 */
export function MarqueeText({
  text,
  speed = 20,
  className = '',
}: MarqueeTextProps) {
  return (
    <div className={`marquee-container overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className="marquee-content inline-block"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {text} • {text} • {text} • {text} • {text} • {text}
      </div>
    </div>
  );
}

export function MarqueeTextDemo() {
  return (
    <div className="flex items-center justify-center p-8 bg-card rounded-lg border min-h-[200px]">
      <div className="w-full text-2xl font-medium">
        <MarqueeText text="这是一个跑马灯效果演示 " speed={10} />
      </div>
    </div>
  );
}
