"use client"

import type React from "react"

import type { Task } from "@/types/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanTaskCard } from "./kanban-task-card"

interface KanbanColumnProps {
  column: {
    id: string
    title: string
    color: string
  }
  tasks: Task[]
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onDrop: (columnId: string) => void
  draggedTask: Task | null
}

export function KanbanColumn({ column, tasks, onDragStart, onDragEnd, onDrop, draggedTask }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop(column.id)
  }

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full ${column.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>{column.title}</span>
            <span className="bg-background/50 text-foreground px-2 py-1 rounded-full text-xs">{tasks.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 min-h-[500px]" onDragOver={handleDragOver} onDrop={handleDrop}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedTask?.id === task.id}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No tasks in this column</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
