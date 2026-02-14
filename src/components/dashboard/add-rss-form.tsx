"use client";

import { useState } from "react";
import { Plus, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedSource } from "@/types";

interface AddRssFormProps {
  existingSources?: FeedSource[];
  onAddToQueue: (url: string) => void;
}

export function AddRssForm({
  existingSources = [],
  onAddToQueue,
}: AddRssFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!url.trim()) {
      setError("请输入RSS链接");
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Check for duplicates by normalizing URLs to domain only
    const extractDomainForComparison = (urlStr: string): string => {
      try {
        let normalized = urlStr.trim().toLowerCase();
        if (!normalized.match(/^https?:\/\//i)) {
          normalized = `https://${normalized}`;
        }
        const urlObj = new URL(normalized);
        return urlObj.hostname.replace(/^www\./, '');
      } catch {
        let normalized = urlStr.trim().toLowerCase();
        normalized = normalized.replace(/^https?:\/\//, '');
        normalized = normalized.replace(/^www\./, '');
        normalized = normalized.split('/')[0];
        return normalized;
      }
    };

    const isDuplicate = existingSources.some(source => {
      if (!source.url) return false;
      return extractDomainForComparison(source.url) === extractDomainForComparison(normalizedUrl);
    });

    if (isDuplicate) {
      setError("该RSS源已存在，请勿重复添加");
      return;
    }

    // Add to queue
    onAddToQueue(normalizedUrl);

    // Reset form
    setUrl("");
    setError("");
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAdd();
    }
  }

  return (
    <div className="space-y-3">
      {/* URL Input */}
      <div className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyPress={handleKeyPress}
          placeholder="输入网址，如 ruder.io"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        {url && (
          <button
            onClick={() => {
              setUrl("");
              setError("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Button */}
      <Button
        onClick={handleAdd}
        disabled={!url.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        添加到队列
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-gray-400">
        💡 输入网站地址即可自动发现 RSS 源，可连续添加多个
      </p>
    </div>
  );
}
