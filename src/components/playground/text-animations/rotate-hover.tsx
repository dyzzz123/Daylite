'use client';

/**
 * 悬停旋转效果
 * 鼠标悬停时旋转
 */
export function RotateHover() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center transition-transform duration-500 hover:rotate-180 cursor-pointer">
        <div className="text-3xl mb-1">🔄</div>
        <p className="text-xs text-muted-foreground">悬停旋转</p>
      </div>
    </div>
  );
}

export function RotateHoverDemo() {
  return <RotateHover />;
}
