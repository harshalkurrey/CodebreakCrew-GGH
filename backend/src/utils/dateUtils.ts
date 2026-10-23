/**
 * Date calculation and comparison utilities for CampusCycle
 * Ensures all dates are handled as canonical 'YYYY-MM-DD' strings to prevent timezone shifts.
 */

export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDurationDays(startDate: string, endDate: string): number {
  if (startDate > endDate) {
    throw new Error('End date must be on or after start date.');
  }

  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);

  const startUtc = Date.UTC(y1, m1 - 1, d1);
  const endUtc = Date.UTC(y2, m2 - 1, d2);

  const diffMs = endUtc - startUtc;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Inclusive duration: Oct 25 to Oct 27 = 3 days; Oct 25 to Oct 25 = 1 day
  return diffDays + 1;
}

export function doIntervalsOverlap(
  s1: string,
  e1: string,
  s2: string,
  e2: string
): boolean {
  // Intervals [S1, E1] and [S2, E2] overlap iff S1 <= E2 AND S2 <= E1
  return s1 <= e2 && s2 <= e1;
}
