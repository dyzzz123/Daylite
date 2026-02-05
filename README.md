# 个人每日仪表盘 (Personal Daily Dashboard)

一个高效的个人每日信息聚合仪表盘，使用 Next.js 16、React 19、SQLite 和 AI 构建。

## 功能特性

- 🔍 **多源信息聚合** - 支持 RSS、知乎热榜、微博热搜等多个信息源
- 🤖 **AI 智能汇总** - 每日自动生成信息摘要和关键要点
- 🎯 **信息源管理** - 灵活启用/禁用/添加信息源
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **实时更新** - 手动触发信息抓取，保持数据新鲜

## 技术栈

- **框架**: Next.js 16.1.6 (App Router + Turbopack)
- **UI**: React 19.2.3 + TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui
- **数据库**: SQLite (通过 @libsql/client)
- **部署**: 支持 Vercel 一键部署

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/daily-dashboard.git
cd daily-dashboard

# 安装依赖
npm install

# 复制环境变量文件
cp .env.local.example .env.local
```

### 配置

编辑 `.env.local` 文件：

```env
# 数据库配置 (本地开发使用 SQLite 文件)
DATABASE_URL=file:local.db

# 或者使用 Turso 云数据库
# DATABASE_URL=libsql://your-database.turso.io
# DATABASE_AUTH_TOKEN=your-auth-token

# AI 配置 (可选，用于生成真实摘要)
# OPENAI_API_KEY=your-openai-api-key
```

### 运行

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 路由
│   │   ├── feeds/      # 信息流 API
│   │   ├── sources/    # 信息源管理 API
│   │   ├── summary/    # AI 汇总 API
│   │   └── init/       # 初始化 API
│   ├── page.tsx        # 主页面
│   └── layout.tsx      # 根布局
├── components/         # React 组件
│   ├── dashboard/      # 仪表盘组件
│   │   ├── feed-card.tsx
│   │   └── source-manager.tsx
│   └── ui/             # shadcn/ui 组件
├── lib/                # 工具库
│   ├── db.ts           # 数据库配置
│   ├── feed-service.ts # 信息流服务
│   ├── source-service.ts # 信息源服务
│   └── init.ts         # 初始化
└── types/              # TypeScript 类型定义
```

## 默认信息源

应用首次启动时会自动创建以下默认信息源：

- 📕 36氪 (RSS)
- 📘 少数派 (RSS)
- 🔥 知乎热榜
- 📰 微博热搜

你可以在应用中添加、启用或禁用这些信息源。

## 添加自定义信息源

目前支持的信息源类型：

- **RSS**: 标准 RSS/Atom 订阅源
- **zhihu**: 知乎热榜
- **weibo**: 微博热搜
- **xiaohongshu**: 小红书

## 开发计划

- [ ] 支持更多信息源类型
- [ ] 定时自动抓取
- [ ] 用户认证系统
- [ ] 数据导出功能
- [ ] 移动端 App

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
