
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { CalendarEvent } from "@/lib/mock-data";

export function CalendarCard({ events }: { events: CalendarEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          今日日程
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{event.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>
            </div>
            {event.priority === 'high' && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                重要
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
