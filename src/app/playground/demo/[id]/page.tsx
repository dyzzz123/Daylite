'use client';

import { useParams } from 'next/navigation';
import { getDemoById } from '@/lib/playground/demo-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Code, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function DemoDetailPage() {
  const params = useParams();
  const demoId = params.id as string;
  const demo = getDemoById(demoId);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!demo) return;
    await navigator.clipboard.writeText(demo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!demo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">演示未找到</h2>
          <p className="text-muted-foreground mb-4">该演示可能已被移除或 ID 不正确</p>
          <Link href="/playground">
            <Button>返回画廊</Button>
          </Link>
        </div>
      </div>
    );
  }

  const DemoComponent = demo.component;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link href="/playground">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回画廊
        </Button>
      </Link>

      {/* 标题区域 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{demo.meta.thumbnail}</span>
            <div>
              <h1 className="text-3xl font-bold">{demo.meta.title}</h1>
              <p className="text-muted-foreground mt-1">{demo.meta.description}</p>
            </div>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {demo.meta.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {/* TODO: 添加收藏功能 */}}
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyCode}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* 徽章 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">难度:</span>
          <Badge variant="secondary">
            {demo.meta.difficulty === 'beginner' && '初级'}
            {demo.meta.difficulty === 'intermediate' && '中级'}
            {demo.meta.difficulty === 'advanced' && '高级'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">性能:</span>
          <Badge variant="outline">
            {demo.meta.performance === 'excellent' && '⚡ 极快'}
            {demo.meta.performance === 'good' && '🚀 良好'}
            {demo.meta.performance === 'moderate' && '📊 中等'}
            {demo.meta.performance === 'heavy' && '⚠️ 较重'}
          </Badge>
        </div>

        {demo.dependencies && demo.dependencies.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">依赖:</span>
            <div className="flex gap-1">
              {demo.dependencies.map(dep => (
                <Badge key={dep} variant="outline" className="text-xs">
                  {dep}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 演示区域 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full" />
          实时演示
        </h2>
        <div className="border rounded-lg p-6 bg-card">
          <DemoComponent />
        </div>
      </div>

      {/* 代码区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="w-5 h-5" />
            源代码
          </h2>
          <Button size="sm" variant="outline" onClick={handleCopyCode}>
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? '已复制' : '复制代码'}
          </Button>
        </div>
        <div className="border rounded-lg p-6 bg-muted/50">
          <pre className="overflow-x-auto">
            <code className="text-sm">{demo.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
