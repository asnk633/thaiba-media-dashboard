export const dynamic = 'force-dynamic';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { UsersTable } from '@/components/admin/users-table';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
                <p className="text-muted-foreground">Manage team members and their roles</p>
              </div>
            </div>
            <UsersTable />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
