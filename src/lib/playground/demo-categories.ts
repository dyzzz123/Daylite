import { CategoryConfig, DemoCategory } from '@/types/playground';

/**
 * 演示类别配置
 */
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'text-animations',
    name: '文本动效',
    emoji: '🎨',
    description: '文本动画效果',
    count: 5,
  },
  {
    id: 'interactive-components',
    name: '交互组件',
    emoji: '🎮',
    description: '交互组件效果',
    count: 5,
  },
  {
    id: 'cursor-effects',
    name: '光标魔法',
    emoji: '🖱️',
    description: '光标效果',
    count: 3,
  },
  {
    id: 'parallax-3d',
    name: '3D 视差',
    emoji: '🔮',
    description: '3D 视差效果',
    count: 0,
  },
  {
    id: 'color-tools',
    name: '配色神器',
    emoji: '🧠',
    description: '配色工具',
    count: 0,
  },
];

/**
 * 获取类别配置
 */
export function getCategoryConfig(id: DemoCategory): CategoryConfig | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

/**
 * 获取所有类别 ID
 */
export function getAllCategoryIds(): DemoCategory[] {
  return CATEGORIES.map(cat => cat.id);
}
