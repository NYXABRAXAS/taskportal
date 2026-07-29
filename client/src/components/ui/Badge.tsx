import { STATUS_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_COLORS[status] || STATUS_COLORS.Pending
      )}
    >
      {status || 'Pending'}
    </span>
  );
}

export function BreachBadge({ days }: { days: number }) {
  if (!days || days <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap">
      Breached by {days} {days === 1 ? 'Day' : 'Days'}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300', className)}>
      {children}
    </span>
  );
}
