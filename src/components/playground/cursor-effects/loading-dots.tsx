'use client';

/**
 * 加载点效果
 * 三个点依次加载
 */
export function LoadingDots() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent gap-1">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export function LoadingDotsDemo() {
  return <LoadingDots />;
}
