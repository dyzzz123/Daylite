// Playground 类型定义

/**
 * 演示类别
 */
export type DemoCategory =
  | 'text-animations'
  | 'interactive-components'
  | 'cursor-effects'
  | 'parallax-3d'
  | 'color-tools';

/**
 * 难度级别
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * 性能评级
 */
export type PerformanceRating = 'excellent' | 'good' | 'moderate' | 'heavy';

/**
 * 演示元数据
 */
export interface DemoMeta {
  id: string;
  title: string;
  description: string;
  category: DemoCategory;
  tags: string[];
  difficulty: DifficultyLevel;
  performance: PerformanceRating;
  thumbnail: string; // Emoji 或图片 URL
  featured: boolean;
  createdAt?: Date;
  author?: string;
}

/**
 * 演示组件定义
 */
export interface DemoComponent {
  meta: DemoMeta;
  component: React.ComponentType<any>;
  code: string; // 源代码用于复制
  dependencies?: string[]; // 需要的 npm 包
  props?: Record<string, any>; // 演示特定的属性
}

/**
 * 用户收藏
 */
export interface DemoFavorite {
  demoId: string;
  addedAt: Date;
  notes?: string;
}

/**
 * 画廊视图状态
 */
export interface GalleryState {
  category: DemoCategory | 'all';
  searchQuery: string;
  sortBy: 'popular' | 'newest' | 'difficulty' | 'performance';
  viewMode: 'grid' | 'list';
}

/**
 * 类别配置
 */
export interface CategoryConfig {
  id: DemoCategory;
  name: string;
  emoji: string;
  description: string;
  count: number;
}
