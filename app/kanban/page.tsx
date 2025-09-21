import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { KanbanBoard } from "@/components/kanban/kanban-board"

export default function KanbanPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "team_member"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Kanban Board</h1>
              <p className="text-muted-foreground">Manage tasks with drag-and-drop interface</p>
            </div>
            <KanbanBoard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
