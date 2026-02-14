import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import {
  getFeedItems,
  createFeedItem,
  getTodayFeedItems,
  markAllAsRead,
} from '@/lib/feed-service';
import {
  getSources,
  createSource,
  initializeDefaultSources,
} from '@/lib/source-service';
import { getTodayDailyReport, createDailyReport } from '@/lib/report-service';
import { fetchRSS } from '@/lib/fetchers/rss-fetcher';
import { fetchZhihuHot } from '@/lib/fetchers/zhihu-fetcher';
import { fetchWeiboHot } from '@/lib/fetchers/weibo-fetcher';
import { fetchXiaohongshu } from '@/lib/fetchers/xiaohongshu-fetcher';
import { fetchAllSources } from '@/lib/fetch-scheduler';

export async function GET() {
  const results: any = {
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 },
  };

  const runTest = async (name: string, fn: () => Promise<void>) => {
    results.summary.total++;
    try {
      await fn();
      results.tests.push({ name, status: '✓ PASSED' });
      results.summary.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      results.tests.push({
        name,
        status: '✗ FAILED',
        error: (error as Error).message,
      });
      results.summary.failed++;
      console.error(`✗ ${name}:`, error);
    }
  };

  try {
    // Test 1: Database initialization
    await runTest('Database initialization', async () => {
      await initDatabase();
    });

    // Test 2: Initialize default sources
    await runTest('Initialize default sources', async () => {
      await initializeDefaultSources();
    });

    // Test 3: Get sources
    await runTest('Get all sources', async () => {
      const sources = await getSources();
      if (sources.length === 0) throw new Error('No sources found');
      results.sources = sources;
    });

    // Test 4: Create a test source
    await runTest('Create test source', async () => {
      await createSource({
        name: 'Test Source',
        type: 'rss',
        icon: '🧪',
        url: 'https://example.com/feed.xml',
        enabled: true,
      });
    });

    // Test 5: RSS fetcher (with real RSS feed)
    await runTest('Fetch RSS feed (36kr)', async () => {
      const items = await fetchRSS({
        url: 'https://36kr.com/feed',
        sourceName: '36氪测试',
        icon: '📕',
      });
      if (items.length === 0) throw new Error('No items fetched');
      results.rssFetchCount = items.length;
    });

    // Test 6: Create feed items
    await runTest('Create feed items', async () => {
      const testItem = {
        source: 'rss' as const,
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
    await runTest('Get feed items', async () => {
      const items = await getFeedItems({ limit: 10 });
      if (items.length === 0) throw new Error('No feed items found');
      results.feedItemCount = items.length;
    });

    // Test 8: Get today's feed items
    await runTest('Get today feed items', async () => {
      const items = await getTodayFeedItems();
      results.todayFeedCount = items.length;
    });

    // Test 9: Mark all as read
    await runTest('Mark all as read', async () => {
      await markAllAsRead();
    });

    // Test 10: Create daily report
    await runTest('Create daily report', async () => {
      await createDailyReport({
        date: new Date(),
        summary: '今日测试报告',
        keyPoints: ['测试要点1', '测试要点2', '测试要点3'],
      });
    });

    // Test 11: Get today's daily report
    await runTest('Get today daily report', async () => {
      const report = await getTodayDailyReport();
      if (!report) throw new Error('No daily report found');
      results.dailyReport = report;
    });

    // Test 12: Fetch all sources (scheduler)
    await runTest('Fetch all sources (scheduler)', async () => {
      const result = await fetchAllSources();
      if (result.totalItems === 0) {
        throw new Error('No items fetched by scheduler');
      }
      results.schedulerResult = result;
    });

    // Test 13: Zhihu fetcher
    await runTest('Fetch Zhihu hot topics', async () => {
      const items = await fetchZhihuHot({ limit: 10 });
      if (items.length === 0) throw new Error('No Zhihu items fetched');
      results.zhihuFetchCount = items.length;
    });

    // Test 14: Weibo fetcher
    await runTest('Fetch Weibo hot search', async () => {
      const items = await fetchWeiboHot({ limit: 10 });
      if (items.length === 0) throw new Error('No Weibo items fetched');
      results.weiboFetchCount = items.length;
    });

    // Test 15: Xiaohongshu fetcher
    await runTest('Fetch Xiaohongshu content', async () => {
      const items = await fetchXiaohongshu({ limit: 10 });
      if (items.length === 0) throw new Error('No Xiaohongshu items fetched');
      results.xiaohongshuFetchCount = items.length;
    });

    return NextResponse.json({
      success: true,
      results,
      message: `测试完成: ${results.summary.passed}/${results.summary.total} 通过`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        results,
      },
      { status: 500 }
    );
  }
}
