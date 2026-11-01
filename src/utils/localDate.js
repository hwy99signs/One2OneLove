export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  const raw = String(value).trim();
  // Postgres DATE columns arrive as "YYYY-MM-DD" or as UTC-midnight ISO
  // ("YYYY-MM-DDT00:00:00.000Z"). Both are calendar days: build them in local
  // time so US members never see the previous day or an invalid date.
  const dayOnly = /^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?Z)?$/.exec(raw);
  const parsed = dayOnly
    ? new Date(`${dayOnly[1]}T00:00:00`)
    : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLocalDateInput(value = new Date()) {
  const date = parseLocalDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarDayDifference(value, reference = new Date()) {
  const date = parseLocalDate(value);
  const today = parseLocalDate(reference);
  if (!date || !today) return null;
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}
