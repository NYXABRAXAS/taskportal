// Categorical palette - validated via dataviz skill's validate_palette.js
// (passes chroma floor, CVD separation, contrast vs both light/dark surfaces).
export const CATEGORICAL = [
  '#3b66f5',
  '#059669',
  '#d97706',
  '#9333ea',
  '#db2777',
  '#0891b2',
  '#e11d48',
  '#65a30d',
];

// Fixed status semantics (traffic-light convention), matches badge colors in the UI.
export const STATUS_CHART_COLORS: Record<string, string> = {
  Pending: '#ef4444',
  'In Progress': '#f97316',
  Completed: '#22c55e',
  Blocked: '#6b7280',
  'On Hold': '#a855f7',
};
