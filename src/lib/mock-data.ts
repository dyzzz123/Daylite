// Mock data for UI components (Calendar, Todo, Weather)

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface TodoItem {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export interface WeatherData {
  temp: number;
  condition: string;
  rainProb: number;
  aqi: number;
}

// Mock data for development/fallback
// Note: FeedSource and FeedItem are now defined in @/types

export const MOCK_DATA = {
  date: new Date().toISOString(),
  user: {
    name: 'Lenny',
  },
};
