import { NextRequest, NextResponse } from "next/server";
import { getAIConfig, getSettings } from "@/lib/settings";
import { AI_ROLE_TEMPLATES } from "@/lib/ai-roles";
import { getTodayFeedItems } from "@/lib/feed-service";
import { createDailyReport, getTodayDailyReport } from "@/lib/report-service";
import type { FeedItem } from "@/types";

// 判断是否为 Claude API（通过 URL 判断）
// 注意��大部分第三方 API（包括红叶云、AI Code With 等）都返回 OpenAI 格式
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

    // 获取 AI 角色设定
    const settings = await getSettings();
    const aiRole = settings?.aiSettings?.aiRole || AI_ROLE_TEMPLATES.default.prompt;

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

    console.log("Today feed count:", todayFeed.length);
    console.log("AI Role:", aiRole);
    console.log("Prompt:", prompt);

    const useClaude = isClaudeAPI(apiUrl);

    // 准备请求头和请求体
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let requestBody: unknown;

    // 构建 system prompt，包含 AI 角色设定
    const systemPrompt = buildSystemPrompt(aiRole);

    if (useClaude) {
      // Claude API 格式
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";

      requestBody = {
        model: model,
        max_tokens: 1000, // 增加token限制以支持更长的输出
        messages: [
          {
            role: "user",
            content: systemPrompt + "\n\n" + prompt,
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
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000, // 增加token限制以支持更长的输出
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

    // 调试日志：打印完整的 AI 响应
    console.log("AI API Response:", JSON.stringify(result, null, 2));
    console.log("Model used:", model);

    // 解析响应（处理不同 API 的格式）
    let summary: string;
    let keyPoints: string[] = [];

    if (useClaude) {
      // Claude 响应格式
      const content = result.content?.[0]?.text;
      if (content) {
        const lines = content.split('\n').filter((line: string) => line.trim());
        summary = lines[0] || (todayFeed.length > 0 ? "今日信息已整理完毕" : "暂无今日信息，请尝试刷新信息流");
        // 只提取以「•」开头的行作为关键点
        keyPoints = lines.slice(1).filter((line: string) => line.includes('•'));
      } else {
        summary = todayFeed.length > 0 ? "今日信息已整理完毕" : "暂无今日信息，请尝试刷新信息流";
      }
    } else {
      // OpenAI 响应格式（兼容 GLM 等第三方 API）
      let content = result.choices?.[0]?.message?.content;

      // GLM API 特殊处理：content 可能为空，实际内容在 reasoning_content 中
      const reasoningContent = result.choices?.[0]?.message?.reasoning_content;

      if (!content || content.trim() === "") {
        content = reasoningContent;
      }

      console.log("OpenAI content:", content);
      console.log("Content length:", content?.length);

      // 检查是否是 GLM 模型且只有 reasoning_content 没有 content
      const isGLMWithOnlyReasoning = model.includes("GLM") &&
        (!result.choices?.[0]?.message?.content || result.choices?.[0]?.message?.content.trim() === "") &&
        reasoningContent;

      if (isGLMWithOnlyReasoning) {
        console.warn("GLM model returned only reasoning_content without final output, using mock summary");
        // GLM 模型没有返回最终总结，使用本地 mock
        const mockSummary = generateMockSummary(todayFeed);
        summary = mockSummary.summary;
        keyPoints = mockSummary.keyPoints;
      } else if (content && content.trim()) {
        // 正常处理 content
        const lines = content.split('\n').filter((line: string) => line.trim());
        console.log("OpenAI parsed lines:", lines);
        summary = lines[0] || (todayFeed.length > 0 ? "今日信息已整理完毕" : "暂无今日信息，请尝试刷新信息流");
        // 只提取以「•」开头的行作为关键点
        keyPoints = lines.slice(1).filter((line: string) => line.includes('•'));
      } else {
        summary = todayFeed.length > 0 ? "今日信息已整理完毕" : "暂无今日信息，请尝试刷新信息流";
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
  const timeOfDay = currentHour < 12 ? "上午好" : currentHour < 18 ? "下午好" : "晚上好";

  // 如果没有信息，返回简洁提示
  if (feed.length === 0) {
    return `
${timeOfDay}！目前还没有今日信息。请稍后再试或点击「刷新信息流」手动抓取最新内容。
`;
  }

  // 按信息源分组
  const rssItems = feed.filter(item => item.source === 'rss');
  const xiaohongshuItems = feed.filter(item => item.source === 'xiaohongshu');
  const zhihuItems = feed.filter(item => item.source === 'zhihu');
  const weiboItems = feed.filter(item => item.source === 'weibo');
  const forumItems = feed.filter(item => item.source === 'forum');

  // 构建完整的信息列表（不截断，让 AI 根据角色自主判断）
  const feedSections = [];

  if (rssItems.length > 0) {
    feedSections.push(`**RSS订阅（${rssItems.length}条）：**
${rssItems.map(item => `- ${item.sourceName}：${item.title}`).join('\n')}`);
  }

  if (xiaohongshuItems.length > 0) {
    feedSections.push(`**小红书动态（${xiaohongshuItems.length}条）：**
${xiaohongshuItems.map(item => `- ${item.sourceName}：${item.title}`).join('\n')}`);
  }

  if (zhihuItems.length > 0) {
    feedSections.push(`**知乎动态（${zhihuItems.length}条）：**
${zhihuItems.map(item => `- ${item.sourceName}：${item.title}`).join('\n')}`);
  }

  if (weiboItems.length > 0) {
    feedSections.push(`**微博动态（${weiboItems.length}条）：**
${weiboItems.map(item => `- ${item.sourceName}：${item.title}`).join('\n')}`);
  }

  if (forumItems.length > 0) {
    feedSections.push(`**论坛动态（${forumItems.length}条）：**
${forumItems.map(item => `- ${item.sourceName}：${item.title}`).join('\n')}`);
  }

  return `
${timeOfDay}！今天共收集到 ${feed.length} 条信息，请根据你的专业角色进行筛选和总结。

**今日完整信息流：**

${feedSections.join('\n\n')}

**输出要求：**
- 根据你的角色定位，筛选出最重要、最相关的信息
- 不要输出「1.」「2.」这样的编号列表，直接用自然语言
- 信息少时简洁汇报，信息多时详细分析
- 每个要点用「•」开头
- 如果信息量很大，可以分层次总结（先总体，再重点展开）
`;
}

// 构建包含 AI 角色的 system prompt
function buildSystemPrompt(aiRole: string): string {
  return `${aiRole}

**你的工作方式：**
1. 深入理解你的角色定位，从该角色的专业视角分析信息
2. 根据信息量动态调整汇报长度：
   - 信息少（1-5条）：简洁总结，每条信息一句话带过
   - 信息中（6-15条）：正常汇报，突出重点信息
   - 信息多（16+条）：详细分析，可分层次总结（先总体，再重点展开）
3. 只汇报与你的角色相关的有价值信息，忽略无关内容
4. 用你的专业眼光判断信息价值，而不是简单罗列
5. 第一句话是开场问候和总体概述，然后列出重点信息

**输出格式：**
用自然语言直接对用户说话，不要使用任何编号或Markdown格式标记，每个要点用「•」开头。
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
    : "早上好！今天还没有新的信息。点击「刷新信息流」按钮可以手动抓取最新内容。";

  return {
    summary,
    keyPoints,
    isMock: true,
  };
}
