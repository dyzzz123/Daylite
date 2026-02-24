import { NextRequest, NextResponse } from "next/server";

// 获取预设服务商的默认 URL
function getProviderUrl(provider: string): string {
  const presets: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    deepseek: "https://api.deepseek.com/v1/chat/completions",
    claude: "https://api.anthropic.com/v1/messages",
  };
  return presets[provider] || "https://api.openai.com/v1/chat/completions";
}

// 获取预设服务商的默认模型
function getDefaultModel(provider: string): string {
  const presets: Record<string, string> = {
    openai: "gpt-3.5-turbo",
    deepseek: "deepseek-chat", // DeepSeek-V3
    claude: "claude-3-5-sonnet-20241022",
  };
  return presets[provider] || "gpt-3.5-turbo";
}

// 判断是否为 Claude API
function isClaudeAPI(url: string): boolean {
  return url.includes("anthropic.com");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, apiUrl, model } = body;

    // 验证必填字段
    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "API Key 是必填项" },
        { status: 400 }
      );
    }

    // 确定 API URL 和模型
    const url = apiUrl || getProviderUrl(provider || "openai");
    const modelName = model || getDefaultModel(provider || "openai");

    // 验证 URL 格式（提示用户可能是路径问题）
    if (!url.includes("/chat/completions") && !url.includes("/messages")) {
      return NextResponse.json(
        {
          valid: false,
          error: `API URL 可能不完整。你的 URL: ${url}\n提示：OpenAI 兼容 API 通常以 /v1/chat/completions 结尾\n完整示例：https://api.example.com/v1/chat/completions`,
        },
        { status: 200 }
      );
    }

    // 判断 API 类型
    const useClaude = isClaudeAPI(url);

    // 准备测试请求
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let testRequestBody: unknown;

    if (useClaude) {
      // Claude API 格式
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";

      testRequestBody = {
        model: modelName,
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hi",
          },
        ],
      };
    } else {
      // OpenAI 兼容格式
      headers["Authorization"] = `Bearer ${apiKey}`;

      testRequestBody = {
        model: modelName,
        messages: [
          {
            role: "user",
            content: "Hi",
          },
        ],
        max_tokens: 10,
      };
    }

    // 发送测试请求（设置超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    // 调试日志
    console.log("AI Test Request:", {
      url,
      modelName,
      headers: { ...headers, Authorization: headers.Authorization ? "Bearer ***" : undefined },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(testRequestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("AI Test Success");
        return NextResponse.json({
          valid: true,
          message: "API 配置有效，连接成功",
        });
      } else {
        // 尝试读取错误信息
        let errorDetail = "";
        let responseText = "";
        try {
          responseText = await response.text();
          const errorData = JSON.parse(responseText);
          errorDetail = errorData.error?.message || errorData.error || JSON.stringify(errorData);
        } catch {
          errorDetail = responseText.slice(0, 200);
        }

        console.error("AI Test Failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorDetail,
          responseText: responseText.slice(0, 500),
        });

        return NextResponse.json(
          {
            valid: false,
            error: `API 返回错误 (${response.status}): ${errorDetail}`,
          },
          { status: 200 } // 返回 200 让前端能正常显示错误信息
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              valid: false,
              error: "请求超时，请检查 API 地址是否正确",
            },
            { status: 200 }
          );
        }
        return NextResponse.json(
          {
            valid: false,
            error: `连接失败: ${fetchError.message}`,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          error: "连接失败，请检查网络或 API 地址",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("AI test API error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`,
      },
      { status: 200 } // 返回 200 让前端能正常显示错误信息
    );
  }
}
