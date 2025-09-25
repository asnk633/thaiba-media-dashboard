'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Building2,
  KanbanSquare,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationCenter } from '@/components/notifications/notification-center';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const getNavItems = () => {
    const baseItems = [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/institutions', icon: Building2, label: 'Institutions' },
        { href: '/kanban', icon: KanbanSquare, label: 'Kanban Board' },
        { href: '/calendar', icon: Calendar, label: 'Calendar' },
        { href: '/reports', icon: FileText, label: 'Reports' },
        { href: '/settings', icon: Settings, label: 'Settings' },
      ];
    }

    if (user.role === 'team_member') {
      return [
        { href: '/team/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
        { href: '/kanban', icon: KanbanSquare, label: 'My Tasks' },
        { href: '/calendar', icon: Calendar, label: 'Calendar' },
      ];
    }

    if (user.role === 'institution') {
      return [...baseItems, { href: '/requests', icon: FileText, label: 'My Requests' }];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">Thaiba Media</h2>
          <NotificationCenter />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{user.full_name}</p>
        <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
