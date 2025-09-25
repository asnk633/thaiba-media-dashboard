'use client';

import type { Task } from '@/types/tasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanTaskCardProps {
  task: Task;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function KanbanTaskCard({ task, onDragStart, onDragEnd, isDragging }: KanbanTaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      className={`cursor-move transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2' : ''
      } ${isOverdue ? 'border-red-500/50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-foreground text-sm line-clamp-2">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(task.priority)} variant="outline">
              {task.priority}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20" variant="outline">
                Overdue
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Created {format(new Date(task.created_at), 'MMM d')}</span>
            </div>

            {(task as any).assigned_to_profile && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{(task as any).assigned_to_profile.full_name}</span>
              </div>
            )}
          </div>

          {task.notes && (
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground line-clamp-2">
              {task.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
