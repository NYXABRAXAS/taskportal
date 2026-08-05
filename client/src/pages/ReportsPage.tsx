import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useTasks } from '@/hooks/useTasks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, matchesUser } from '@/lib/utils';
import { STAGE_OWNER_KEY } from '@/lib/taskFields';
import type { DeveloperReportRow, StageKey, Task } from '@/lib/types';

async function downloadReport(format: 'excel' | 'pdf') {
  const res = await api.get(`/reports/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `developer-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  a.click();
  URL.revokeObjectURL(url);
}

const STAGE_STATUS_KEY: Record<StageKey, keyof Task> = {
  api: 'apiStatus',
  deployment: 'deploymentStatus',
  mobile: 'mobileStatus',
  web: 'webStatus',
};

type DrillType = 'total' | 'pending' | 'completed' | StageKey;

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get<{ report: DeveloperReportRow[] }>('/reports');
      return res.data.report;
    },
  });
  const { data: taskData } = useTasks();

  const [developerFilter, setDeveloperFilter] = useState('');
  const [drillDown, setDrillDown] = useState<{ developer: string; type: DrillType } | null>(null);

  const visibleRows = useMemo(() => {
    if (!data) return [];
    if (!developerFilter) return data;
    return data.filter((r) => r.developer === developerFilter);
  }, [data, developerFilter]);

  const drillTasks = useMemo(() => {
    if (!drillDown || !taskData) return [];
    const identity = { fullName: drillDown.developer, username: drillDown.developer };

    if (drillDown.type === 'total' || drillDown.type === 'pending' || drillDown.type === 'completed') {
      const involved = taskData.tasks.filter((t) =>
        (['api', 'deployment', 'mobile', 'web'] as StageKey[]).some((s) => matchesUser(t[STAGE_OWNER_KEY[s]] as string, identity))
      );
      if (drillDown.type === 'total') return involved;
      return involved.filter((t) => {
        const owned = (['api', 'deployment', 'mobile', 'web'] as StageKey[]).filter((s) =>
          matchesUser(t[STAGE_OWNER_KEY[s]] as string, identity)
        );
        const fullyDone = owned.length > 0 && owned.every((s) => t[STAGE_STATUS_KEY[s]] === 'Completed');
        return drillDown.type === 'completed' ? fullyDone : !fullyDone;
      });
    }

    // Stage-specific pending drill-down (apiDevPending / deploymentPending / etc.)
    const stage = drillDown.type;
    return taskData.tasks.filter(
      (t) => matchesUser(t[STAGE_OWNER_KEY[stage]] as string, identity) && t[STAGE_STATUS_KEY[stage]] !== 'Completed'
    );
  }, [drillDown, taskData]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const drillTitleMap: Record<DrillType, string> = {
    total: 'All APIs',
    pending: 'Pending APIs',
    completed: 'Completed APIs',
    api: 'API Development Pending',
    deployment: 'Deployment Pending',
    mobile: 'Mobile Integration Pending',
    web: 'Web Integration Pending',
  };
  const drillTitle = drillDown && `${drillDown.developer} — ${drillTitleMap[drillDown.type]}`;

  function Cell({ value, developer, type }: { value: number; developer: string; type: DrillType }) {
    return (
      <button
        className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
        onClick={() => setDrillDown({ developer, type })}
        disabled={value === 0}
      >
        {value}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={developerFilter} onChange={(e) => setDeveloperFilter(e.target.value)} className="max-w-[220px]">
          <option value="">All Developers</option>
          {data.map((r) => (
            <option key={r.developer} value={r.developer}>
              {r.developer}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReport('excel')}>
            <Download size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')}>
            <Download size={14} /> PDF
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Breached</th>
              <th className="px-4 py-3">API Dev Pending</th>
              <th className="px-4 py-3">Deploy Pending</th>
              <th className="px-4 py-3">Mobile Pending</th>
              <th className="px-4 py-3">Web Pending</th>
              <th className="px-4 py-3">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.developer} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{r.developer}</td>
                <td className="px-4 py-3">
                  <Cell value={r.total} developer={r.developer} type="total" />
                </td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">
                  <Cell value={r.pending} developer={r.developer} type="pending" />
                </td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                  <Cell value={r.completed} developer={r.developer} type="completed" />
                </td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{r.breached}</td>
                <td className="px-4 py-3">
                  <Cell value={r.apiDevPending} developer={r.developer} type="api" />
                </td>
                <td className="px-4 py-3">
                  <Cell value={r.deploymentPending} developer={r.developer} type="deployment" />
                </td>
                <td className="px-4 py-3">
                  <Cell value={r.mobilePending} developer={r.developer} type="mobile" />
                </td>
                <td className="px-4 py-3">
                  <Cell value={r.webPending} developer={r.developer} type="web" />
                </td>
                <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{r.completionPct}%</td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                  No developers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={!!drillDown} onClose={() => setDrillDown(null)} title={drillTitle || ''} widthClass="max-w-2xl">
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {drillTasks.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No APIs found</p>}
          {drillTasks.map((t) => (
            <div
              key={t.rowNumber}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.apiName}</p>
                <p className="text-xs text-slate-400">
                  {t.category} &middot; {t.phase} &middot; Due {formatDate(t.apiDate)}
                </p>
              </div>
              <StatusBadge status={t.apiStatus} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
