
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, Thermometer, Wind } from "lucide-react";
import { WeatherData } from "@/lib/mock-data";

export function WeatherCard({ data }: { data: WeatherData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-gray-500" />
          天气 & 出行
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{data.temp}°</span>
            <span className="text-sm text-gray-500">{data.condition}</span>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
              <CloudRain className="w-3 h-3" />
              降雨概率 {data.rainProb}%
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
              <Wind className="w-3 h-3" />
              AQI {data.aqi}
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          💡 提示：傍晚可能有雨，建议出门带伞。
        </div>
      </CardContent>
    </Card>
  );
}
