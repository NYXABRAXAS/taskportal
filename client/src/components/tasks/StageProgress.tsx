import { Fragment } from 'react';
import { STATUS_DOT } from '@/lib/utils';
import type { StageProgressItem, Task } from '@/lib/types';

// Fixed 2-column x 3-row grid (Deployment / Mobile / Web, each label + owner)
// - always exactly 3 rows regardless of how many stages are assigned, so
// every row in the table has identical height. Shows the raw assignee field
// directly rather than only "active" stages, so an owner set ahead of time
// (before their stage opens up) still shows instead of reading "Unassigned".
export function CurrentOwnerBadge({ task }: { task: Task }) {
  const rows: { label: string; owner: string }[] = [
    { label: 'Deployment', owner: task.deployment },
    { label: 'Mobile Integration', owner: task.mobileIntegration },
    { label: 'Web Integration', owner: task.webIntegration },
  ];

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 text-[11px] leading-4">
      {rows.map((r) => (
        <Fragment key={r.label}>
          <span className="text-slate-400">{r.label}</span>
          <span className="truncate font-medium text-slate-700 dark:text-slate-200" title={r.owner || undefined}>
            {r.owner || '-'}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export function StageProgressDots({ progress }: { progress: StageProgressItem[] }) {
  return (
    <div className="flex items-center gap-1" title={progress.map((p) => `${p.label}: ${p.status}${p.owner ? ` (${p.owner})` : ''}`).join(' → ')}>
      {progress.map((p) => (
        <span
          key={p.key}
          className={`h-2 w-4 rounded-full ${STATUS_DOT[p.status] || 'bg-slate-300 dark:bg-slate-700'}`}
        />
      ))}
    </div>
  );
}
