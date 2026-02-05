/**
 * 独立数据库测试脚本
 * 使用方法: node test-db-standalone.js
 */

// 由于环境限制，创建一个模拟测试来验证代码结构
console.log('🧪 数据层测试 - 代码结构验证\n');

const tests = [
  {
    name: '数据库模块 (src/lib/db.ts)',
    file: 'src/lib/db.ts',
    functions: [
      'initDatabase',
      'generateId',
      'boolToInt',
      'intToBool',
      'parseJSON',
      'stringifyJSON'
    ]
  },
  {
    name: 'Feed服务 (src/lib/feed-service.ts)',
    file: 'src/lib/feed-service.ts',
    functions: [
      'getFeedItems',
      'getFeedItemsCount',
      'getFeedItemById',
      'createFeedItem',
      'createFeedItems',
      'markAsRead',
      'markAllAsRead',
      'updateAISummary',
      'searchFeedItems',
      'deleteOldFeedItems',
      'getTodayFeedItems'
    ]
  },
  {
    name: 'Source服务 (src/lib/source-service.ts)',
    file: 'src/lib/source-service.ts',
    functions: [
      'getSources',
      'getEnabledSources',
      'getSourceById',
      'getSourcesByType',
      'createSource',
      'updateSource',
      'deleteSource',
      'toggleSourceEnabled',
      'initializeDefaultSources'
    ]
  },
  {
    name: 'Report服务 (src/lib/report-service.ts)',
    file: 'src/lib/report-service.ts',
    functions: [
      'getDailyReports',
      'getDailyReportByDate',
      'getTodayDailyReport',
      'createDailyReport',
      'updateDailyReport',
      'deleteDailyReport',
      'deleteOldDailyReports',
      'getDailyReportsByDateRange',
      'getThisWeekReports',
      'getThisMonthReports'
    ]
  },
  {
    name: 'RSS抓取器 (src/lib/fetchers/rss-fetcher.ts)',
    file: 'src/lib/fetchers/rss-fetcher.ts',
    functions: [
      'fetchRSS',
      'fetchMultipleRSS',
      'validateRSSUrl',
      'getRSSMetadata'
    ]
  },
  {
    name: '抓取调度器 (src/lib/fetch-scheduler.ts)',
    file: 'src/lib/fetch-scheduler.ts',
    functions: [
      'fetchAllSources',
      'fetchSourceById',
      'fetchSourcesByType',
      'scheduledFetch'
    ]
  },
  {
    name: '类型定义 (src/types/index.ts)',
    file: 'src/types/index.ts',
    types: [
      'FeedItem',
      'FeedSource',
      'DailyReport',
      'SourceType',
      'FeedItemRow',
      'FeedSourceRow',
      'DailyReportRow',
      'GetFeedsParams',
      'SearchHistoryParams',
      'CreateSourceRequest',
      'UpdateSourceRequest',
      'AISettings',
      'Settings'
    ]
  }
];

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

console.log('📂 检查文件是否存在...\n');

for (const test of tests) {
  const filePath = path.join(process.cwd(), test.file);

  try {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      console.log(`✗ ${test.name}`);
      console.log(`  文件不存在: ${test.file}`);
      failed++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for functions
    const missingFunctions = [];
    if (test.functions) {
      for (const fn of test.functions) {
        if (!content.includes(`export async function ${fn}`) &&
            !content.includes(`export function ${fn}`) &&
            !content.includes(`export const ${fn}`)) {
          missingFunctions.push(fn);
        }
      }
    }

    // Check for types
    const missingTypes = [];
    if (test.types) {
      for (const type of test.types) {
        if (!content.includes(`export interface ${type}`) &&
            !content.includes(`export type ${type}`)) {
          missingTypes.push(type);
        }
      }
    }

    if (missingFunctions.length > 0 || missingTypes.length > 0) {
      console.log(`✗ ${test.name}`);
      if (missingFunctions.length > 0) {
        console.log(`  缺少函数: ${missingFunctions.join(', ')}`);
      }
      if (missingTypes.length > 0) {
        console.log(`  缺少类型: ${missingTypes.join(', ')}`);
      }
      failed++;
    } else {
      console.log(`✓ ${test.name}`);
      const count = (test.functions?.length || 0) + (test.types?.length || 0);
      console.log(`  包含 ${count} 个导出项`);
      passed++;
    }
  } catch (error) {
    console.log(`✗ ${test.name}`);
    console.log(`  错误: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 测试结果: ${passed}/${passed + failed} 通过\n`);

// Check for test API endpoint
console.log('🔍 检查测试API端点...\n');
const testApiPath = path.join(process.cwd(), 'src/app/api/test/route.ts');
if (fs.existsSync(testApiPath)) {
  console.log('✓ 测试API端点存在');
  console.log('  路径: src/app/api/test/route.ts');
  console.log('  URL: http://localhost:3000/api/test');
  passed++;
} else {
  console.log('✗ 测试API端点不存在');
  failed++;
}

// Check for environment configuration
console.log('\n🔍 检查环境配置...\n');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✓ 环境配置文件存在');
  console.log('  路径: .env.local');
  passed++;
} else {
  console.log('⚠ 环境配置文件不存在 (可选)');
}

console.log('\n' + '='.repeat(50));
console.log(`\n最终结果: ${passed}/${passed + failed} 项检查通过\n`);

if (failed === 0) {
  console.log('✅ 所有数据层组件已正确创建！');
  console.log('\n📋 下一步:');
  console.log('1. 启动开发服务器: npm run dev');
  console.log('2. 访问测试端点: http://localhost:3000/api/test');
  console.log('3. 查看测试结果验证功能\n');
} else {
  console.log('❌ 部分组件缺失，请检查！');
}

process.exit(failed > 0 ? 1 : 0);
