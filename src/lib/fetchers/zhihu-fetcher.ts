import type { FeedItem } from '@/types';

export interface ZhihuFetcherConfig {
  limit?: number;
}

// 知乎热榜API端点
const ZHIHU_HOT_API = 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total';

/**
 * 抓取知乎热榜
 * @returns Promise<FeedItem[]>
 */
export async function fetchZhihuHot(
  config: ZhihuFetcherConfig = {}
): Promise<FeedItem[]> {
  const { limit = 50 } = config;
  const items: FeedItem[] = [];

  try {
    // 知乎热榜API
    const response = await fetch(ZHIHU_HOT_API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`知乎热榜API请求失败: ${response.status}`);
    }

    const data = await response.json();

    // 知乎热榜数据结构: data.data 是一个数组
    const hotList = data?.data || [];

    for (const item of hotList.slice(0, limit)) {
      const target = item?.target;

      if (!target) continue;

      // 提取标题
      const title = target.title;
      if (!title) continue;

      // 提取摘要
      let summary = '';
      if (target.excerpt) {
        summary = target.excerpt.substring(0, 300);
      } else if (target.type === 'answer') {
        summary = `知乎热榜 • ${target.type || '话题'} • 热度 ${item.hot_value || 'N/A'}`;
      } else {
        summary = `知乎热榜 • 热度 ${item.hot_value || 'N/A'}`;
      }

      // 提取URL
      const url = target.url || `https://www.zhihu.com/question/${target.id}`;

      // 提取热度
      const hotValue = item.hot_value || item.detail_text || 'N/A';

      // 提取作者
      const author = target.author?.name || '知乎';

      // 构建标签
      const tags: string[] = ['知乎', '热榜'];
      if (target.type) {
        tags.push(target.type);
      }
      if (target.category?.name) {
        tags.push(target.category.name);
      }

      // 提取时间（知乎API返回的是创建时间）
      const publishTime = target.created
        ? new Date(target.created * 1000)
        : new Date();

      items.push({
        id: '', // 将由 feed-service 生成
        source: 'zhihu',
        sourceName: '知乎热榜',
        title: `${hotValue} • ${title}`,
        summary: `${summary}\n\n作者: ${author}`,
        url,
        publishTime,
        read: false,
        tags,
        createdAt: new Date(),
      });
    }

    console.log(`✓ 知乎热榜: 抓取 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error('✗ 知乎热榜抓取失败:', error);
    // 返回空数组而不是抛出错误，让调度器继续处理其他源
    return [];
  }
}

/**
 * 抓取知乎热榜（备用方法 - 使用模拟数据）
 * 当API失败时返回模拟数据用于测试
 */
export async function fetchZhihuHotMock(): Promise<FeedItem[]> {
  return [
    {
      id: '',
      source: 'zhihu',
      sourceName: '知乎热榜',
      title: '1000000 • 如何评价当前的科技发展趋势？',
      summary: '知乎热榜 • 话题 • 讨论当前科技领域的热点话题和发展趋势',
      url: 'https://www.zhihu.com/question/123456',
      publishTime: new Date(),
      read: false,
      tags: ['知乎', '热榜', '科技'],
      createdAt: new Date(),
    },
    {
      id: '',
      source: 'zhihu',
      sourceName: '知乎热榜',
      title: '999999 • 2024年最值得期待的AI产品有哪些？',
      summary: '知乎热榜 • 话题 • 汇总2024年值得关注的AI产品和创新',
      url: 'https://www.zhihu.com/question/234567',
      publishTime: new Date(),
      read: false,
      tags: ['知乎', '热榜', 'AI', '产品'],
      createdAt: new Date(),
    },
  ];
}

/**
 * 验证知乎热榜API是否可用
 */
export async function validateZhihuApi(): Promise<boolean> {
  try {
    const response = await fetch(ZHIHU_HOT_API, {
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
 * 获取知乎热榜元数据
 */
export async function getZhihuMetadata(): Promise<{
  title?: string;
  description?: string;
  updateFrequency?: string;
} | null> {
  try {
    const response = await fetch(ZHIHU_HOT_API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      title: '知乎热榜',
      description: '知乎平台热门话题和问题',
      updateFrequency: '实时更新',
    };
  } catch {
    return null;
  }
}
