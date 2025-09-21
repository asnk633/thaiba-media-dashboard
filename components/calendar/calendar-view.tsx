"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Task } from "@/types/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { CalendarDay } from "./calendar-day"

export function CalendarView() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, currentDate])

  const fetchTasks = async () => {
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_profile:user_profiles!tasks_assigned_to_fkey(full_name)
        `)
        .gte("due_date", monthStart.toISOString())
        .lte("due_date", monthEnd.toISOString())

      // Filter based on user role
      if (user?.role === "team_member") {
        query = query.eq("assigned_to", user.id)
      }

      const { data, error } = await query.order("due_date", { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => task.due_date && isSameDay(new Date(task.due_date), date))
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get selected date tasks
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  date={day}
                  tasks={getTasksForDate(day)}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                  onSelect={setSelectedDate}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details Sidebar */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select a date"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div key={task.id} className="p-3 border border-border rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Assigned to: {(task as any).assigned_to_profile?.full_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            task.priority === "urgent"
                              ? "bg-red-500/10 text-red-500"
                              : task.priority === "high"
                                ? "bg-orange-500/10 text-orange-500"
                                : task.priority === "medium"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-green-500/10 text-green-500"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            task.status === "completed"
                              ? "bg-green-500/10 text-green-500"
                              : task.status === "in_progress"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks due on this date.</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Click on a date to view tasks.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
