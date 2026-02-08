import { Badge } from '@/components/ui/badge';
import { PerformanceRating } from '@/types/playground';

interface PerformanceBadgeProps {
  rating: PerformanceRating;
}

/**
 * 性能徽章组件
 */
export function PerformanceBadge({ rating }: PerformanceBadgeProps) {
  const config = {
    excellent: { label: '极快', icon: '⚡', color: 'text-green-600 border-green-200' },
    good: { label: '良好', icon: '🚀', color: 'text-blue-600 border-blue-200' },
    moderate: { label: '中等', icon: '📊', color: 'text-yellow-600 border-yellow-200' },
    heavy: { label: '较重', icon: '⚠️', color: 'text-orange-600 border-orange-200' },
  };

  const { label, icon, color } = config[rating];

  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {icon} {label}
    </Badge>
  );
}
