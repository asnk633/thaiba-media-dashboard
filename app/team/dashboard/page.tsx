import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TeamDashboard } from "@/components/team/team-dashboard"

export default function TeamDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["team_member"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <TeamDashboard />
        </main>
      </div>
    </ProtectedRoute>
  )
}
