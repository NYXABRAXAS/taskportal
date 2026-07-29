import { Line } from 'react-chartjs-2';
import { CATEGORICAL, STATUS_CHART_COLORS } from '@/lib/chartPalette';
import type { DashboardStats } from '@/lib/types';

export function MonthlyProgressChart({ data }: { data: DashboardStats['monthlyProgress'] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <Line
      data={{
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: 'Total APIs',
            data: data.map((d) => d.total),
            borderColor: CATEGORICAL[0],
            backgroundColor: CATEGORICAL[0],
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: 'Completed',
            data: data.map((d) => d.completed),
            borderColor: STATUS_CHART_COLORS.Completed,
            backgroundColor: STATUS_CHART_COLORS.Completed,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      }}
      options={{
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 11 } } },
          x: { ticks: { font: { size: 11 } } },
        },
        maintainAspectRatio: false,
      }}
    />
  );
}
