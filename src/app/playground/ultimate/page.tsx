"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronRight, Sparkles, RefreshCw, Moon, Sun, Star, Heart, Bookmark, Share2, Copy, Check, Search, Filter, Grid, List, MoreVertical, ArrowUpDown, Clock, TrendingUp, AlertCircle, Info, CheckCircle2, XCircle, Zap, Target, Layers, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const mockItems = [
  {
    id: "1",
    title: "OpenAI 发布 GPT-5 模型，性能提升300%",
    summary: "OpenAI 今日正式发布 GPT-5 模型，在推理能力和多模态理解方面取得重大突破，预计将重新定义 AI 助手的体验。这个模型采用了全新的架构设计...",
    sourceName: "36氪",
    publishTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ["AI", "OpenAI", "GPT-5"],
    url: "https://36kr.com",
    image: "🤖",
    readTime: "5 min",
    author: "张三"
  },
  {
    id: "2",
    title: "如何设计一个高效的信息聚合系统",
    summary: "本文分享了从需求分析到技术实现的完整流程，包括 RSS 解析、信息过滤、智能推荐等核心模块的设计思路。",
    sourceName: "少数派",
    publishTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tags: ["产品设计", "技术", "教程"],
    url: "https://sspai.com",
    image: "📱",
    readTime: "8 min",
    author: "李四"
  },
  {
    id: "3",
    title: "React 19 新特性一览：Server Components 全面进化",
    summary: "React 19 带来了大量新特性，包括改进的 Server Components、新的 Suspense 功能、Actions 简化等。",
    sourceName: "IT之家",
    publishTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ["React", "前端开发"],
    url: "https://ithome.com",
    image: "⚛️",
    readTime: "6 min",
    author: "王五"
  }
];

type CardStyle = "classic-bordered" | "modern-shadow" | "minimal-clean" | "glass-morphism" | "neomorphism" | "brutalism" | "feeeed-highlight" | "card-gradient" | "skeleton-loading" | "magazine-style";
type HoverStyle = "elevate-up" | "scale-up" | "highlight-bg" | "border-pulse" | "subtle-fade" | "3d-rotate" | "glow-effect" | "shimmer-effect";
type LayoutStyle = "single-column" | "masonry-grid" | "bento-grid" | "timeline" | "split-view";
type AnimationStyle = "slide-fade" | "scale-fade" | "flip-in" | "bounce-in" | "rotate-in";
type ColorScheme = "default" | "warm" | "cool" | "nature" | "sunset" | "ocean" | "forest" | "purple-haze";

export default function UltimatePlaygroundPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedCardStyle, setSelectedCardStyle] = useState<CardStyle>("feeeed-highlight");
  const [selectedHover, setSelectedHover] = useState<HoverStyle>("highlight-bg");
  const [selectedLayout, setSelectedLayout] = useState<LayoutStyle>("single-column");
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationStyle>("slide-fade");
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>("default");
  const [activeTab, setActiveTab] = useState<"cards" | "interactions" | "layouts" | "animations" | "colors">("cards");
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const colorSchemes = {
    default: { bg: "from-gray-50 to-gray-100/50", card: "bg-white", accent: "blue" },
    warm: { bg: "from-orange-50 to-amber-50", card: "bg-white/80", accent: "orange" },
    cool: { bg: "from-cyan-50 to-blue-50", card: "bg-white/80", accent: "cyan" },
    nature: { bg: "from-green-50 to-emerald-50", card: "bg-white/80", accent: "green" },
    sunset: { bg: "from-rose-50 to-pink-50", card: "bg-white/80", accent: "rose" },
    ocean: { bg: "from-sky-50 to-indigo-50", card: "bg-white/80", accent: "sky" },
    forest: { bg: "from-lime-50 to-green-50", card: "bg-white/80", accent: "lime" },
    "purple-haze": { bg: "from-violet-50 to-purple-50", card: "bg-white/80", accent: "violet" }
  };

  const cardStyles = {
    "classic-bordered": {
      container: "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg",
      description: "经典边框样式"
    },
    "modern-shadow": {
      container: "border-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl",
      description: "现代阴影风格"
    },
    "minimal-clean": {
      container: "border border-gray-200 dark:border-gray-800 bg-transparent rounded-lg",
      description: "极简透明"
    },
    "glass-morphism": {
      container: "border border-white/20 bg-white/10 backdrop-blur-md rounded-xl shadow-xl",
      description: "毛玻璃效果"
    },
    "neomorphism": {
      container: "border-0 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.05)]",
      description: "新拟态风格"
    },
    "brutalism": {
      container: "border-4 border-black dark:border-white bg-yellow-300 dark:bg-gray-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      description: "野兽主义"
    },
    "feeeed-highlight": {
      container: "group relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md",
      description: "feeeed悬停高亮"
    },
    "card-gradient": {
      container: "border-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg text-white",
      description: "渐变卡片"
    },
    "skeleton-loading": {
      container: "border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden",
      description: "骨架屏加载"
    },
    "magazine-style": {
      container: "border-l-4 border-blue-500 bg-white dark:bg-gray-800 rounded-r-xl shadow-md hover:shadow-lg",
      description: "杂志风格"
    }
  };

  const animationClasses = {
    "slide-fade": "animate-in slide-in-from-bottom-4 fade-in duration-300",
    "scale-fade": "animate-in zoom-in-95 fade-in duration-300",
    "flip-in": "animate-in flip-in-x duration-500",
    "bounce-in": "animate-in bounce-in duration-500",
    "rotate-in": "animate-in spin-in-12 duration-500"
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br transition-colors duration-300",
      colorSchemes[selectedColorScheme].bg
    )}>
      {/* 顶部导航 */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300",
        theme === "light" ? "bg-white/80" : "bg-gray-900/80"
      )}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎨 Ultimate UI/UX Playground
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                探索所有可能的交互方式和视觉设计
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Tab 导航 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {([
              { id: "cards", icon: Grid, label: "卡片样式" },
              { id: "interactions", icon: Target, label: "交互方式" },
              { id: "layouts", icon: Layers, label: "布局模式" },
              { id: "animations", icon: Zap, label: "动画效果" },
              { id: "colors", icon: Palette, label: "配色方案" }
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all",
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* 卡片样式 Tab */}
        {activeTab === "cards" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>📦 卡片风格选择（10种）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(cardStyles).map(([key, { description }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCardStyle(key as CardStyle)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all hover:scale-105",
                        selectedCardStyle === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm mb-1">{description}</div>
                      <div className="text-xs text-muted-foreground">{key}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 卡片预览 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">卡片预览</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {mockItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 transition-all duration-200",
                      cardStyles[selectedCardStyle].container,
                      selectedCardStyle === "card-gradient" && "text-white"
                    )}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 font-bold mb-2 hover:underline",
                        selectedCardStyle === "card-gradient" ? "text-white" : "text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {item.title}
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                    <p className={cn(
                      "text-sm leading-relaxed mb-3 line-clamp-2",
                      selectedCardStyle === "card-gradient" ? "text-white/90" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {item.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {item.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleLike(item.id)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            likedItems.has(item.id) ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", likedItems.has(item.id) && "fill-current")} />
                        </button>
                        <button
                          onClick={() => toggleSave(item.id)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            savedItems.has(item.id) ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Bookmark className={cn("w-4 h-4", savedItems.has(item.id) && "fill-current")} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 交互方式 Tab */}
        {activeTab === "interactions" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>🎯 悬停交互效果（8种）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { id: "elevate-up", name: "上浮", desc: "向上移动+阴影" },
                    { id: "scale-up", name: "缩放", desc: "轻微放大" },
                    { id: "highlight-bg", name: "背景高亮", desc: "渐变背景" },
                    { id: "border-pulse", name: "边框脉冲", desc: "边框动画" },
                    { id: "subtle-fade", name: "微妙", desc: "最小化动效" },
                    { id: "3d-rotate", name: "3D旋转", desc: "立体旋转" },
                    { id: "glow-effect", name: "发光", desc: "光晕效果" },
                    { id: "shimmer-effect", name: "微光", desc: "光泽扫过" }
                  ] as const).map(({ id, name, desc }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedHover(id)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        selectedHover === id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">{name}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 交互演示 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">交互效果预览</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {mockItems.map((item) => {
                  const hoverClass = {
                    "elevate-up": "hover:-translate-y-2 hover:shadow-xl transition-all duration-200",
                    "scale-up": "hover:scale-105 transition-transform duration-200",
                    "highlight-bg": "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
                    "border-pulse": "hover:border-2 hover:border-primary hover:border-dashed animate-pulse",
                    "subtle-fade": "hover:opacity-80 transition-opacity duration-200",
                    "3d-rotate": "hover:rotate-y-12 hover:scale-105 transition-all duration-500 transform-gpu",
                    "glow-effect": "hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow duration-300",
                    "shimmer-effect": "relative overflow-hidden hover:shadow-lg transition-all duration-300"
                  }[selectedHover];

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer group",
                        hoverClass
                      )}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">{item.sourceName}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {item.readTime}
                          </span>
                        </div>

                        {/* 快捷操作按钮 */}
                        <div className={cn(
                          "flex gap-2 mt-4 pt-4 border-t transition-opacity duration-200",
                          selectedHover === "subtle-fade" ? "opacity-50 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <Button size="sm" variant="ghost" className="h-8 gap-1">
                            <Heart className="w-3 h-3" />
                            喜欢
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 gap-1">
                            <Bookmark className="w-3 h-3" />
                            收藏
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 gap-1">
                            <Share2 className="w-3 h-3" />
                            分享
                          </Button>
                        </div>

                        {/* Shimmer 效果 */}
                        {selectedHover === "shimmer-effect" && (
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                          bg-gradient-to-r from-transparent via-white/20 to-transparent
                                          transition-transform duration-700 ease-in-out" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 折叠交互 */}
            <Card>
              <CardHeader>
                <CardTitle>📋 折叠/展开交互</CardTitle>
              </CardHeader>
              <CardContent>
                <Card className={cn(
                  "overflow-hidden transition-all duration-300",
                  selectedCardStyle === "feeeed-highlight" && "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                )}>
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">今日 AI 汇报</h3>
                      <p className="text-xs text-muted-foreground">点击展开/收起</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      刷新
                    </Button>
                    <ChevronDown className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      summaryExpanded ? "rotate-180" : ""
                    )} />
                  </button>

                  <div className={cn(
                    "transition-all duration-300 ease-out overflow-hidden",
                    summaryExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="p-4 space-y-3">
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                        <p className="text-sm font-medium mb-2">📝 今日总结</p>
                        <p className="text-sm text-muted-foreground">
                          这里展示折叠内容的示例。折叠/展开动画流畅，图标旋转效果清晰。
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 布局模式 Tab */}
        {activeTab === "layouts" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>📐 布局模式（5种）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: "single-column", name: "单列布局", icon: List },
                    { id: "masonry-grid", name: "瀑布流网格", icon: Grid },
                    { id: "bento-grid", name: "Bento 网格", icon: Layers },
                    { id: "timeline", name: "时间线", icon: Clock },
                    { id: "split-view", name: "分屏视图", icon: ArrowUpDown }
                  ] as const).map(({ id, name, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedLayout(id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                        selectedLayout === id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 布局演示 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">布局预览</h2>

              {selectedLayout === "single-column" && (
                <div className="space-y-4">
                  {mockItems.map((item, idx) => (
                    <Card key={item.id} className={cn(animationClasses[selectedAnimation], `animation-delay-${idx * 100}`)}>
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedLayout === "masonry-grid" && (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                  {mockItems.map((item) => (
                    <Card key={item.id} className="break-inside-avoid">
                      <CardContent className="p-4">
                        <div className="text-4xl mb-2">{item.image}</div>
                        <h3 className="font-bold mb-2 text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedLayout === "bento-grid" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-6xl">{mockItems[0].image}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-2">{mockItems[0].title}</h3>
                          <p className="text-sm text-muted-foreground">{mockItems[0].summary}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-xs text-muted-foreground">今日更新</div>
                      </div>
                    </CardContent>
                  </Card>
                  {mockItems.slice(1).map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="text-2xl mb-2">{item.image}</div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedLayout === "timeline" && (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6 pl-12">
                    {mockItems.map((item, idx) => (
                      <div key={item.id} className="relative">
                        <div className="absolute left-[-2.625rem] w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Clock className="w-3 h-3" />
                              {idx + 1}小时前
                            </div>
                            <h3 className="font-bold mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLayout === "split-view" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-xl mb-2">{mockItems[0].title}</h3>
                        <p className="text-sm opacity-90">{mockItems[0].summary}</p>
                        <Button className="mt-4 bg-white text-blue-600 hover:bg-white/90">
                          阅读更多
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-4">
                    {mockItems.slice(1).map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <h3 className="font-bold mb-1 text-sm">{item.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 动画效果 Tab */}
        {activeTab === "animations" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>✨ 进入动画（5种）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: "slide-fade", name: "滑入淡出" },
                    { id: "scale-fade", name: "缩放淡出" },
                    { id: "flip-in", name: "翻转进入" },
                    { id: "bounce-in", name: "弹跳进入" },
                    { id: "rotate-in", name: "旋转进入" }
                  ].map(({ id, name }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedAnimation(id as AnimationStyle)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        selectedAnimation === id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">{name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">动画预览</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {mockItems.map((item) => (
                  <Card key={item.id} className={cn(animationClasses[selectedAnimation])}>
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 配色方案 Tab */}
        {activeTab === "colors" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>🎨 配色方案（8种）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(colorSchemes).map(([key, { bg }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedColorScheme(key as ColorScheme)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        selectedColorScheme === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn("w-full h-12 rounded mb-2 bg-gradient-to-br", bg.replace("from-gray-50 to-gray-100/50", "from-blue-400 to-purple-500"))} />
                      <div className="font-medium text-sm capitalize">{key.replace("-", " ")}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>按钮样式示例</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button>默认按钮</Button>
                    <Button variant="secondary">次要按钮</Button>
                    <Button variant="outline">边框按钮</Button>
                    <Button variant="ghost">幽灵按钮</Button>
                    <Button variant="destructive">危险按钮</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">小按钮</Button>
                    <Button size="default">默认大小</Button>
                    <Button size="lg">大按钮</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-full">圆角按钮</Button>
                    <Button className="rounded-full" variant="outline">圆角边框</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>徽章样式示例</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>默认徽章</Badge>
                    <Badge variant="secondary">次要徽章</Badge>
                    <Badge variant="outline">边框徽章</Badge>
                    <Badge variant="destructive">危险徽章</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full">圆角徽章</Badge>
                    <Badge className="rounded-full" variant="secondary">圆角次要</Badge>
                    <Badge className="rounded-full" variant="outline">圆角边框</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500">蓝色</Badge>
                    <Badge className="bg-green-500">绿色</Badge>
                    <Badge className="bg-orange-500">橙色</Badge>
                    <Badge className="bg-purple-500">紫色</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>状态指示器</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">成功状态</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">警告状态</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">错误状态</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">信息状态</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>加载状态</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-sm">旋转加载</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">圆形进度</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                      <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                      <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm">脉冲加载</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-100 dark:border-blue-900/50">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            使用说明
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-2">🎨 全面探索</p>
              <ul className="space-y-1">
                <li>• 10种卡片风格，从经典到现代</li>
                <li>• 8种悬停交互效果</li>
                <li>• 5种布局模式</li>
                <li>• 5种进入动画</li>
                <li>• 8种配色方案</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">💡 交互提示</p>
              <ul className="space-y-1">
                <li>• 所有样式实时预览</li>
                <li>• 点击卡片查看喜欢/收藏</li>
                <li>• 悬停查看快捷操作</li>
                <li>• 切换主题查看深色效果</li>
                <li>• 选择喜欢的组合告诉我</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
