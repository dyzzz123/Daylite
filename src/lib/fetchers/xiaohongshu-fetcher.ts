import type { FeedItem } from '@/types';

export interface XiaohongshuFetcherConfig {
  limit?: number;
  category?: 'all' | 'design' | 'tech' | 'product' | 'ai';
}

/**
 * 抓取小红书热门内容
 * 注意：小红书有严格的反爬机制，目前使用模拟数据为主
 * TODO: 可以集成第三方API或爬虫服务
 */
export async function fetchXiaohongshu(
  config: XiaohongshuFetcherConfig = {}
): Promise<FeedItem[]> {
  const { limit = 30, category = 'all' } = config;

  try {
    // 方法1: 尝试使用第三方API（需要配置）
    const itemsFromAPI = await fetchXiaohongshuFromAPI(limit, category);
    if (itemsFromAPI.length > 0) {
      return itemsFromAPI;
    }

    // 方法2: 返回模拟数据
    console.log('⚠ 小红书API不可用，使用模拟数据');
    return fetchXiaohongshuMock(limit, category);
  } catch (error) {
    console.error('✗ 小红书抓取失败:', error);
    return fetchXiaohongshuMock(limit, category);
  }
}

/**
 * 从第三方API抓取小红书内容
 * TODO: 集成第三方服务，如：
 * - 快照API (https://api.kuaizhan.com/)
 * - 聚合数据
 * - 或自建爬虫服务
 */
async function fetchXiaohongshuFromAPI(
  limit: number,
  category: string
): Promise<FeedItem[]> {
  // 示例：使用第三方API
  // const API_KEY = process.env.XIAOHONGSHU_API_KEY;
  // const response = await fetch(`https://api.example.com/xiaohongshu/hot?category=${category}&limit=${limit}`, {
  //   headers: { 'Authorization': `Bearer ${API_KEY}` }
  // });

  // 暂时返回空数组，让模拟数据接管
  return [];
}

/**
 * 小红书模拟数据
 * 包含不同分类的热门内容
 */
export async function fetchXiaohongshuMock(
  limit: number = 30,
  category: string = 'all'
): Promise<FeedItem[]> {
  const mockData: Record<
    string,
    Array<{
      title: string;
      summary: string;
      author: string;
      likes: string;
      tags: string[];
    }>
  > = {
    design: [
      {
        title: '2024年UI设计趋势大揭秘',
        summary: '盘点今年最流行的设计风格，从新拟态到玻璃态，从暗黑模式到极简主义，带你了解最新设计趋势。',
        author: '设计小站',
        likes: '1.2w',
        tags: ['UI设计', '设计趋势', '2024'],
      },
      {
        title: 'Figma高阶技巧分享',
        summary: '5个Figma隐藏技巧，让你的设计效率提升10倍！自动布局、组件变体、原型交互全解析。',
        author: 'Figma大神',
        likes: '8563',
        tags: ['Figma', '设计工具', '教程'],
      },
      {
        title: '如何设计一个好的产品logo',
        summary: '从品牌定位到视觉呈现，完整logo设计流程分享。附：10个优秀logo案例分析。',
        author: '品牌设计笔记',
        likes: '6532',
        tags: ['logo设计', '品牌设计', '案例'],
      },
    ],
    tech: [
      {
        title: 'AI辅助编程实战经验',
        summary: '使用Claude、Copilot等AI工具进行开发的最佳实践，提示词技巧和常见问题解决方案。',
        author: '编程达人',
        likes: '2.3w',
        tags: ['AI', '编程', '开发工具'],
      },
      {
        title: 'Next.js 14新特性详解',
        summary: 'Server Actions、Turbopack、Partial Prerendering等新特性完整指南，附实战项目案例。',
        author: '前端技术栈',
        likes: '1.1w',
        tags: ['Next.js', 'React', '前端'],
      },
      {
        title: '数据库优化实战指南',
        summary: '从索引优化到查询优化，从分库分表到读写分离，完整的数据库性能优化方案。',
        author: '后端架构',
        likes: '7823',
        tags: ['数据库', '性能优化', '架构'],
      },
    ],
    product: [
      {
        title: '如何写出一份完美的PRD',
        summary: '从需求分析到功能设计，从用户故事到验收标准，手把手教你写出高质量的PRD文档。',
        author: '产品经理笔记',
        likes: '3.5w',
        tags: ['PRD', '产品文档', '需求'],
      },
      {
        title: '用户体验设计的5个核心原则',
        summary: '以用户为中心的设计思维，从可用性到愉悦感，打造超预期的用户体验。',
        author: 'UX设计说',
        likes: '1.8w',
        tags: ['UX', '用户体验', '设计'],
      },
      {
        title: '产品经理必会的数据分析方法',
        summary: 'A/B测试、漏斗分析、用户分层，数据驱动产品决策的完整方法论。',
        author: '数据产品',
        likes: '9234',
        tags: ['数据分析', '产品经理', '增长'],
      },
    ],
    ai: [
      {
        title: 'Claude 3.5完全评测',
        summary: '对比GPT-4、Claude 3.5在代码生成、写作、推理等方面的表现，真实使用体验分享。',
        author: 'AI工具评测',
        likes: '4.2w',
        tags: ['Claude', 'AI', 'LLM'],
      },
      {
        title: 'AI绘画提示词大全',
        summary: 'Midjourney、Stable Diffusion提示词技巧，从风格描述到参数设置，创作高质量AI绘画。',
        author: 'AI绘画实验室',
        likes: '2.7w',
        tags: ['AI绘画', 'Midjourney', '提示词'],
      },
      {
        title: '个人AI助理搭建指南',
        summary: '使用LangChain、向量数据库搭建个人知识库AI助手，让你的信息管理更高效。',
        author: 'AI实践者',
        likes: '1.5w',
        tags: ['AI助手', 'LangChain', '知识库'],
      },
    ],
    all: [], // 会从其他分类合并
  };

  // 如果是all，合并所有分类
  let items: any[] = [];
  if (category === 'all') {
    items = [
      ...mockData.design,
      ...mockData.tech,
      ...mockData.product,
      ...mockData.ai,
    ];
  } else {
    items = mockData[category] || [];
  }

  // 随机打乱并限制数量
  items = items.sort(() => Math.random() - 0.5).slice(0, limit);

  return items.map((item) => ({
    id: '',
    source: 'xiaohongshu' as const,
    sourceName: '小红书',
    title: `🔥 ${item.likes} • ${item.title}`,
    summary: `${item.summary}\n\n作者: ${item.author}`,
    url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}`,
    publishTime: new Date(),
    read: false,
    tags: ['小红书', ...item.tags],
    createdAt: new Date(),
  }));
}

/**
 * 验证小红书API是否可用
 */
export async function validateXiaohongshuApi(): Promise<boolean> {
  // TODO: 实现API验证逻辑
  return false; // 暂时返回false，使用模拟数据
}

/**
 * 获取小红书元数据
 */
export async function getXiaohongshuMetadata(): Promise<{
  title?: string;
  description?: string;
  categories?: string[];
} | null> {
  return {
    title: '小红书',
    description: '生活方式分享社区热门内容',
    categories: ['design', 'tech', 'product', 'ai'],
  };
}

/**
 * 从小红书搜索页面抓取（备用方法）
 * 注意：需要处理cookie和反爬
 */
async function fetchXiaohongshuFromSearch(
  keyword: string,
  limit: number
): Promise<FeedItem[]> {
  // TODO: 实现搜索页面抓取
  // const response = await fetch(`https://www.xiaohongshu.com/web/api/sns/v1/search/notes?keyword=${keyword}`, {
  //   headers: {
  //     'User-Agent': '...',
  //     'Cookie': '...' // 需要有效的cookie
  //   }
  // });
  return [];
}

/**
 * 小红书RSS代理（如果可用）
 * 某些第三方服务提供小红书的RSS feed
 */
async function fetchXiaohongshuFromRSS(): Promise<FeedItem[]> {
  // TODO: 集成RSS代理服务
  // const RSS_URL = 'https://rss.example.com/xiaohongshu';
  // return fetchRSS({ url: RSS_URL, sourceName: '小红书', icon: '📕' });
  return [];
}

/**
 * 获取推荐的小红书博主/关键词
 */
export function getRecommendedXiaohongshuTopics(): string[] {
  return [
    'UI设计',
    'UX设计',
    '产品经理',
    '前端开发',
    'AI工具',
    'Midjourney',
    'ChatGPT',
    '数据分析',
    '用户研究',
    '设计系统',
  ];
}
