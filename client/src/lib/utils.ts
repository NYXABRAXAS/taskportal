import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  'In Progress': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Blocked: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  'On Hold': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  'Not Required': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
};

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Blocked', 'On Hold', 'Not Required'];

export const STATUS_DOT: Record<string, string> = {
  Pending: 'bg-red-500',
  'In Progress': 'bg-orange-500',
  Completed: 'bg-emerald-500',
  Blocked: 'bg-slate-500',
  'On Hold': 'bg-purple-500',
  'Not Required': 'bg-teal-500',
};

export function formatDate(value: string | undefined | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | undefined | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function matchesUser(name: string | undefined | null, user: { fullName: string; username: string }) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return false;
  return n === (user.fullName || '').trim().toLowerCase() || n === (user.username || '').trim().toLowerCase();
}

export function toDateInputValue(sheetValue: string | undefined | null): string {
  if (!sheetValue) return '';
  const s = sheetValue.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, month, day, year] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
