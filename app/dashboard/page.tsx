export const dynamic = 'force-dynamic';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-8">Welcome to Thaiba Media Dashboard</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Active Tasks</h3>
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Tasks in progress</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-500">8</p>
                <p className="text-sm text-muted-foreground">Tasks completed this week</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Pending</h3>
                <p className="text-3xl font-bold text-yellow-500">5</p>
                <p className="text-sm text-muted-foreground">Tasks awaiting review</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
