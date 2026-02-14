import { NextResponse } from 'next/server';
import { migrateDatabase } from '@/lib/db';

export async function POST() {
  try {
    await migrateDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await migrateDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
