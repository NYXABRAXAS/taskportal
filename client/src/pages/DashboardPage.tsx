import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Globe,
  ListTodo,
  Percent,
  Smartphone,
  Users as UsersIcon,
  UploadCloud,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPieChart } from '@/components/charts/StatusPieChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { DeveloperPerformanceChart } from '@/components/charts/DeveloperPerformanceChart';
import { MonthlyProgressChart } from '@/components/charts/MonthlyProgressChart';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/dashboard');
      return res.data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={isAdmin ? 'Total APIs' : 'My APIs'} value={data.totalApis} icon={ListTodo} tone="blue" />
        <StatCard label="Pending" value={data.pendingApis} icon={Clock} tone="red" />
        <StatCard label="Completed" value={data.completedApis} icon={CheckCircle2} tone="green" />
        <StatCard label="Deployment Pending" value={data.deploymentPending} icon={UploadCloud} tone="orange" />
        <StatCard label="Mobile Pending" value={data.mobilePending} icon={Smartphone} tone="purple" />
        <StatCard label="Web Pending" value={data.webPending} icon={Globe} tone="purple" />
        <StatCard label="Breached" value={data.breachedApis} icon={AlertTriangle} tone="red" />
        <StatCard label="Today's Due" value={data.todaysDue} icon={CalendarClock} tone="orange" />
        <StatCard label="Completion" value={data.completionPct} suffix="%" icon={Percent} tone="green" />
        {isAdmin && <StatCard label="Developers" value={data.totalDevelopers ?? 0} icon={UsersIcon} tone="blue" />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <StatusPieChart data={data.statusPie} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <MonthlyProgressChart data={data.monthlyProgress} />
          </CardContent>
        </Card>

        {isAdmin && data.byDeveloper && (
          <Card>
            <CardHeader>
              <CardTitle>Developer Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <DeveloperPerformanceChart data={data.byDeveloper} />
            </CardContent>
          </Card>
        )}

        {isAdmin && data.currentOwnerBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle>Who Currently Has the Ball</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="mb-1 text-xs text-slate-400">
                Pending APIs grouped by whoever owns the active stage right now (API Dev, Deployment, Mobile, or Web).
              </p>
              {data.currentOwnerBreakdown.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">Nothing pending right now</p>
              )}
              {data.currentOwnerBreakdown.map((o) => (
                <div
                  key={o.owner}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200">{o.owner}</span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {o.count} pending
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Phase Wise APIs</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <CategoryBarChart data={data.phaseWise} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Wise APIs</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <CategoryBarChart data={data.categoryWise} horizontal />
          </CardContent>
        </Card>

        {!isAdmin && data.recentUpdates && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentUpdates.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">No recent updates</p>
              )}
              {data.recentUpdates.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{u.apiName}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(u.lastUpdatedAt)}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
