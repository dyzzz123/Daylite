import { Badge } from '@/components/ui/badge';
import { DifficultyLevel } from '@/types/playground';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
}

/**
 * 难度徽章组件
 */
export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  const config = {
    beginner: { label: '初级', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    intermediate: { label: '中级', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    advanced: { label: '高级', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  };

  const { label, color } = config[level];

  return (
    <Badge variant="secondary" className={`text-xs ${color}`}>
      {label}
    </Badge>
  );
}
