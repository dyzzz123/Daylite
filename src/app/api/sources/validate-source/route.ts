import { NextRequest, NextResponse } from "next/server";
import { validateRSSUrl, getRSSMetadata } from "@/lib/fetchers/rss-fetcher";
import { validateRSSUrlWithProxy, getRSSMetadataWithProxy } from "@/lib/fetchers/proxied-rss-fetcher";
import { validateBlogUrl, getBlogMetadata } from "@/lib/fetchers/blog-fetcher";

/**
 * 通用订阅源验证 API
 * 支持 RSS 和博客��接的自动发现
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { valid: false, error: "请提供链接" },
        { status: 400 }
      );
    }

    // 规范化URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
      console.log('[Source Validation] 自动添加 https:// 前缀:', normalizedUrl);
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { valid: false, error: "URL格式错误" },
        { status: 400 }
      );
    }

    // 步骤 1: 先尝试作为 RSS 验证
    console.log('[Source Validation] 尝试作为 RSS 验证:', normalizedUrl);

    let rssResult;
    let metadata;

    // 使用代理验证 RSS
    rssResult = await validateRSSUrlWithProxy(normalizedUrl);
    if (rssResult.valid) {
      metadata = await getRSSMetadataWithProxy(normalizedUrl);
      console.log('[Source Validation] RSS 验证成功');
      return NextResponse.json({
        valid: true,
        type: 'rss',
        metadata,
      });
    }

    // 直接连接验证 RSS
    rssResult = await validateRSSUrl(normalizedUrl);
    if (rssResult.valid) {
      metadata = await getRSSMetadata(normalizedUrl);
      console.log('[Source Validation] RSS 验证成功（直接连接）');
      return NextResponse.json({
        valid: true,
        type: 'rss',
        metadata,
      });
    }

    // 步骤 2: RSS 验证失败，尝试作为博客验证
    console.log('[Source Validation] RSS 验证失败，尝试作为博客验证');

    const blogResult = await validateBlogUrl(normalizedUrl);

    if (blogResult.valid) {
      metadata = await getBlogMetadata(normalizedUrl);
      console.log('[Source Validation] 博客验证成功, feedUrl:', blogResult.feedUrl);

      return NextResponse.json({
        valid: true,
        type: 'blog',
        metadata,
        feedUrl: blogResult.feedUrl,
      });
    }

    // 步骤 3: 两种验证都失败
    console.log('[Source Validation] 所有验证失败');
    return NextResponse.json(
      {
        valid: false,
        error: blogResult.error || "无法识别此链接，请确保输入的是有效的 RSS 源或博客链接",
      },
      { status: 400 }
    );

  } catch (error) {
    console.error("Source validation error:", error);
    return NextResponse.json(
      { valid: false, error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
