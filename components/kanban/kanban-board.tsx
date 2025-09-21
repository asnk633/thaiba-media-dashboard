"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Task } from "@/types/tasks"
import { KanbanColumn } from "./kanban-column"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateTaskDialog } from "./create-task-dialog"

const COLUMNS = [
  { id: "pending", title: "Pending", color: "bg-gray-500/10 border-gray-500/20" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500/10 border-blue-500/20" },
  { id: "completed", title: "Completed", color: "bg-green-500/10 border-green-500/20" },
  { id: "on_hold", title: "On Hold", color: "bg-yellow-500/10 border-yellow-500/20" },
]

export function KanbanBoard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      let query = supabase.from("tasks").select(`
        *,
        assigned_to_profile:user_profiles!tasks_assigned_to_fkey(full_name),
        assigned_by_profile:user_profiles!tasks_assigned_by_fkey(full_name)
      `)

      // Filter based on user role
      if (user?.role === "team_member") {
        query = query.eq("assigned_to", user.id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const handleDrop = async (columnId: string) => {
    if (draggedTask && draggedTask.status !== columnId) {
      await updateTaskStatus(draggedTask.id, columnId)
    }
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {user?.role === "admin" && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            draggedTask={draggedTask}
          />
        ))}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onTaskCreated={fetchTasks} />
    </div>
  )
}
