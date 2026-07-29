function parseSheetDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;

  // Handles M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD
  let d;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    d = new Date(s);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, day, y] = s.split('/').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(s);
  }
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

// Returns { breached: boolean, days: number } for a given due date + status.
function computeBreach(dateValue, status) {
  const due = parseSheetDate(dateValue);
  if (!due || status === 'Completed') return { breached: false, days: 0 };

  const today = new Date();
  const diff = daysBetween(due, today);
  if (diff > 0) {
    return { breached: true, days: diff };
  }
  return { breached: false, days: 0 };
}

function isDueToday(dateValue) {
  const due = parseSheetDate(dateValue);
  if (!due) return false;
  const today = new Date();
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

module.exports = { parseSheetDate, computeBreach, isDueToday };
