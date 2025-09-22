export const dynamic = "force-dynamic";
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { CalendarView } from "@/components/calendar/calendar-view"

export default function CalendarPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "team_member"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
              <p className="text-muted-foreground">View tasks and deadlines in calendar format</p>
            </div>
            <CalendarView />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
