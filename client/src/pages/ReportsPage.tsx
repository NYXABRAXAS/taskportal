import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useTasks } from '@/hooks/useTasks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { DeveloperReportRow, Task } from '@/lib/types';

async function downloadReport(format: 'excel' | 'pdf') {
  const res = await api.get(`/reports/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `developer-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  a.click();
  URL.revokeObjectURL(url);
}

type DrillType = 'total' | 'pending' | 'completed';

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get<{ report: DeveloperReportRow[] }>('/reports');
      return res.data.report;
    },
  });
  const { data: taskData } = useTasks();

  const [drillDown, setDrillDown] = useState<{ developer: string; type: DrillType } | null>(null);

  const tasksByDeveloper = useMemo(() => {
    if (!drillDown || !taskData) return [];
    const devLower = drillDown.developer.trim().toLowerCase();
    const devTasks = taskData.tasks.filter((t) => (t.developer || '').trim().toLowerCase() === devLower);
    if (drillDown.type === 'pending') return devTasks.filter((t) => t.apiStatus !== 'Completed');
    if (drillDown.type === 'completed') return devTasks.filter((t) => t.apiStatus === 'Completed');
    return devTasks;
  }, [drillDown, taskData]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const drillTitle =
    drillDown &&
    `${drillDown.developer} — ${drillDown.type === 'total' ? 'All APIs' : drillDown.type === 'pending' ? 'Pending APIs' : 'Completed APIs'}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadReport('excel')}>
          <Download size={14} /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')}>
          <Download size={14} /> PDF
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Breached</th>
              <th className="px-4 py-3">Deployment %</th>
              <th className="px-4 py-3">Mobile %</th>
              <th className="px-4 py-3">Web %</th>
              <th className="px-4 py-3">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.developer} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{r.developer}</td>
                <td className="px-4 py-3">
                  <button
                    className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                    onClick={() => setDrillDown({ developer: r.developer, type: 'total' })}
                    disabled={r.total === 0}
                  >
                    {r.total}
                  </button>
                </td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">
                  <button
                    className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                    onClick={() => setDrillDown({ developer: r.developer, type: 'pending' })}
                    disabled={r.pending === 0}
                  >
                    {r.pending}
                  </button>
                </td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                  <button
                    className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                    onClick={() => setDrillDown({ developer: r.developer, type: 'completed' })}
                    disabled={r.completed === 0}
                  >
                    {r.completed}
                  </button>
                </td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{r.breached}</td>
                <td className="px-4 py-3">{r.deploymentProgressPct}%</td>
                <td className="px-4 py-3">{r.mobileProgressPct}%</td>
                <td className="px-4 py-3">{r.webProgressPct}%</td>
                <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{r.completionPct}%</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-slate-400">
                  No developers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={!!drillDown} onClose={() => setDrillDown(null)} title={drillTitle || ''} widthClass="max-w-2xl">
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {tasksByDeveloper.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No APIs found</p>}
          {tasksByDeveloper.map((t: Task) => (
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
