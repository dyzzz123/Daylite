"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateRSSFromClient } from "@/lib/client-rss-fetcher";

interface AddRssDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: () => void;
}

interface QueueItem {
  url: string;
  name: string;
  status: 'validating' | 'success' | 'error';
  message: string;
}

export function AddRssDialog({ isOpen, onClose, onSourceAdded }: AddRssDialogProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [autoFetchedName, setAutoFetchedName] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  // 后台验证 RSS 源
  async function validateInBackground(itemUrl: string, itemName: string): Promise<{ valid: boolean; name?: string; message: string }> {
    // 规范化URL
    let normalizedUrl = itemUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // 步骤1: 尝试服务端验证
      const serverResponse = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const serverData = await serverResponse.json();

      if (serverData.valid) {
        return {
          valid: true,
          name: serverData.metadata?.title || itemName,
          message: "✓ 验证成功",
        };
      }

      // 步骤2: 服务端验证失败，尝试浏览器验证
      const clientResult = await validateRSSFromClient(normalizedUrl);

      if (clientResult.valid && clientResult.metadata) {
        return {
          valid: true,
          name: clientResult.metadata.title || itemName,
          message: "✓ 验证成功",
        };
      } else {
        return {
          valid: false,
          message: "验证失败，请检查链接",
        };
      }
    } catch (err) {
      return {
        valid: false,
        message: "网络错误",
      };
    }
  }

  // 添加到队列并开始后台验证
  function addToQueue() {
    if (!url.trim()) {
      setValidationStatus({ valid: false, message: "请输入RSS链接" });
      return;
    }

    const normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      setUrl(`https://${normalizedUrl}`);
    }

    // 添加到队列
    const newItem: QueueItem = {
      url: url.trim(),
      name: name.trim() || url.trim(),
      status: 'validating',
      message: '正在验证...',
    };

    setQueue(prev => [...prev, newItem]);
    setShowQueue(true);

    // 清空表单
    setUrl("");
    setName("");
    setValidationStatus(null);
    setAutoFetchedName(false);

    // 后台验证
    validateInBackground(newItem.url, newItem.name).then(result => {
      setQueue(prev => prev.map(item =>
        item.url === newItem.url
          ? {
              ...item,
              status: result.valid ? 'success' : 'error',
              message: result.message,
              name: result.name || item.name
            }
          : item
      ));

      // 如果验证成功，自动保存
      if (result.valid) {
        saveSource({
          url: newItem.url,
          name: result.name || newItem.name,
        });
      }
    });
  }

  // 保存 RSS 源
  async function saveSource({ url, name }: { url: string; name: string }) {
    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: "rss",
          icon: "📰",
          url: url.trim(),
          enabled: true,
        }),
      });

      if (response.ok) {
        // 自动触发抓取
        fetch("/api/fetch", { method: "POST" });

        // 通知父组件
        if (onSourceAdded) onSourceAdded();

        // 更新队列状态
        setQueue(prev => prev.map(item =>
          item.url === url
            ? { ...item, status: 'success', message: '✓ 添加成功' }
            : item
        ));
      } else {
        const data = await response.json();
        setQueue(prev => prev.map(item =>
          item.url === url
            ? { ...item, status: 'error', message: data.error || '添加失败' }
            : item
        ));
      }
    } catch (err) {
      setQueue(prev => prev.map(item =>
        item.url === url
          ? { ...item, status: 'error', message: '网络错误' }
          : item
      ));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 如果填写了名称，使用队列模式
    if (url.trim()) {
      addToQueue();
    }
  }

  // 快速添加（不需要填写名称）
  function quickAdd() {
    if (!url.trim()) return;
    addToQueue();
  }

  // 移除队列项
  function removeQueue(index: number) {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (queue.length === 1) {
      setShowQueue(false);
    }
  }

  function handleClose() {
    // 如果有正在处理的队列，提示用户
    if (queue.some(item => item.status === 'validating')) {
      if (!confirm("有 RSS 源正在验证中，确定要关闭吗？")) {
        return;
      }
    }
    // 重置表单和队列
    setUrl("");
    setName("");
    setValidationStatus(null);
    setAutoFetchedName(false);
    setQueue([]);
    setShowQueue(false);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <span className="text-lg">📡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  添加 RSS 订阅
                </h3>
                <p className="text-xs text-gray-500">
                  后台验证，可连续添加多个
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

          {/* Queue */}
          {showQueue && queue.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  队列 ({queue.length})
                </span>
                <button
                  onClick={() => {
                    setQueue([]);
                    setShowQueue(false);
                  }}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  清空
                </button>
              </div>
              <div className="space-y-2">
                {queue.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-200"
                  >
                    {item.status === 'validating' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                    )}
                    {item.status === 'success' && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.url}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{item.message}</span>
                    {(item.status === 'success' || item.status === 'error') && (
                      <button
                        onClick={() => removeQueue(index)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 flex-shrink-0 overflow-y-auto">
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      quickAdd();
                    }
                  }}
                  placeholder="example.com/feed"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={quickAdd}
                  disabled={!url.trim()}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                例如：36kr.com/feed 或 sspai.com/feed（按回车快速添加）
              </p>
            </div>

            {/* 名称（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                名称 <span className="text-gray-400 text-xs">（可选，验证成功后自动填充）</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAutoFetchedName(false);
                }}
                placeholder="留空则自动获取"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                完成
              </Button>
              <Button
                type="submit"
                disabled={!url.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                添加到队列
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
