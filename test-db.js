// 独立测试脚本 - 测试数据层功能
import { initDatabase } from './src/lib/db.js';
import {
  getFeedItems,
  createFeedItem,
  getTodayFeedItems,
  markAllAsRead,
} from './src/lib/feed-service.js';
import {
  getSources,
  createSource,
  initializeDefaultSources,
} from './src/lib/source-service.js';
import { getTodayDailyReport, createDailyReport } from './src/lib/report-service.js';
import { fetchRSS } from './src/lib/fetchers/rss-fetcher.js';
import { fetchAllSources } from './src/lib/fetch-scheduler.js';

async function runTests() {
  console.log('🧪 开始数据层测试...\n');

  const tests = [];
  let passed = 0;
  let failed = 0;

  const runTest = async (name, fn) => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${name}:`, error.message);
      failed++;
    }
  };

  // Test 1: Database initialization
  await runTest('数据库初始化', async () => {
    await initDatabase();
  });

  // Test 2: Initialize default sources
  await runTest('初始化默认信息源', async () => {
    await initializeDefaultSources();
  });

  // Test 3: Get sources
  await runTest('获取所有信息源', async () => {
    const sources = await getSources();
    if (sources.length === 0) throw new Error('没有找到信息源');
    console.log(`  找到 ${sources.length} 个信息源`);
  });

  // Test 4: Create a test source
  await runTest('创建测试信息源', async () => {
    await createSource({
      name: '测试源',
      type: 'rss',
      icon: '🧪',
      url: 'https://example.com/feed.xml',
      enabled: true,
    });
  });

  // Test 5: RSS fetcher (with real RSS feed)
  await runTest('抓取RSS订阅源 (36kr)', async () => {
    console.log('  正在抓取 36kr RSS...');
    const items = await fetchRSS({
      url: 'https://36kr.com/feed',
      sourceName: '36氪测试',
      icon: '📕',
    });
    if (items.length === 0) throw new Error('没有抓取到任何内容');
    console.log(`  成功抓取 ${items.length} 条信息`);
  });

  // Test 6: Create feed items
  await runTest('创建测试信息条目', async () => {
    const testItem = {
      source: 'rss',
      sourceName: '测试源',
      title: '测试文章标题',
      summary: '这是一篇测试文章的摘要内容，用于测试数据库存储功能。',
      url: 'https://example.com/test',
      publishTime: new Date(),
      read: false,
      tags: ['测试', '示例'],
    };
    await createFeedItem(testItem);
  });

  // Test 7: Get feed items
  await runTest('获取信息流', async () => {
    const items = await getFeedItems({ limit: 10 });
    if (items.length === 0) throw new Error('没有找到信息条目');
    console.log(`  找到 ${items.length} 条信息`);
  });

  // Test 8: Get today's feed items
  await runTest('获取今日信息', async () => {
    const items = await getTodayFeedItems();
    console.log(`  今日信息数: ${items.length}`);
  });

  // Test 9: Mark all as read
  await runTest('标记所有为已读', async () => {
    await markAllAsRead();
  });

  // Test 10: Create daily report
  await runTest('创建每日汇报', async () => {
    await createDailyReport({
      date: new Date(),
      summary: '今日测试报告',
      keyPoints: ['测试要点1', '测试要点2', '测试要点3'],
    });
  });

  // Test 11: Get today's daily report
  await runTest('获取今日汇报', async () => {
    const report = await getTodayDailyReport();
    if (!report) throw new Error('没有找到今日汇报');
    console.log(`  汇报: ${report.summary}`);
  });

  // Test 12: Fetch all sources (scheduler)
  await runTest('抓取所有信息源 (调度器)', async () => {
    console.log('  正在运行调度器...');
    const result = await fetchAllSources();
    if (result.totalItems === 0) {
      throw new Error('调度器没有抓取到任何内容');
    }
    console.log(`  调度器结果: ${result.success} 成功, ${result.failed} 失败, ${result.totalItems} 条信息`);
  });

  console.log(`\n📊 测试完成: ${passed}/${passed + failed} 通过`);
  if (failed > 0) {
    console.log(`❌ ${failed} 个测试失败`);
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过!');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
