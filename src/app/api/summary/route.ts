import { NextRequest, NextResponse } from "next/server";
import { getAIConfig } from "@/lib/settings";
import { getTodayFeedItems } from "@/lib/feed-service";
import { createDailyReport, getTodayDailyReport } from "@/lib/report-service";
import type { FeedItem } from "@/types";

// 判断是否为 Claude API（通过 URL 判断）
// 注意：大部分第三方 API（包括红叶云、AI Code With 等）都返回 OpenAI 格式
// 只有官方 Anthropic API 返回 Claude 格式
function isClaudeAPI(url: string): boolean {
  return url.includes("anthropic.com");
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  isMock?: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 优先从设置中获取 API 配置
    const aiConfig = await getAIConfig();

    // 回退到环境变量
    const apiKey = aiConfig?.apiKey || process.env.AI_API_KEY;
    const apiUrl = aiConfig?.apiUrl || process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
    const model = aiConfig?.model || process.env.AI_MODEL || "gpt-3.5-turbo";

    // 获取今日信息流数据
    const todayFeed = await getTodayFeedItems();

    // 如果没有配置 API Key，返回模拟的 AI 总结
    if (!apiKey) {
      console.log("AI_API_KEY not configured, returning mock summary");
      const mockSummary = generateMockSummary(todayFeed);
      return NextResponse.json(mockSummary);
    }

    // 解析请求体（可选：前端可以传入自定义数据）
    const body = await request.json().catch(() => ({}));

    // 支持forceRefresh参数来强制重新生成（忽略缓存）
    const forceRefresh = body.forceRefresh === true;

    // 如果不强制刷新，检查是否已有今日总结
    if (!forceRefresh) {
      const existingReport = await getTodayDailyReport();
      if (existingReport && existingReport.summary) {
        console.log("Returning cached daily report");
        return NextResponse.json({
          summary: existingReport.summary,
          keyPoints: existingReport.keyPoints,
          isMock: false,
          fromCache: true,
        });
      }
    } else {
      console.log("Force refresh requested, regenerating summary...");
    }

    // 构建 prompt：信息流聚合模式
    const prompt = buildPrompt(body.feed && body.feed.length > 0 ? body.feed : todayFeed);

    const useClaude = isClaudeAPI(apiUrl);

    // 准备请求头和请求体
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let requestBody: unknown;

    if (useClaude) {
      // Claude API 格式
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";

      requestBody = {
        model: model,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `你是一位高效的个人助理，擅长帮用户梳理今日信息。你的总结要简洁、实用、有重点，控制在150字以内。

${prompt}`,
          },
        ],
      };
    } else {
      // OpenAI 兼容格式
      headers["Authorization"] = `Bearer ${apiKey}`;

      requestBody = {
        model: model,
        messages: [
          {
            role: "system",
            content:
              "你是一位高效的个人助理，擅长帮用户梳理今日信息。你的总结要简洁、实用、有重点，控制在150字以内。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      };
    }

    // 调用 AI API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", error);
      // API 出错时返回 mock 数据
      const mockSummary = generateMockSummary(todayFeed);
      return NextResponse.json({
        ...mockSummary,
        error: "AI service temporarily unavailable",
      });
    }

    const result = await response.json();

    // 解析响应（处理不同 API 的格式）
    let summary: string;
    let keyPoints: string[] = [];

    if (useClaude) {
      // Claude 响应格式
      const content = result.content?.[0]?.text;
      if (content) {
        const lines = content.split('\n').filter((line: string) => line.trim());
        summary = lines[0] || "今日信息已整理完毕";
        keyPoints = lines.slice(1, 4); // 取前3个要点
      } else {
        summary = "今日信息已整理完毕";
      }
    } else {
      // OpenAI 响应格式
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        const lines = content.split('\n').filter((line: string) => line.trim());
        summary = lines[0] || "今日信息已整理完毕";
        keyPoints = lines.slice(1, 4);
      } else {
        summary = "今日信息已整理完毕";
      }
    }

    // 保存今日总结到数据库
    try {
      await createDailyReport({
        date: new Date(),
        summary,
        keyPoints,
      });
    } catch (dbError) {
      console.error("Failed to save daily report:", dbError);
      // 不影响返回结果
    }

    return NextResponse.json({
      summary,
      keyPoints,
      isMock: false,
      isFresh: true, // 标记为新生成的总结
      fromCache: false,
    });
  } catch (error) {
    console.error("Summary API error:", error);
    const todayFeed = await getTodayFeedItems().catch(() => []);
    return NextResponse.json(
      {
        ...generateMockSummary(todayFeed),
        error: "Failed to generate summary",
      },
      { status: 200 } // 仍然返回 200，让前端能正常显示
    );
  }
}

// 构建发送给 AI 的 prompt（信息流聚合模式）
function buildPrompt(feed: FeedItem[]): string {
  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 12 ? "上午" : currentHour < 18 ? "下午" : "晚上";

  // 按信息源分组（使用 source 字段而不是 sourceId）
  const rssItems = feed.filter(item => item.source === 'rss');
  const xiaohongshuItems = feed.filter(item => item.source === 'xiaohongshu');
  const zhihuItems = feed.filter(item => item.source === 'zhihu');
  const weiboItems = feed.filter(item => item.source === 'weibo');
  const forumItems = feed.filter(item => item.source === 'forum');

  // 统计各来源数量
  const sourceCounts = feed.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 取前2-3个重要信息
  const topItems = feed.slice(0, 3);

  return `
请根据以下信息，为用户生成一段个性化的今日概览总结（约150字）：

**当前时间：** ${timeOfDay}

**今日信息流（共${feed.length}条）：**

**RSS订阅（${rssItems.length}条）：**
${rssItems.slice(0, 2).map(item => `- ${item.sourceName}：${item.title}`).join('\n')}

${xiaohongshuItems.length > 0 ? `**小红书动态（${xiaohongshuItems.length}条）：**
${xiaohongshuItems.slice(0, 2).map(item => `- ${item.sourceName}：${item.title}`).join('\n')}
` : ''}

${zhihuItems.length > 0 ? `**知乎动态（${zhihuItems.length}条）：**
${zhihuItems.slice(0, 2).map(item => `- ${item.sourceName}：${item.title}`).join('\n')}
` : ''}

${weiboItems.length > 0 ? `**微博动态（${weiboItems.length}条）：**
${weiboItems.slice(0, 2).map(item => `- ${item.sourceName}：${item.title}`).join('\n')}
` : ''}

${forumItems.length > 0 ? `**论坛动态（${forumItems.length}条）：**
${forumItems.slice(0, 2).map(item => `- ${item.sourceName}：${item.title}`).join('\n')}
` : ''}

**总结要求：**
1. 用亲切的口吻，直接对用户说话
2. 突出最重要的2-3件事（按信息价值排序）
3. 控制在150字以内，简洁有力
4. 用序号或列表形式，方便快速浏览
`;
}

// 生成模拟总结（当没有 API Key 或 API 出错时使用）
function generateMockSummary(feed: FeedItem[]): SummaryResponse {
  // 统计各源数量
  const sourceCounts = feed.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 取前2-3个重要信息
  const topItems = feed.slice(0, Math.min(3, feed.length));
  const keyPoints = topItems.map(item => `• ${item.sourceName}：${item.title}`);

  const sourceSummary = Object.entries(sourceCounts)
    .slice(0, 3)
    .map(([source, count]) => `${source}${count}条`)
    .join('、');

  const summary = feed.length > 0
    ? `早上好！今天有${feed.length}条新信息${sourceSummary ? `，${sourceSummary}` : ''}。${topItems.length > 0 ? `重点关注${topItems[0].sourceName}的"${topItems[0].title}"。` : ''}`
    : "早上好！今天还没有新的信息。";

  return {
    summary,
    keyPoints,
    isMock: true,
  };
}
