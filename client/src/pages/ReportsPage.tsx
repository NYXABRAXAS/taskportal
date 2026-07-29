import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { DeveloperReportRow } from '@/lib/types';

async function downloadReport(format: 'excel' | 'pdf') {
  const res = await api.get(`/reports/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `developer-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get<{ report: DeveloperReportRow[] }>('/reports');
      return res.data.report;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

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
                <td className="px-4 py-3">{r.total}</td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{r.pending}</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{r.completed}</td>
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
    </div>
  );
}
