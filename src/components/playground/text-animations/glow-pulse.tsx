'use client';

/**
 * 光晕脉冲效果
 * 持续脉冲发光
 */
export function GlowPulse() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full bg-transparent">
      <div className="text-center animate-glow-pulse">
        <div className="text-3xl mb-1">✨</div>
        <p className="text-xs text-muted-foreground">脉冲光晕</p>
      </div>
    </div>
  );
}

export function GlowPulseDemo() {
  return <GlowPulse />;
}
