import { NextRequest, NextResponse } from "next/server";
import { validateRSSUrl, getRSSMetadata } from "@/lib/fetchers/rss-fetcher";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

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

    // Validate RSS feed
    const validationResult = await validateRSSUrl(normalizedUrl);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validationResult.error || "无法解析RSS源，请检查链接是否正确",
        },
        { status: 400 }
      );
    }

    // Get metadata
    const metadata = await getRSSMetadata(normalizedUrl);

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
