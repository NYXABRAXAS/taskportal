import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const { items, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
      {items.length === 0 && <p className="py-16 text-center text-sm text-slate-400">No activity yet</p>}
      {items.map((a, i) => (
        <div key={i} className="px-5 py-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {a.user} updated <span className="text-brand-600 dark:text-brand-400">{a.apiName || 'a task'}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="capitalize">{a.field}</span>: {a.oldValue || '-'} &rarr; {a.newValue || '-'}
          </p>
          {a.remarks && <p className="mt-1 text-xs text-slate-400">Remarks: {a.remarks}</p>}
          <p className="mt-1 text-xs text-slate-400">{formatDateTime(a.timestamp)}</p>
        </div>
      ))}
    </Card>
  );
}
