'use client';

interface GradientTextProps {
  text: string;
  className?: string;
  colors?: string[];
}

/**
 * 渐变文字动画
 * 背景渐变色不断流动的文字效果
 */
export function GradientText({
  text,
  className = '',
  colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  return (
    <span
      className={`gradient-text inline-block animate-gradient-flow ${className}`}
      style={gradientStyle}
    >
      {text}
    </span>
  );
}

export function GradientTextDemo() {
  return (
    <div className="flex items-center justify-center p-8 bg-card rounded-lg border min-h-[200px]">
      <div className="text-4xl font-bold">
        <GradientText text="Gradient Animation" />
      </div>
    </div>
  );
}
