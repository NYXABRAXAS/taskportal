import { Bar } from 'react-chartjs-2';
import { STATUS_CHART_COLORS } from '@/lib/chartPalette';
import type { DashboardStats } from '@/lib/types';

export function DeveloperPerformanceChart({ data }: { data: NonNullable<DashboardStats['byDeveloper']> }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No developers yet</p>;
  }

  return (
    <Bar
      data={{
        labels: data.map((d) => d.developer),
        datasets: [
          {
            label: 'Pending',
            data: data.map((d) => d.pending),
            backgroundColor: STATUS_CHART_COLORS.Pending,
            borderRadius: 6,
            maxBarThickness: 24,
          },
          {
            label: 'Completed',
            data: data.map((d) => d.completed),
            backgroundColor: STATUS_CHART_COLORS.Completed,
            borderRadius: 6,
            maxBarThickness: 24,
          },
        ],
      }}
      options={{
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } },
        },
        scales: {
          x: { stacked: false, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        },
        maintainAspectRatio: false,
      }}
    />
  );
}
