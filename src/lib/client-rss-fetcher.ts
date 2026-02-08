/**
 * 客户端RSS获取器
 * 用于在浏览器中直接获取RSS源，绕过服务端的访问限制
 */

export interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  categories?: string[];
}

export interface ParsedRSS {
  title: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

// CORS代理列表
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * 尝试通过CORS代理获取RSS
 */
async function fetchThroughProxies(url: string): Promise<string> {
  let lastError: Error | null = null;

  // 尝试每个代理
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      console.log(`[CORS Proxy] 尝试代理 ${i + 1}/${CORS_PROXIES.length}: ${CORS_PROXIES[i]}`);

      const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Proxy ${i + 1} returned ${response.status}`);
      }

      const content = await response.text();
      console.log(`[CORS Proxy] 代理 ${i + 1} 成功`);
      return content;
    } catch (error) {
      lastError = error as Error;
      console.error(`[CORS Proxy] 代理 ${i + 1} 失败:`, (error as Error).message);
      // 继续尝试下一个代理
    }
  }

  throw lastError || new Error('All CORS proxies failed');
}

/**
 * 从浏览器直接获取RSS内容（使用CORS代理）
 */
export async function fetchRSSFromBrowser(url: string): Promise<string> {
  // 规范化URL：如果用户忘记��入协议，自动添加 https://
  let normalizedUrl = url.trim();
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = `https://${normalizedUrl}`;
    console.log('[Browser Fetch] 自动添加 https:// 前缀:', normalizedUrl);
  }

  // 先尝试直接访问（适用于同源或支持CORS的RSS）
  try {
    console.log('[Browser Fetch] 尝试直接访问:', normalizedUrl);
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': navigator.userAgent,
      },
      cache: 'no-cache',
    });

    if (response.ok) {
      const content = await response.text();
      console.log('[Browser Fetch] 直接访问成功');
      return content;
    }

    console.log('[Browser Fetch] 直接访问失败，状态码:', response.status);
  } catch (error) {
    console.log('[Browser Fetch] 直接访问失败，可能存在CORS限制:', (error as Error).message);
  }

  // 如果直接访问失败，尝试CORS代理
  console.log('[Browser Fetch] 尝试使用CORS代理');
  return await fetchThroughProxies(normalizedUrl);
}

/**
 * 解析RSS XML内容
 */
export function parseRSSXML(xmlText: string): ParsedRSS {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // 检查解析错误
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid RSS format');
  }

  // 获取RSS基本信息
  const channel = xmlDoc.querySelector('channel') || xmlDoc.querySelector('feed');
  if (!channel) {
    throw new Error('No channel or feed found');
  }

  const title = channel.querySelector('title')?.textContent || '';
  const description = channel.querySelector('description')?.textContent ||
                      channel.querySelector('subtitle')?.textContent || undefined;
  const link = channel.querySelector('link')?.textContent ||
               channel.querySelector('atom\\:link')?.getAttribute('href') || undefined;

  // 获取文章列表
  const items: RSSItem[] = [];
  const itemNodes = xmlDoc.querySelectorAll('item, entry');

  itemNodes.forEach((item) => {
    const title = item.querySelector('title')?.textContent;
    if (!title) return;

    const link = item.querySelector('link')?.textContent ||
                 (item.querySelector('link') as HTMLElement)?.getAttribute('href') || '';

    const pubDate = item.querySelector('pubDate')?.textContent ||
                    item.querySelector('published')?.textContent ||
                    item.querySelector('updated')?.textContent || undefined;

    const contentSnippet = item.querySelector('description')?.textContent ||
                          item.querySelector('summary')?.textContent || undefined;

    const content = item.querySelector('content\\:encoded')?.textContent ||
                   item.querySelector('content')?.textContent || undefined;

    const summary = item.querySelector('description')?.textContent ||
                   item.querySelector('summary')?.textContent || undefined;

    const categories: string[] = [];
    item.querySelectorAll('category').forEach((cat) => {
      const text = cat.textContent;
      if (text) categories.push(text);
    });

    items.push({
      title,
      link,
      pubDate,
      contentSnippet,
      content,
      summary,
      categories: categories.length > 0 ? categories : undefined,
    });
  });

  return {
    title,
    description,
    link,
    items,
  };
}

/**
 * 验证RSS源（客户端版本）
 */
export async function validateRSSFromClient(url: string): Promise<{
  valid: boolean;
  metadata?: {
    title?: string;
    description?: string;
    link?: string;
  };
  error?: string;
}> {
  // 规范化URL：如果用户忘记输入协议，自动添加 https://
  let normalizedUrl = url.trim();
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = `https://${normalizedUrl}`;
    console.log('[Client Validation] 自动添加 https:// 前缀:', normalizedUrl);
  }

  try {
    const xmlText = await fetchRSSFromBrowser(normalizedUrl);
    const parsed = parseRSSXML(xmlText);

    return {
      valid: true,
      metadata: {
        title: parsed.title,
        description: parsed.description,
        link: parsed.link,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Client Validation] 错误详情:', errorMsg);

    // 返回友好的错误提示
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS')) {
      return { valid: false, error: '网络错误或CORS限制。系统已自动尝试3个CORS代理，建议：1) 检查RSS链接是否正确 2) 尝试其他RSS源' };
    } else if (errorMsg.includes('Invalid RSS') || errorMsg.includes('parsererror')) {
      return { valid: false, error: 'RSS格式错误，无法解析内容。可能原因：1) URL不正确 2) 该链接不是RSS源 3) RSS源暂时不可用' };
    } else if (errorMsg.includes('All CORS proxies failed')) {
      return { valid: false, error: '所有CORS代理均失败。建议检查RSS源是否可访问，或尝试其他RSS源' };
    }

    return { valid: false, error: `验证失败: ${errorMsg}` };
  }
}

/**
 * 客户端预览RSS内容（前几条）
 */
export async function previewRSSFromClient(url: string, maxItems: number = 5): Promise<{
  success: boolean;
  items?: Array<{
    title: string;
    link: string;
    summary?: string;
  }>;
  error?: string;
}> {
  try {
    const xmlText = await fetchRSSFromBrowser(url);
    const parsed = parseRSSXML(xmlText);

    const items = parsed.items.slice(0, maxItems).map((item) => ({
      title: item.title,
      link: item.link,
      summary: item.contentSnippet || item.summary || item.content?.substring(0, 200),
    }));

    return {
      success: true,
      items,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
