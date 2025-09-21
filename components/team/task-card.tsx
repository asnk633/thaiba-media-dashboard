"use client"

import { useState } from "react"
import type { Task } from "@/types/tasks"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MessageSquare, Paperclip } from "lucide-react"
import { format } from "date-fns"

interface TaskCardProps {
  task: Task
  onStatusUpdate: (taskId: string, newStatus: string) => void
}

export function TaskCard({ task, onStatusUpdate }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    await onStatusUpdate(task.id, newStatus)
    setIsUpdating(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "on_hold":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "pending":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed"

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? "border-red-500/50" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
            {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}

            <div className="flex items-center gap-2 mb-3">
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
              <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
              {isOverdue && <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Overdue</Badge>}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Created {format(new Date(task.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="ml-4">
            <Select value={task.status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {task.notes && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                <span>{task.attachments.length} attachment(s)</span>
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
