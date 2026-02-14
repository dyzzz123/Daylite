"use client";

import { useEffect, useRef } from "react";
import { Loader2, Check, AlertCircle, X } from "lucide-react";

export interface AddTask {
  id: string;
  url: string;
  status: 'pending' | 'discovering' | 'adding' | 'fetching' | 'success' | 'error';
  message: string;
  sourceName?: string;
  error?: string;
}

interface RssQueueManagerProps {
  queue: AddTask[];
  setQueue: React.Dispatch<React.SetStateAction<AddTask[]>>;
  onTaskComplete: (task: AddTask) => void;
}

export function RssQueueManager({ queue, setQueue, onTaskComplete }: RssQueueManagerProps) {
  const processingRef = useRef(false);

  useEffect(() => {
    // 如果有待处理的任务且当前没有在处理，开始处理
    if (queue.length > 0 && !processingRef.current) {
      const pendingTask = queue.find(t => t.status === 'pending');
      if (pendingTask) {
        processTask(pendingTask);
      }
    }
  }, [queue]);

  async function processTask(task: AddTask) {
    processingRef.current = true;

    try {
      // Step 1: 发现RSS
      setQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'discovering', message: '🔍 正在发现RSS源...' } : t
      ));

      const validateResponse = await fetch("/api/sources/validate-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: task.url,
          autoDiscover: true,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateData.valid) {
        throw new Error(validateData.error || '验证失败');
      }

      const finalUrl = validateData.url || task.url;
      const sourceName = validateData.metadata?.title || 'RSS 源';

      // Step 2: 添加到数据库
      setQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'adding', message: `📝 正在添加 "${sourceName}"...`, sourceName } : t
      ));

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
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.error || '添加失败');
      }

      // Step 3: 抓取内容
      setQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'fetching', message: '📡 正在抓取内容...' } : t
      ));

      await fetch("/api/fetch", {
        method: "POST",
      });

      // 成功
      setQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'success', message: `✅ 成功添加！` } : t
      ));

      onTaskComplete(task);

      // 3秒后从队列中移除成功的任务
      setTimeout(() => {
        setQueue(prev => prev.filter(t => t.id !== task.id));
      }, 3000);

    } catch (error: any) {
      console.error('[RSS Queue] 处理失败:', error);
      setQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'error', message: error.message || '添加失败', error: error.message } : t
      ));
    } finally {
      processingRef.current = false;
    }
  }

  function removeTask(taskId: string) {
    setQueue(prev => prev.filter(t => t.id !== taskId));
  }

  if (queue.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-600">添加队列 ({queue.length})</h4>

      <div className="space-y-2">
        {queue.map(task => (
          <div
            key={task.id}
            className={`p-3 rounded-lg border text-sm ${
              task.status === 'success'
                ? 'bg-green-50 border-green-200'
                : task.status === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {/* 图标 */}
              {task.status === 'success' ? (
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : task.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              )}

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {task.sourceName || task.url}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{task.message}</p>
              </div>

              {/* 关闭按钮 */}
              {(task.status === 'success' || task.status === 'error') && (
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 进度条（处理中） */}
            {['discovering', 'adding', 'fetching'].includes(task.status) && (
              <div className="mt-2 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
