import { getSources, initializeDefaultSources } from './source-service';
import { initDatabase } from './db';

/**
 * Initialize the application with default data if needed.
 * This should be called when the app starts to ensure:
 * - Database tables are properly set up
 * - Default feed sources are created
 */
export async function initializeApp(): Promise<void> {
  try {
    // First, ensure database schema exists
    console.log('Initializing database schema...');
    await initDatabase();

    // Then check if sources have already been initialized
    const sources = await getSources();

    if (sources.length === 0) {
      console.log('Initializing default sources...');
      await initializeDefaultSources();
      console.log('✓ Default sources initialized');
    } else {
      console.log(`Found ${sources.length} existing sources, skipping initialization`);
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Don't throw - allow the app to start even if initialization fails
  }
}
