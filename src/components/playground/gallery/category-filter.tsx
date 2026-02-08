'use client';

import { CATEGORIES } from '@/lib/playground/demo-categories';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * 类别筛选组件
 */
export function CategoryFilter({ currentCategory }: { currentCategory: string }) {
  const searchParams = useSearchParams();

  const createUrl = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    return `/playground?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link href={createUrl('all')}>
        <button
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            currentCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          全部
        </button>
      </Link>

      {CATEGORIES.map(category => (
        <Link key={category.id} href={createUrl(category.id)}>
          <button
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              currentCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {category.emoji} {category.name}
          </button>
        </Link>
      ))}
    </div>
  );
}
