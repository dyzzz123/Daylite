import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings, verifyPin, getAIConfig, Settings } from "@/lib/settings";

// GET - 获取设置（需要 PIN 验证）
export async function GET(request: NextRequest) {
  try {
    // 从请求头或查询参数获取 PIN
    const pin = request.headers.get("x-pin") ||
      new URL(request.url).searchParams.get("pin");

    // 验证 PIN
    const isValid = await verifyPin(pin || "");
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // 返回设置（隐藏 API Key）
    const settings = await getSettings();
    if (!settings) {
      return NextResponse.json({
        pinSet: false,
        aiConfigured: false,
      });
    }

    return NextResponse.json({
      pinSet: !!settings.pin,
      aiConfigured: !!settings.aiSettings?.apiKey,
      provider: settings.aiSettings?.provider || "openai",
      // API Key 只返回前4位，用于显示
      apiKeyPreview: settings.aiSettings?.apiKey
        ? `${settings.aiSettings.apiKey.slice(0, 4)}****`
        : null,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// POST - 保存设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, aiSettings, calendar, todo, feed, currentPin } = body;

    // 验证当前 PIN（如果已设置）
    const existingSettings = await getSettings();
    if (existingSettings?.pin) {
      const isValid = await verifyPin(currentPin || "");
      if (!isValid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 401 }
        );
      }
    }

    // 构建新设置
    const newSettings: Settings = {
      ...(existingSettings || {}),
      updatedAt: new Date().toISOString(),
    };

    // 更新 PIN
    if (pin !== undefined) {
      newSettings.pin = pin || undefined;
    }

    // 更新 AI 设置
    if (aiSettings) {
      newSettings.aiSettings = aiSettings;
    }

    // 更新数据源设置
    if (calendar) {
      newSettings.calendar = calendar;
    }
    if (todo) {
      newSettings.todo = todo;
    }
    if (feed) {
      newSettings.feed = feed;
    }

    await saveSettings(newSettings);

    return NextResponse.json({
      success: true,
      pinSet: !!newSettings.pin,
      aiConfigured: !!newSettings.aiSettings?.apiKey,
    });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
