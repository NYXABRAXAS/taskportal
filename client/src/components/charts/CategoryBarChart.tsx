import { Bar } from 'react-chartjs-2';
import { CATEGORICAL } from '@/lib/chartPalette';

export function CategoryBarChart({ data, horizontal = false }: { data: Record<string, number>; horizontal?: boolean }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  if (labels.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'APIs',
            data: values,
            backgroundColor: labels.map((_, i) => CATEGORICAL[i % CATEGORICAL.length]),
            borderRadius: 6,
            maxBarThickness: 32,
          },
        ],
      }}
      options={{
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed[horizontal ? 'x' : 'y']} APIs` } },
        },
        scales: {
          x: { grid: { display: !horizontal }, ticks: { font: { size: 11 } } },
          y: { grid: { display: horizontal }, ticks: { font: { size: 11 } }, beginAtZero: true },
        },
        maintainAspectRatio: false,
      }}
    />
  );
}
