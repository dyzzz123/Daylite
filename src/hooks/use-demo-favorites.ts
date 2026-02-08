'use client';

import { useState, useEffect } from 'react';

/**
 * 演示收藏管理 Hook
 */
export function useDemoFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // 从 localStorage 加载收藏
  useEffect(() => {
    // 确保只在客户端运行
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem('demo-favorites');
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 切换收藏状态
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // 保存到 localStorage (仅客户端)
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo-favorites', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  // 检查是否已收藏
  const isFavorite = (id: string) => favorites.has(id);

  // 清空所有收藏
  const clearFavorites = () => {
    setFavorites(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo-favorites');
    }
  };

  // 导出收藏列表
  const exportFavorites = () => {
    return JSON.stringify(Array.from(favorites), null, 2);
  };

  return {
    favorites,
    isLoaded,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    exportFavorites,
    count: favorites.size,
  };
}
