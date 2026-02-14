import { NextRequest, NextResponse } from "next/server";
import { validateRSSUrl, getRSSMetadata, fetchRSS } from "@/lib/fetchers/rss-fetcher";
import { validateRSSUrlWithProxy, getRSSMetadataWithProxy, fetchRSSWithProxy } from "@/lib/fetchers/proxied-rss-fetcher";
import { validateRSSHubUrl, getRSSHubMetadata, fetchRSSHub } from "@/lib/fetchers/rsshub-fetcher";

// 常见的 RSS 路径格式
const COMMON_RSS_PATHS = [
  '/feed',
  '/feed.xml',
  '/rss',
  '/rss.xml',
  '/atom.xml',
  '/index.xml',
  '?feed=rss2',
  '?feed=atom',
  '/?feed=rss',
  '/?feed=atom',
  '/feed/',
  '/rss/',
];

/**
 * 分批并行处理数组
 * @param array 要处理的数组
 * @param batchSize 每批处理数量
 * @param processor 处理函数
 */
async function processBatch<T, R>(
  array: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * 智能发现 RSS URL（并行+分批版本）
 * 并行尝试常见的 RSS 路径，大幅提高速度，同时避免过载
 */
async function discoverRSSUrl(baseUrl: string): Promise<{
  foundUrl: string | null;
  metadata: any;
  attemptedPaths: string[];
}> {
  const urlObj = new URL(baseUrl);
  const baseDomain = urlObj.origin;
  const attemptedPaths: string[] = [];

  console.log(`[RSS Discovery] 开始并行智能发现，基础 URL: ${baseDomain}`);

  // 构建所有要尝试的 URL 列表
  const urlsToTry = [baseUrl, ...COMMON_RSS_PATHS.map(path => `${baseDomain}${path}`)];
  attemptedPaths.push(...urlsToTry);

  // 分批并行验证，每批6个（避免同时发起太多请求）
  const batchSize = 6;
  console.log(`[RSS Discovery] 分批并行验证 ${urlsToTry.length} 个路径（每批 ${batchSize} 个）...`);

  const results = await processBatch(
    urlsToTry,
    batchSize,
    async (url) => {
      const result = await tryValidateRSS(url);
      return { url, result };
    }
  );

  // 找到第一个有效的 URL
  for (const { url, result } of results) {
    if (result.valid) {
      console.log(`[RSS Discovery] ✓ 找到有效的 RSS URL: ${url}`);
      return {
        foundUrl: url,
        metadata: result.metadata,
        attemptedPaths,
      };
    }
  }

  // 所有尝试都失败
  console.log(`[RSS Discovery] ✗ 所有路径均失败，已尝试 ${attemptedPaths.length} 个路径`);
  return {
    foundUrl: null,
    metadata: null,
    attemptedPaths,
  };
}

/**
 * 尝试验证 RSS URL 并检查是否有内容
 * 改进版：更加宽容，只要能解析且有元数据就认为有效
 */
async function tryValidateRSS(url: string): Promise<{
  valid: boolean;
  metadata: any;
}> {
  try {
    console.log(`[RSS Validation] 开始验证: ${url}`);

    // 1. 尝试通过代理获取RSS内容
    let metadata = null;
    let hasItems = false;

    try {
      // 先获取元数据
      metadata = await getRSSMetadataWithProxy(url);

      if (!metadata || !metadata.title) {
        console.log(`[RSS Validation] ${url} 无法获取元数据`);
        return { valid: false, metadata: null };
      }

      console.log(`[RSS Validation] ${url} 获取到元数据: ${metadata.title}`);

      // 2. 尝试抓取内容（但不强制要求成功）
      try {
        const items = await fetchRSSWithProxy({
          url,
          sourceName: metadata.title,
          useProxy: true,
        });

        if (items && items.length > 0) {
          hasItems = true;
          const firstItem = items[0];

          if (firstItem.title) {
            console.log(`[RSS Validation] ✓ ${url} 验证成功 (${items.length} 篇文章)`);

            // 检查是否有正文
            const hasContent = !!firstItem.summary && firstItem.summary !== firstItem.title;

            return {
              valid: true,
              metadata: {
                ...metadata,
                warning: hasContent ? undefined : '该RSS源正文内容较少',
              },
            };
          }
        }
      } catch (fetchError) {
        console.log(`[RSS Validation] ${url} 内容抓取失败，但元数据有效:`, fetchError instanceof Error ? fetchError.message : fetchError);
        // 即使抓取失败，只要有元数据也认为有效
        return {
          valid: true,
          metadata: {
            ...metadata,
            warning: '内容抓取失败，但RSS源有效',
          },
        };
      }

      // 如果到这里说明有元数据但没有成功抓取内容
      console.log(`[RSS Validation] ${url} 有元数据但无法验证内容`);
      return {
        valid: true,
        metadata: {
          ...metadata,
          warning: '无法验证文章内容，但RSS源格式正确',
        },
      };
    } catch (metadataError) {
      console.log(`[RSS Validation] ${url} 元数据获取失败:`, metadataError instanceof Error ? metadataError.message : metadataError);
      return { valid: false, metadata: null };
    }
  } catch (error) {
    console.log(`[RSS Validation] ${url} 验证异常:`, error instanceof Error ? error.message : error);
    return { valid: false, metadata: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, useProxy = false, autoDiscover = true } = await request.json();

    if (!url) {
      return NextResponse.json(
        { valid: false, error: "请提供RSS链接" },
        { status: 400 }
      );
    }

    // 规范化URL：如果用户忘记输入协议，自动添加 https://
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
      console.log('[RSS Validation] 自动添加 https:// 前缀:', normalizedUrl);
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { valid: false, error: "URL格式错误，请输入完整的RSS链接（例如：https://example.com/feed）" },
        { status: 400 }
      );
    }

    // 检测是否是 RSSHub 链接
    const isRsshubUrl = normalizedUrl.includes('rsshub.app') ||
                       normalizedUrl.includes('rsshub.') ||
                       normalizedUrl.includes('rss.forever');

    if (isRsshubUrl) {
      console.log('[RSS Validation] 检测到 RSSHub 链接，使用专用 fetcher');

      try {
        // 使用专门的 RSSHub fetcher
        const validationResult = await validateRSSHubUrl(normalizedUrl);

        if (!validationResult.valid) {
          return NextResponse.json(
            {
              valid: false,
              error: `RSSHub 验证失败：${validationResult.error || '未知错误'}

建议：
1. 检查RSSHub链接是否正确
2. 尝试使用其他RSSHub镜像（如 rsshub.rss.forever.com）
3. 稍后重试，可能是临时网络问题`,
            },
            { status: 400 }
          );
        }

        // 获取元数据
        const metadata = await getRSSHubMetadata(normalizedUrl);

        return NextResponse.json({
          valid: true,
          metadata: metadata || { title: 'RSSHub 源' },
          url: normalizedUrl,
          message: '✓ RSSHub源验证成功！',
        });
      } catch (error: any) {
        console.error('[RSS Validation] RSSHub 验证失败:', error);
        return NextResponse.json(
          {
            valid: false,
            error: `RSSHub 连接失败：${error.message || '未知错误'}

可能的原因：
1. RSSHub 服务暂时不可用
2. 网络连接问题
3. 反爬虫机制阻止了访问

建议：
- 稍后重试
- 尝试使用RSSHub镜像服务
- 或者部署自己的RSSHub实例`,
          },
          { status: 400 }
        );
      }
    }

    // 如果启用自动发现
    if (autoDiscover) {
      console.log('[RSS Validation] 启用智能 RSS 发现模式');

      const discoveryResult = await discoverRSSUrl(normalizedUrl);

      if (discoveryResult.foundUrl) {
        // 如果找到的 URL 和用户输入的不同，更新 URL
        const finalUrl = discoveryResult.foundUrl;
        const isUrlChanged = finalUrl !== normalizedUrl;

        return NextResponse.json({
          valid: true,
          metadata: discoveryResult.metadata,
          url: finalUrl,
          isUrlChanged,
          message: isUrlChanged
            ? `✓ 已自动发现正确的 RSS 地址！\n\n原地址：${normalizedUrl}\n正确地址：${finalUrl}`
            : '✓ RSS源验证成功！',
          attemptedPaths: discoveryResult.attemptedPaths,
        });
      } else {
        // 自动发现失败
        return NextResponse.json(
          {
            valid: false,
            error: `无法找到有效的RSS源。\n\n已尝试 ${discoveryResult.attemptedPaths.length} 个常见路径：\n${discoveryResult.attemptedPaths.slice(0, 5).map(p => `• ${p}`).join('\n')}\n\n建议：\n1. 确认网站是否提供RSS订阅\n2. 手动查找RSS链接（通常在页面底部）\n3. 访问网站确认网站是否正常运行`,
            attemptedPaths: discoveryResult.attemptedPaths,
          },
          { status: 400 }
        );
      }
    }

    // 原有的简单验证模式（不使用自动发现）
    let validationResult;
    let metadata;

    if (useProxy || true) { // 默认使用代理
      console.log('[RSS Validation] 使用代理验证');
      validationResult = await validateRSSUrlWithProxy(normalizedUrl);
      if (validationResult.valid) {
        metadata = await getRSSMetadataWithProxy(normalizedUrl);
      }
    }

    // 如果代理失败，尝试直接连接
    if (!validationResult?.valid) {
      console.log('[RSS Validation] 代理失败，尝试直接连接');
      validationResult = await validateRSSUrl(normalizedUrl);
      if (validationResult.valid) {
        metadata = await getRSSMetadata(normalizedUrl);
      }
    }

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validationResult.error || "无法解析RSS源，请检查链接是否正确",
          hint: "建议启用智能发现模式，系统会自动尝试常见的RSS路径",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      metadata,
    });
  } catch (error) {
    console.error("RSS validation error:", error);
    return NextResponse.json(
      { valid: false, error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
