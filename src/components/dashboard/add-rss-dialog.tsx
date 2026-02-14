"use client";

import { useState, useRef } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddRssDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: () => void;
}

export function AddRssDialog({ isOpen, onClose, onSourceAdded }: AddRssDialogProps) {
  const [url, setUrl] = useState("");
  const [progressStatus, setProgressStatus] = useState<{
    type: 'idle' | 'discovering' | 'validating' | 'adding' | 'fetching' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleAdd() {
    if (!url.trim()) {
      setProgressStatus({
        type: 'error',
        message: "请输入RSS链接"
      });
      return;
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    // 规范化URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
      setUrl(normalizedUrl);
    }

    try {
      // 步骤 1: 智能发现和验证
      setProgressStatus({
        type: 'discovering',
        message: '🔍 正在智能发现RSS源...'
      });

      const validateResponse = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          autoDiscover: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!validateResponse.ok) {
        throw new Error('验证请求失败');
      }

      const validateData = await validateResponse.json();

      if (!validateData.valid) {
        setProgressStatus({
          type: 'error',
          message: validateData.error || '验证失败'
        });
        return;
      }

      // 使用找到的 URL
      const finalUrl = validateData.url || normalizedUrl;
      const sourceName = validateData.metadata?.title || 'RSS 源';

      // 步骤 2: 添加到数据库
      setProgressStatus({
        type: 'adding',
        message: `📝 正在添加 "${sourceName}"...`
      });

      const addResponse = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sourceName,
          type: "rss",
          icon: "📰",
          url: finalUrl,
          enabled: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.error || '添加失败');
      }

      // 步骤 3: 立即抓取内容
      setProgressStatus({
        type: 'fetching',
        message: '📡 正在抓取最新内容...'
      });

      await fetch("/api/fetch", {
        method: "POST",
        signal: abortControllerRef.current.signal,
      });

      // 成功！
      setProgressStatus({
        type: 'success',
        message: `✅ 成功添加 "${sourceName}"！`
      });

      // 延迟关闭，让用户看到成功消息
      setTimeout(() => {
        handleClose();
        onSourceAdded();
      }, 1500);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setProgressStatus({
          type: 'idle',
          message: ''
        });
      } else {
        console.error('[Add RSS] 错误:', err);
        setProgressStatus({
          type: 'error',
          message: err.message || '操作失败，请稍后重试'
        });
      }
    }
  }

  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProgressStatus({
      type: 'idle',
      message: ''
    });
  }

  function handleClose() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUrl("");
    setProgressStatus({ type: 'idle', message: '' });
    onClose();
  }

  const isProcessing = ['discovering', 'validating', 'adding', 'fetching'].includes(progressStatus.type);

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
                  输入网址，一键添加
                </p>
              </div>
            </div>
            {!isProcessing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSS 链接或网站地址
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setProgressStatus({ type: 'idle', message: '' });
                }}
                placeholder="例如：ruder.io 或 36kr.com/feed"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 输入网站地址即可，系统会自动发现 RSS 源
              </p>
            </div>

            {/* Progress Status */}
            {progressStatus.type !== 'idle' && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  progressStatus.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : progressStatus.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {progressStatus.type === 'success' ? (
                  <Check className="w-5 h-5 flex-shrink-0" />
                ) : progressStatus.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                )}
                <span className="text-sm font-medium">{progressStatus.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {isProcessing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  取消
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!url.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    添加订阅
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
