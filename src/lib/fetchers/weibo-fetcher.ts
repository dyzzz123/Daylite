import type { FeedItem } from '@/types';

export interface WeiboFetcherConfig {
  limit?: number;
}

/**
 * 抓取微博热搜
 * 注意：微博有反爬机制，可能需要使用代理或第三方API
 */
export async function fetchWeiboHot(
  config: WeiboFetcherConfig = {}
): Promise<FeedItem[]> {
  const { limit = 50 } = config;

  try {
    // 方法1: 尝试使用微博API（可能需要cookie）
    const items = await fetchWeiboFromAPI(limit);

    if (items.length > 0) {
      return items;
    }

    // 方法2: 如果API失败，返回模拟数据
    console.log('⚠ 微博API不可用，使用模拟数据');
    return fetchWeiboMock(limit);
  } catch (error) {
    console.error('✗ 微博热搜抓取失败:', error);
    // 返回模拟数据
    return fetchWeiboMock(limit);
  }
}

/**
 * 从微博API抓取热搜（实验性）
 * 注意：可能需要额外的认证或cookie
 */
async function fetchWeiboFromAPI(limit: number): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  try {
    // 微博热搜的公开API（可能随时失效）
    const WEIBO_HOT_API = 'https://weibo.com/ajax/side/hotSearch';

    const response = await fetch(WEIBO_HOT_API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://weibo.com',
        'Accept': 'application/json, text/plain, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`微博API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const hotList = data?.data?.realtime || [];

    for (const item of hotList.slice(0, limit)) {
      if (!item.word) continue;

      const title = `${item.rank || ''} ${item.word} ${item.hot_value ? '• ' + item.hot_value : ''
        }`;
      const summary = item.category || '微博热搜';
      const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`;

      // 提取标签
      const tags: string[] = ['微博', '热搜'];
      if (item.category) {
        tags.push(item.category);
      }

      items.push({
        id: '',
        source: 'weibo',
        sourceName: '微博热搜',
        title,
        summary: `${summary}${item.hot_value ? ` • 热度: ${item.hot_value}` : ''}`,
        url,
        publishTime: new Date(),
        read: false,
        tags,
        createdAt: new Date(),
      });
    }

    console.log(`✓ 微博热搜: 抓取 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error('微博API抓取失败:', error);
    return [];
  }
}

/**
 * 微博热搜模拟数据（用于测试和降级）
 */
export async function fetchWeiboMock(limit: number = 20): Promise<FeedItem[]> {
  const mockTopics = [
    { word: '今日科技热点', category: '科技' },
    { word: 'AI技术突破', category: '科技' },
    { word: '程序员日常', category: '职场' },
    { word: '产品设计趋势', category: '设计' },
    { word: '前端开发最佳实践', category: '技术' },
    { word: '后端架构设计', category: '技术' },
    { word: '云计算发展', category: '科技' },
    { word: '数据库优化', category: '技术' },
    { word: '网络安全', category: '安全' },
    { word: '移动应用开发', category: '开发' },
  ];

  return mockTopics.slice(0, limit).map((topic, index) => ({
    id: '',
    source: 'weibo' as const,
    sourceName: '微博热搜',
    title: `${index + 1} ${topic.word}`,
    summary: `微博热搜 • ${topic.category} • 热度 ${Math.floor(Math.random() * 1000000)}`,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(topic.word)}`,
    publishTime: new Date(),
    read: false,
    tags: ['微博', '热搜', topic.category],
    createdAt: new Date(),
  }));
}

/**
 * 使用第三方API抓取微博热搜
 * 可以集成第三方服务如：聚合数据、天行数据等
 */
async function fetchWeiboFromThirdParty(): Promise<FeedItem[]> {
  // TODO: 集成第三方API
  // 示例：使用聚合数据的微博热搜API
  // const API_KEY = process.env.JUHE_API_KEY;
  // const response = await fetch(`http://apis.juhe.cn/weibo/query?key=${API_KEY}`);
  return [];
}

/**
 * 验证微博热搜API是否可用
 */
export async function validateWeiboApi(): Promise<boolean> {
  try {
    const response = await fetch('https://weibo.com/ajax/side/hotSearch', {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 获取微博热搜元数据
 */
export async function getWeiboMetadata(): Promise<{
  title?: string;
  description?: string;
  updateFrequency?: string;
} | null> {
  return {
    title: '微博热搜',
    description: '微博平台实时热门话题',
    updateFrequency: '实时更新',
  };
}

/**
 * 从微博搜索页面抓取（备用方法，使用HTML解析）
 * 注意：此方法需要 Cheerio 或类似库来解析HTML
 */
async function fetchWeiboFromHTML(): Promise<FeedItem[]> {
  // TODO: 实现HTML解析
  // const response = await fetch('https://s.weibo.com/top/summary');
  // const html = await response.text();
  // 使用 Cheerio 或 jsdom 解析HTML
  return [];
}
