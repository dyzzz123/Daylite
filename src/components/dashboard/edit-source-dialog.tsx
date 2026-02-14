"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    id: string;
    name: string;
    url?: string;
  } | null;
  onSourceUpdated: () => void;
}

export function EditSourceDialog({
  isOpen,
  onClose,
  source,
  onSourceUpdated,
}: EditSourceDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean | null;
    message: string;
  }>({ valid: null, message: "" });

  // 当 source 改变时更新表单
  useEffect(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url || "");
      setValidationStatus({ valid: null, message: "" });
    }
  }, [source]);

  if (!isOpen || !source) return null;

  async function handleUrlBlur() {
    if (!source) return;

    // 如果 URL 没有改变，不需要验证
    if (url === source.url) {
      setValidationStatus({ valid: true, message: "URL 未改变" });
      return;
    }

    if (!url.trim()) {
      setValidationStatus({ valid: false, message: "请输入RSS链接" });
      return;
    }

    // 验证新 URL
    setIsValidating(true);
    setValidationStatus({ valid: null, message: "" });

    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const response = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          autoDiscover: true,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setUrl(data.url || normalizedUrl);
        setValidationStatus({ valid: true, message: "✓ RSS源验证成功" });
      } else {
        setValidationStatus({ valid: false, message: data.error || "验证失败" });
      }
    } catch (error) {
      setValidationStatus({ valid: false, message: "验证失败，请重试" });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSave() {
    if (!source) return;

    // 如果 URL 改变了但未��证，先验证
    const urlChanged = url !== source.url;
    if (urlChanged && validationStatus.valid !== true) {
      await handleUrlBlur();
      if (validationStatus.valid === false || validationStatus.valid === null) {
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/sources/${source.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      onSourceUpdated();
      handleClose();
    } catch (error) {
      console.error("保存失败:", error);
      setValidationStatus({ valid: false, message: "保存失败，请重试" });
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (!source) return;
    setName(source.name);
    setUrl(source.url || "");
    setValidationStatus({ valid: null, message: "" });
    onClose();
  }

  const canSave = source && name.trim() && (url === source.url || validationStatus.valid === true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          编辑信息源
        </h2>

        <div className="space-y-4">
          {/* 名称输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入信息源名称"
            />
          </div>

          {/* URL输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RSS 链接
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setValidationStatus({ valid: null, message: "" });
              }}
              onBlur={handleUrlBlur}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入RSS链接"
            />
            <p className="text-xs text-gray-400 mt-1">
              修改链接后会自动验证
            </p>
          </div>

          {/* 验证状态 */}
          {validationStatus.message && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                validationStatus.valid === true
                  ? "bg-green-50 text-green-700"
                  : validationStatus.valid === false
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              ) : validationStatus.valid === true ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : validationStatus.valid === false ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : null}
              <span>{validationStatus.message}</span>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSaving || isValidating}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving || isValidating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
