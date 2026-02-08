'use client';

/**
 * 悬停缩放效果
 * 鼠标悬停时放大
 */
export function ScaleHover() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div
        className="text-center transition-transform duration-300 hover:scale-125 cursor-pointer"
      >
        <div className="text-3xl mb-1">💫</div>
        <p className="text-xs text-muted-foreground">悬停放大</p>
      </div>
    </div>
  );
}

export function ScaleHoverDemo() {
  return <ScaleHover />;
}
