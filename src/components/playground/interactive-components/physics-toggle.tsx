'use client';

import { useState } from 'react';

interface PhysicsToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * 物理开关
 * 带有弹簧动画的切换开关
 */
export function PhysicsToggle({
  checked = false,
  onChange,
  className = '',
}: PhysicsToggleProps) {
  const [isEnabled, setIsEnabled] = useState(checked);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onChange?.(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`physics-toggle relative w-14 h-8 rounded-full transition-colors duration-300 ${isEnabled ? 'bg-primary' : 'bg-muted'} ${className}`}
    >
      <div
        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
        style={{
          left: isEnabled ? 'calc(100% - 28px)' : '4px',
          transform: isEnabled ? 'scale(1.1)' : 'scale(1)',
        }}
      />
    </button>
  );
}

export function PhysicsToggleDemo() {
  return (
    <div className="flex items-center justify-center gap-4 p-4 w-full h-full bg-transparent">
      <div className="flex items-center gap-2">
        <PhysicsToggle />
        <span className="text-xs">开关</span>
      </div>
    </div>
  );
}
