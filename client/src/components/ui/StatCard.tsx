import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'red' | 'green' | 'orange' | 'purple' | 'blue';
  suffix?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
  blue: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
};

export function StatCard({ label, value, icon: Icon, tone = 'default', suffix }: StatCardProps) {
  return (
    <Card className="animate-fade-in p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
            {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
          </p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone])}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
