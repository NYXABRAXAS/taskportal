import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { initials, formatDateTime } from '@/lib/utils';

export default function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const { items, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setOpen((v) => !v);
              if (!open) markAllRead();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</p>
                <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-slate-400">No recent activity</p>
                )}
                {items.slice(0, 8).map((a, i) => (
                  <div key={i} className="rounded-xl px-2 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {a.user} updated <span className="text-brand-600 dark:text-brand-400">{a.apiName || 'a task'}</span>
                    </p>
                    <p className="text-slate-400">
                      {a.field}: {a.oldValue || '-'} &rarr; {a.newValue || '-'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(a.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
        >
          {initials(user?.fullName || user?.username || 'U')}
        </Link>
      </div>
    </header>
  );
}
