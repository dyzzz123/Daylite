import { db, generateId, parseJSON, stringifyJSON } from './db';
import type { DailyReport, DailyReportRow } from '@/types';

// Convert database row to DailyReport
function rowToDailyReport(row: DailyReportRow): DailyReport {
  return {
    id: row.id,
    date: new Date(row.date),
    summary: row.summary,
    keyPoints: parseJSON<string[]>(row.keyPoints, []),
    createdAt: new Date(row.createdAt),
  };
}

// Get all daily reports
export async function getDailyReports(limit: number = 30): Promise<DailyReport[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM daily_reports ORDER BY date DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((row) => rowToDailyReport(row as unknown as DailyReportRow));
}

// Get daily report by date
export async function getDailyReportByDate(date: Date): Promise<DailyReport | null> {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

  const result = await db.execute({
    sql: 'SELECT * FROM daily_reports WHERE date = ?',
    args: [dateStr],
  });

  if (result.rows.length === 0) return null;

  return rowToDailyReport(result.rows[0] as unknown as DailyReportRow);
}

// Get today's daily report
export async function getTodayDailyReport(): Promise<DailyReport | null> {
  const today = new Date();
  return getDailyReportByDate(today);
}

// Create a new daily report
export async function createDailyReport(
  report: Omit<DailyReport, 'id' | 'createdAt'>
): Promise<DailyReport> {
  const id = generateId();
  const createdAt = new Date();
  const dateStr = report.date.toISOString().split('T')[0];

  // Check if report already exists for this date
  const existing = await getDailyReportByDate(report.date);
  if (existing) {
    // Update existing report instead
    await updateDailyReport(existing.id, {
      summary: report.summary,
      keyPoints: report.keyPoints,
    });
    return {
      ...existing,
      summary: report.summary,
      keyPoints: report.keyPoints,
    };
  }

  await db.execute({
    sql: `
      INSERT INTO daily_reports (id, date, summary, keyPoints, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      id,
      dateStr,
      report.summary,
      stringifyJSON(report.keyPoints),
      createdAt.toISOString(),
    ],
  });

  return {
    ...report,
    id,
    createdAt,
  };
}

// Update a daily report
export async function updateDailyReport(
  id: string,
  updates: Partial<Pick<DailyReport, 'summary' | 'keyPoints'>>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.summary !== undefined) {
    fields.push('summary = ?');
    values.push(updates.summary);
  }

  if (updates.keyPoints !== undefined) {
    fields.push('keyPoints = ?');
    values.push(stringifyJSON(updates.keyPoints));
  }

  if (fields.length === 0) return;

  values.push(id);

  await db.execute({
    sql: `UPDATE daily_reports SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });
}

// Delete a daily report
export async function deleteDailyReport(id: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM daily_reports WHERE id = ?',
    args: [id],
  });
}

// Delete old daily reports (older than specified days)
export async function deleteOldDailyReports(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const dateStr = cutoffDate.toISOString().split('T')[0];

  const result = await db.execute({
    sql: 'DELETE FROM daily_reports WHERE date < ?',
    args: [dateStr],
  });

  return result.rowsAffected;
}

// Get reports for a date range
export async function getDailyReportsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<DailyReport[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const result = await db.execute({
    sql: 'SELECT * FROM daily_reports WHERE date >= ? AND date <= ? ORDER BY date DESC',
    args: [startStr, endStr],
  });

  return result.rows.map((row) => rowToDailyReport(row as unknown as DailyReportRow));
}

// Get this week's reports
export async function getThisWeekReports(): Promise<DailyReport[]> {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return getDailyReportsByDateRange(startOfWeek, today);
}

// Get this month's reports
export async function getThisMonthReports(): Promise<DailyReport[]> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getDailyReportsByDateRange(startOfMonth, today);
}
