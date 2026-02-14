'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { getDemoById } from '@/lib/playground/demo-data';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
}

/**
 * 收藏抽屉组件
 * 购物车风格的收藏列表
 */
export function FavoritesDrawer({ isOpen, onClose, favorites }: FavoritesDrawerProps) {
  const favoriteDemos = favorites
    .map(id => getDemoById(id))
    .filter(Boolean);

  const handleExport = () => {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground-favorites.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            收藏的演示 ({favorites.length})
          </DialogTitle>
        </DialogHeader>

        {favoriteDemos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>还没有收藏任何演示</p>
            <p className="text-sm">点击卡片上的心形图标添加收藏</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {favoriteDemos.map(demo => (
              <div
                key={demo!.meta.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <span className="text-2xl">{demo!.meta.thumbnail}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{demo!.meta.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {demo!.meta.category}
                  </p>
                </div>
                <Link href={`/playground/demo/${demo!.meta.id}`}>
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    查看
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button
            onClick={handleExport}
            disabled={favoriteDemos.length === 0}
          >
            导出收藏列表
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
