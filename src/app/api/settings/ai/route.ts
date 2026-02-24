import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings, Settings } from "@/lib/settings";
import { AI_ROLE_TEMPLATES } from "@/lib/ai-roles";

// GET - 获取AI配置（不需要PIN验证，用于前端显示）
export async function GET() {
  try {
    const settings = await getSettings();
    const aiSettings = settings?.aiSettings;

    if (!aiSettings || !aiSettings.apiKey) {
      return NextResponse.json({
        configured: false,
        provider: "openai",
        apiKeyPreview: null,
        aiRole: AI_ROLE_TEMPLATES.default.prompt,
        aiSummaryEnabled: settings?.aiSummaryEnabled ?? true, // 默认开启
      });
    }

    return NextResponse.json({
      configured: true,
      provider: aiSettings.provider || "openai",
      apiKeyPreview: `${aiSettings.apiKey.slice(0, 4)}****`,
      apiUrl: aiSettings.apiUrl,
      model: aiSettings.model,
      aiRole: aiSettings.aiRole || AI_ROLE_TEMPLATES.default.prompt,
      aiSummaryEnabled: settings?.aiSummaryEnabled ?? true, // 默认开启
    });
  } catch (error) {
    console.error("AI Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to get AI settings" },
      { status: 500 }
    );
  }
}

// POST - 保存AI配置（不需要PIN验证）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, apiUrl, model, aiRole, aiSummaryEnabled } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 获取现有设置
    const existingSettings = await getSettings();

    // 构建新的AI设置
    const newSettings: Settings = {
      ...(existingSettings || {}),
      aiSettings: {
        provider: provider || "openai",
        apiKey,
        apiUrl,
        model,
        aiRole,
      },
      aiSummaryEnabled: aiSummaryEnabled ?? true, // 默认开启
      updatedAt: new Date().toISOString(),
    };

    await saveSettings(newSettings);

    // 保存成功后，自动测试 API 配置
    let testResult: { valid: boolean; message?: string; error?: string } = {
      valid: false,
      message: "",
    };

    try {
      // 调用测试接口
      const testUrl = new URL("/api/settings/ai/test", request.url);
      const testResponse = await fetch(testUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, apiUrl, model }),
      });

      if (testResponse.ok) {
        testResult = await testResponse.json();
      } else {
        testResult = {
          valid: false,
          error: "测试请求失败",
        };
      }
    } catch (testError) {
      console.error("AI test error:", testError);
      testResult = {
        valid: false,
        error: testError instanceof Error ? testError.message : "测试失败",
      };
    }

    return NextResponse.json({
      success: true,
      configured: true,
      provider: newSettings.aiSettings?.provider,
      apiKeyPreview: `${apiKey.slice(0, 4)}****`,
      aiSummaryEnabled: newSettings.aiSummaryEnabled,
      // 新增：测试结果
      testResult,
    });
  } catch (error) {
    console.error("AI Settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save AI settings" },
      { status: 500 }
    );
  }
}
