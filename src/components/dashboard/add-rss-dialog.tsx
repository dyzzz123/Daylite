"use client";

import { useState } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateRSSFromClient } from "@/lib/client-rss-fetcher";

interface AddRssDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: () => void;
}

export function AddRssDialog({ isOpen, onClose, onSourceAdded }: AddRssDialogProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📰");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [autoFetchedName, setAutoFetchedName] = useState(false);

  // 预设图标选项
  const iconOptions = ["📰", "📕", "📘", "📗", "📙", "🔖", "📱", "💻", "🎯", "🌟", "🔥", "💡"];

  async function validateUrl() {
    if (!url.trim()) {
      setValidationStatus({ valid: false, message: "请输入RSS链接" });
      return;
    }

    // 规范化URL：如果用户忘记输入协议，自动添加 https://
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
      console.log('[Auto Validation] 自动添加 https:// 前缀:', normalizedUrl);
      // 更新输入框显示
      setUrl(normalizedUrl);
    }

    setIsValidating(true);
    setValidationStatus({ valid: false, message: "🔍 正在验证RSS源（服务端模式）..." });

    try {
      // 步骤1: 尝试服务端验证
      console.log('[Auto Validation] 尝试服务端验证:', normalizedUrl);
      const serverResponse = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const serverData = await serverResponse.json();

      if (serverData.valid) {
        setValidationStatus({
          valid: true,
          message: "✓ RSS源验证成功（服务端模式）！",
        });

        // 自动填充名称
        if (!autoFetchedName && serverData.metadata?.title) {
          setName(serverData.metadata.title);
          setAutoFetchedName(true);
        }
        setIsValidating(false);
        return;
      }

      // 步骤2: 服务端验证失败，自动切换到浏览器验证
      console.log('[Auto Validation] 服务端验证失败，切换到浏览器验证...');
      setValidationStatus({ valid: false, message: "🔍 正在切换到浏览器验证模式..." });

      // 等待一小段时间让用户看到状态更新
      await new Promise(resolve => setTimeout(resolve, 500));

      setValidationStatus({ valid: false, message: "🌐 正在尝试浏览器验证（包含CORS代理）..." });

      const clientResult = await validateRSSFromClient(normalizedUrl);

      if (clientResult.valid && clientResult.metadata) {
        setValidationStatus({
          valid: true,
          message: "✓ RSS源验证成功（浏览器模式+CORS代理）！",
        });

        // 自动填充名称
        if (!autoFetchedName && clientResult.metadata.title) {
          setName(clientResult.metadata.title);
          setAutoFetchedName(true);
        }
      } else {
        // 两种验证方式都失败
        setValidationStatus({
          valid: false,
          message: `❌ 验证失败。已尝试服务端和浏览器模式（含3个CORS代理）。\n\n${clientResult.error || '请检查RSS链接是否正确。'}`,
        });
      }
    } catch (err) {
      console.error('[Auto Validation] 错误:', err);
      setValidationStatus({
        valid: false,
        message: "⚠️ 网络错误，请检查连接或稍后重试",
      });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim() || !name.trim()) {
      setValidationStatus({
        valid: false,
        message: "请填写所有必填字段",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: "rss",
          icon,
          url: url.trim(),
          enabled: true,
        }),
      });

      if (response.ok) {
        // 自动触发一次fetch，立即抓取RSS内容
        await fetch("/api/fetch", { method: "POST" });

        // 重置表单
        setUrl("");
        setName("");
        setIcon("📰");
        setValidationStatus(null);
        setAutoFetchedName(false);
        onClose();
        if (onSourceAdded) onSourceAdded();
      } else {
        const data = await response.json();
        setValidationStatus({
          valid: false,
          message: data.error || "添加失败，请稍后重试",
        });
      }
    } catch (err) {
      setValidationStatus({
        valid: false,
        message: "网络错误，请检查连接",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    // 重置表单
    setUrl("");
    setName("");
    setIcon("📰");
    setValidationStatus(null);
    setAutoFetchedName(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <span className="text-lg">📡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  添加 RSS 订阅
                </h3>
                <p className="text-xs text-gray-500">
                  订阅你感兴趣的内容源
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* RSS URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                RSS 链接 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setValidationStatus(null);
                  }}
                  placeholder="https://example.com/feed"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isValidating || isSaving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={validateUrl}
                  disabled={isValidating || !url.trim()}
                  className="whitespace-nowrap"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      验证中
                    </>
                  ) : (
                    "验证"
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                例如：36kr.com/feed 或 sspai.com/feed
              </p>

              {/* 自动验证提示 */}
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900">
                    🔍 智能验证模式
                  </p>
                  <p className="text-xs text-blue-600">
                    自动尝试服务端和浏览器验证（含3个CORS代理）
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Status */}
            {validationStatus && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  validationStatus.valid
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {validationStatus.valid ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{validationStatus.message}</span>
              </div>
            )}

            {/* 名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAutoFetchedName(false);
                }}
                placeholder="信息源名称"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-400 mt-1">
                验证成功后会自动填充
              </p>
            </div>

            {/* 图标 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                图标
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIcon(option)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-xl ${
                      icon === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={isSaving}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !url.trim() || !name.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    添加中
                  </>
                ) : (
                  "添加订阅"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
