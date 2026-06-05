/** Format a local Date as YYYY-MM-DD */
export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as YYYY-MM-DD in local timezone */
export function todayKey(): string {
  return dateKeyFromDate(new Date());
}

/** Tomorrow's date as YYYY-MM-DD in local timezone */
export function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKeyFromDate(d);
}

/** Lexicographic compare for YYYY-MM-DD keys (-1 | 0 | 1) */
export function compareDateKeys(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** True when dateKey is strictly before today */
export function isPastDateKey(dateKey: string, now = new Date()): boolean {
  return compareDateKeys(dateKey, dateKeyFromDate(now)) < 0;
}

/** True when dateKey is strictly after today */
export function isFutureDateKey(dateKey: string, now = new Date()): boolean {
  return compareDateKeys(dateKey, dateKeyFromDate(now)) > 0;
}

/** Parse YYYY-MM-DD into a local Date at midnight */
export function parseDateKey(dateKey: string): Date | null {
  if (dateKey.length === 0) return null;
  const parts = dateKey.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

/** Shift a YYYY-MM-DD key by n calendar days */
export function addDaysToDateKey(dateKey: string, n: number): string | null {
  const base = parseDateKey(dateKey);
  if (base === null) return null;
  base.setDate(base.getDate() + n);
  return dateKeyFromDate(base);
}
