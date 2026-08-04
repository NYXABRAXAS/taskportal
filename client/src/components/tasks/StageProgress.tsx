import { STATUS_DOT } from '@/lib/utils';
import type { ActiveStage, StageProgressItem } from '@/lib/types';

// A task can have multiple stages active at once (Deployment/Mobile/Web run
// in parallel once API Development is done), each possibly owned by a
// different person - group by owner so "Shiv: Deployment, Mobile" reads as
// one line instead of two separate rows for the same person.
export function CurrentOwnerBadge({ activeStages, allStagesDone }: { activeStages: ActiveStage[]; allStagesDone: boolean }) {
  if (allStagesDone || activeStages.length === 0) {
    return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All stages complete</span>;
  }

  const byOwner = new Map<string, string[]>();
  activeStages.forEach((s) => {
    const owner = s.owner || 'Unassigned';
    byOwner.set(owner, [...(byOwner.get(owner) || []), s.label]);
  });

  return (
    <div className="space-y-1 text-xs">
      {[...byOwner.entries()].map(([owner, labels]) => (
        <div key={owner}>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{owner}</p>
          <p className="text-slate-400">{labels.join(', ')}</p>
        </div>
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
