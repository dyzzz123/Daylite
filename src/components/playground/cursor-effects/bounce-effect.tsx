'use client';

/**
 * 弹跳效果
 * 持续弹跳
 */
export function BounceEffect() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center animate-bounce-slow">
        <div className="text-3xl mb-1">⚽</div>
        <p className="text-xs text-muted-foreground">弹跳效果</p>
      </div>
    </div>
  );
}

export function BounceEffectDemo() {
  return <BounceEffect />;
}
