import { NextRequest, NextResponse } from "next/server";
import { validateRSSUrl, getRSSMetadata } from "@/lib/fetchers/rss-fetcher";
import { validateRSSUrlWithProxy, getRSSMetadataWithProxy } from "@/lib/fetchers/proxied-rss-fetcher";

export async function POST(request: NextRequest) {
  try {
    const { url, useProxy = false } = await request.json();

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

    // 优先尝试使用代理（适合国内源）
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
          hint: "如果是国内RSS源，可能需要使用代理。此问题已自动处理，如果仍然失败，请稍后重试。",
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
