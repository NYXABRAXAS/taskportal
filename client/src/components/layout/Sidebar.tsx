import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Table2,
  Users,
  BarChart3,
  UploadCloud,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Developer'] },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks, roles: ['Admin', 'Developer'] },
  { to: '/all-tasks', label: 'All Tasks', icon: Table2, roles: ['Admin'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
  { to: '/import-export', label: 'Import / Export', icon: UploadCloud, roles: ['Admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Developer'] },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
          AT
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">API Task Portal</p>
          <p className="text-[11px] text-slate-400">Sheet-powered</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems
          .filter((item) => item.roles.includes(user?.role || ''))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
