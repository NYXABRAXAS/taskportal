import { Doughnut } from 'react-chartjs-2';
import { STATUS_CHART_COLORS } from '@/lib/chartPalette';

export function StatusPieChart({ data }: { data: Record<string, number> }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  if (labels.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((l) => STATUS_CHART_COLORS[l] || '#94a3b8'),
            borderWidth: 0,
          },
        ],
      }}
      options={{
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } },
        },
        cutout: '65%',
        maintainAspectRatio: false,
      }}
    />
  );
}
