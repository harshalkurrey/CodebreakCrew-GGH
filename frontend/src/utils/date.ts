/**
 * Canonical Date Helpers (Strictly YYYY-MM-DD without timezone shifting)
 */

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCanonicalDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
}

export function calculateRentalDays(startDateStr: string, endDateStr: string): number {
  const start = parseCanonicalDate(startDateStr);
  const end = parseCanonicalDate(endDateStr);
  if (!start || !end) return 0;

  // UTC-based timestamp calculation avoids daylight saving and local timezone shifts
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  const diffMs = endUtc - startUtc;
  if (diffMs < 0) return 0;
  // Rental days is inclusive or difference in days. Usually min 1 day.
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

export function formatDisplayDate(dateStr: string): string {
  const parsed = parseCanonicalDate(dateStr);
  if (!parsed) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}
