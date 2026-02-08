import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings, Settings } from "@/lib/settings";

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
      });
    }

    return NextResponse.json({
      configured: true,
      provider: aiSettings.provider || "openai",
      apiKeyPreview: `${aiSettings.apiKey.slice(0, 4)}****`,
      apiUrl: aiSettings.apiUrl,
      model: aiSettings.model,
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
    const { provider, apiKey, apiUrl, model } = body;

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
      },
      updatedAt: new Date().toISOString(),
    };

    await saveSettings(newSettings);

    return NextResponse.json({
      success: true,
      configured: true,
      provider: newSettings.aiSettings?.provider,
      apiKeyPreview: `${apiKey.slice(0, 4)}****`,
    });
  } catch (error) {
    console.error("AI Settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save AI settings" },
      { status: 500 }
    );
  }
}
