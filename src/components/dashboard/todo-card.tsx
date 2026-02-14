import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Check } from "lucide-react";
import { TodoItem } from "@/lib/mock-data";

export function TodoCard({ todos }: { todos: TodoItem[] }) {
  const completedCount = todos.filter(t => t.status === "completed").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gray-500" />
            待办事项
          </CardTitle>
          <div className="text-xs text-gray-500">
            {completedCount}/{todos.length} 已完成
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 p-2 rounded-md group transition-colors ${
              todo.status === 'completed'
                ? 'bg-gray-100/50 opacity-70'
                : 'hover:bg-gray-50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                todo.status === 'completed'
                  ? 'bg-green-500'
                  : todo.priority === 'high'
                    ? 'bg-red-500'
                    : todo.priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
              }`}
            >
              {todo.status === 'completed' ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <Circle className="w-3 h-3 text-white" />
              )}
            </div>
            <span className={`text-sm flex-1 transition-colors ${
              todo.status === 'completed' ? 'text-gray-400 line-through' : ''
            }`}>
              {todo.title}
            </span>
            {todo.priority === 'high' && todo.status !== 'completed' && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">
                紧急
              </Badge>
            )}
            {todo.priority === 'medium' && todo.status !== 'completed' && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                中等
              </Badge>
            )}
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            今日暂无待办
          </div>
        )}
      </CardContent>
    </Card>
  );
}
