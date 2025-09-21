"use client"

import type { Task } from "@/types/tasks"
import { format, isToday } from "date-fns"

interface CalendarDayProps {
  date: Date
  tasks: Task[]
  isCurrentMonth: boolean
  isSelected: boolean
  onSelect: (date: Date) => void
}

export function CalendarDay({ date, tasks, isCurrentMonth, isSelected, onSelect }: CalendarDayProps) {
  const urgentTasks = tasks.filter((task) => task.priority === "urgent").length
  const highTasks = tasks.filter((task) => task.priority === "high").length
  const overdueTasks = tasks.filter(
    (task) => new Date(task.due_date!) < new Date() && task.status !== "completed",
  ).length

  return (
    <div
      className={`
        min-h-[80px] p-2 border border-border cursor-pointer transition-colors
        ${isCurrentMonth ? "bg-background" : "bg-muted/30"}
        ${isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent"}
        ${isToday(date) ? "ring-2 ring-primary/50" : ""}
      `}
      onClick={() => onSelect(date)}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm ${
            isCurrentMonth ? "text-foreground" : "text-muted-foreground"
          } ${isToday(date) ? "font-bold" : ""}`}
        >
          {format(date, "d")}
        </span>
        {tasks.length > 0 && <span className="text-xs bg-primary/20 text-primary px-1 rounded">{tasks.length}</span>}
      </div>

      {/* Task indicators */}
      <div className="space-y-1">
        {overdueTasks > 0 && <div className="w-full h-1 bg-red-500 rounded"></div>}
        {urgentTasks > 0 && <div className="w-full h-1 bg-red-400 rounded"></div>}
        {highTasks > 0 && <div className="w-full h-1 bg-orange-400 rounded"></div>}
        {tasks.length > urgentTasks + highTasks + overdueTasks && (
          <div className="w-full h-1 bg-blue-400 rounded"></div>
        )}
      </div>
    </div>
  )
}
