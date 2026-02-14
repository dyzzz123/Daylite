import { DemoComponent } from '@/types/playground';
import { CountingNumberDemo } from '@/components/playground/text-animations/counting-number';
import { FadeInUpDemo } from '@/components/playground/text-animations/fade-in-up';
import { ScaleHoverDemo } from '@/components/playground/text-animations/scale-hover';
import { RotateHoverDemo } from '@/components/playground/text-animations/rotate-hover';
import { GlowPulseDemo } from '@/components/playground/text-animations/glow-pulse';
import { MagneticButtonDemo } from '@/components/playground/interactive-components/magnetic-button';
import { SlideRevealDemo } from '@/components/playground/interactive-components/slide-reveal';
import { ShakeAnimationDemo } from '@/components/playground/interactive-components/shake-animation';
import { BlurInDemo } from '@/components/playground/interactive-components/blur-in';
import { TiltCardDemo } from '@/components/playground/interactive-components/tilt-card';
import { BounceEffectDemo } from '@/components/playground/cursor-effects/bounce-effect';
import { MorphingShapeDemo } from '@/components/playground/cursor-effects/morphing-shape';
import { LoadingDotsDemo } from '@/components/playground/cursor-effects/loading-dots';

/**
 * 演示注册表
 * 包含所有演示的元数据和组件引用
 */
export const DEMO_REGISTRY: Record<string, DemoComponent> = {
  // 保留的演示
  'text-counting': {
    meta: {
      id: 'text-counting',
      title: '数字计数',
      description: '从 0 逐渐增加到目标数字',
      category: 'text-animations',
      tags: ['count', 'number', 'animation', 'counter'],
      difficulty: 'intermediate',
      performance: 'excellent',
      thumbnail: '🔢',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: CountingNumberDemo,
    code: `// 数字计数动画
const easeOutQuart = 1 - Math.pow(1 - progress, 4);
const currentCount = Math.floor(start + range * easeOutQuart);`,
    dependencies: [],
  },

  'interactive-magnetic': {
    meta: {
      id: 'interactive-magnetic',
      title: '磁性按钮',
      description: '按钮被鼠标吸引的磁性效果',
      category: 'interactive-components',
      tags: ['magnetic', 'button', 'hover', 'physics'],
      difficulty: 'intermediate',
      performance: 'excellent',
      thumbnail: '🧲',
      featured: true,
      createdAt: new Date('2025-01-01'),
    },
    component: MagneticButtonDemo,
    code: `const deltaX = (e.clientX - centerX) / strength;
const deltaY = (e.clientY - centerY) / strength;

button.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;`,
    dependencies: [],
  },

  'interactive-tilt': {
    meta: {
      id: 'interactive-tilt',
      title: '3D 倾斜卡片',
      description: '跟随鼠标移动产生 3D 倾斜效果',
      category: 'interactive-components',
      tags: ['tilt', 'card', '3d', 'mouse'],
      difficulty: 'intermediate',
      performance: 'good',
      thumbnail: '📐',
      featured: true,
      createdAt: new Date('2025-01-01'),
    },
    component: TiltCardDemo,
    code: `const rotateX = ((y - centerY) / centerY) * maxTilt;
const rotateY = ((centerX - x) / centerX) * maxTilt;

card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg)\`;`,
    dependencies: [],
  },

  // 新增演示
  'text-fade-in-up': {
    meta: {
      id: 'text-fade-in-up',
      title: '淡入向上',
      description: '元素从底部淡入的效果',
      category: 'text-animations',
      tags: ['fade', 'slide', 'animation'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '🌟',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: FadeInUpDemo,
    code: `.fade-in-up {
  opacity: 0;
  transform: translateY(1rem);
  transition: all 0.7s;
}

.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}`,
    dependencies: [],
  },

  'text-scale-hover': {
    meta: {
      id: 'text-scale-hover',
      title: '悬停缩放',
      description: '鼠标悬停时放大的效果',
      category: 'text-animations',
      tags: ['scale', 'hover', 'zoom'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '💫',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: ScaleHoverDemo,
    code: `.scale-hover {
  transition: transform 0.3s;
}

.scale-hover:hover {
  transform: scale(1.25);
}`,
    dependencies: [],
  },

  'text-rotate-hover': {
    meta: {
      id: 'text-rotate-hover',
      title: '悬停旋转',
      description: '鼠标悬停时旋转的效果',
      category: 'text-animations',
      tags: ['rotate', 'hover', 'spin'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '🔄',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: RotateHoverDemo,
    code: `.rotate-hover {
  transition: transform 0.5s;
}

.rotate-hover:hover {
  transform: rotate(180deg);
}`,
    dependencies: [],
  },

  'text-glow-pulse': {
    meta: {
      id: 'text-glow-pulse',
      title: '光晕脉冲',
      description: '持续脉冲发光的效果',
      category: 'text-animations',
      tags: ['glow', 'pulse', 'animation'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '✨',
      featured: true,
      createdAt: new Date('2025-01-01'),
    },
    component: GlowPulseDemo,
    code: `@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(185, 54, 49, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(185, 54, 49, 0.8),
                0 0 30px rgba(185, 54, 49, 0.6);
  }
}`,
    dependencies: [],
  },

  'interactive-slide-reveal': {
    meta: {
      id: 'interactive-slide-reveal',
      title: '滑动揭示',
      description: '点击时内容滑入显示',
      category: 'interactive-components',
      tags: ['slide', 'reveal', 'click'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '👆',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: SlideRevealDemo,
    code: `.slide-reveal {
  transform: translateY(-100%);
  transition: transform 0.5s;
}

.slide-reveal.revealed {
  transform: translateY(0);
}`,
    dependencies: [],
  },

  'interactive-shake': {
    meta: {
      id: 'interactive-shake',
      title: '抖动动画',
      description: '点击时触发抖动效果',
      category: 'interactive-components',
      tags: ['shake', 'click', 'animation'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '📳',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: ShakeAnimationDemo,
    code: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.shake {
  animation: shake 0.5s;
}`,
    dependencies: [],
  },

  'interactive-blur-in': {
    meta: {
      id: 'interactive-blur-in',
      title: '模糊淡入',
      description: '从模糊到清晰的过渡效果',
      category: 'interactive-components',
      tags: ['blur', 'fade', 'focus'],
      difficulty: 'beginner',
      performance: 'good',
      thumbnail: '🔍',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: BlurInDemo,
    code: `.blur-in {
  filter: blur(10px);
  transition: filter 0.3s;
}

.blur-in.clear {
  filter: blur(0);
}`,
    dependencies: [],
  },

  'cursor-bounce': {
    meta: {
      id: 'cursor-bounce',
      title: '弹跳效果',
      description: '持续弹跳的动画效果',
      category: 'cursor-effects',
      tags: ['bounce', 'animation', 'spring'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '⚽',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: BounceEffectDemo,
    code: `@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.bounce {
  animation: bounce 1s ease-in-out infinite;
}`,
    dependencies: [],
  },

  'cursor-morph': {
    meta: {
      id: 'cursor-morph',
      title: '形状变形',
      description: '圆形和方形之间的平滑变形',
      category: 'cursor-effects',
      tags: ['morph', 'shape', 'transition'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '🔷',
      featured: true,
      createdAt: new Date('2025-01-01'),
    },
    component: MorphingShapeDemo,
    code: `.morph-circle {
  border-radius: 50%;
  width: 64px;
  height: 64px;
  transition: all 0.5s;
}

.morph-square {
  border-radius: 8px;
  width: 80px;
  height: 56px;
}`,
    dependencies: [],
  },

  'cursor-loading-dots': {
    meta: {
      id: 'cursor-loading-dots',
      title: '加载点',
      description: '三个点依次跳动的加载动画',
      category: 'cursor-effects',
      tags: ['loading', 'dots', 'animation'],
      difficulty: 'beginner',
      performance: 'excellent',
      thumbnail: '⏳',
      featured: false,
      createdAt: new Date('2025-01-01'),
    },
    component: LoadingDotsDemo,
    code: `.loading-dot {
  animation: bounce 0.6s ease-in-out infinite;
}

.loading-dot:nth-child(1) { animation-delay: 0ms; }
.loading-dot:nth-child(2) { animation-delay: 150ms; }
.loading-dot:nth-child(3) { animation-delay: 300ms; }`,
    dependencies: [],
  },
};

/**
 * 获取所有演示
 */
export function getAllDemos(): DemoComponent[] {
  return Object.values(DEMO_REGISTRY);
}

/**
 * 根据类别获取演示
 */
export function getDemosByCategory(category: string): DemoComponent[] {
  if (category === 'all') {
    return getAllDemos();
  }
  return getAllDemos().filter(demo => demo.meta.category === category);
}

/**
 * 根据 ID 获取演示
 */
export function getDemoById(id: string): DemoComponent | undefined {
  return DEMO_REGISTRY[id];
}

/**
 * 搜索演示
 */
export function searchDemos(query: string): DemoComponent[] {
  const q = query.toLowerCase();
  return getAllDemos().filter(demo =>
    demo.meta.title.toLowerCase().includes(q) ||
    demo.meta.description.toLowerCase().includes(q) ||
    demo.meta.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

/**
 * 获取精选演示
 */
export function getFeaturedDemos(): DemoComponent[] {
  return getAllDemos().filter(demo => demo.meta.featured);
}
