import type { StreakData } from "./types";

/** Today's date as YYYY-MM-DD in local timezone */
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Record one completed goal for today */
export function recordGoalCompletion(streaks: StreakData): StreakData {
  const key = todayKey();
  const prev = streaks.days[key] ?? 0;
  return {
    days: { ...streaks.days, [key]: prev + 1 },
  };
}

/** Undo one completion counted today (floor at 0) */
export function undoGoalCompletion(streaks: StreakData): StreakData {
  const key = todayKey();
  const prev = streaks.days[key] ?? 0;
  if (prev <= 0) return streaks;
  return {
    days: { ...streaks.days, [key]: prev - 1 },
  };
}

/** Consecutive days (ending today) with at least one completed goal */
export function computeCurrentStreak(days: Record<string, number>): number {
  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < 365; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const count = days[key] ?? 0;

    if (count > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Last 7 days (Mon-based week ending today) for the week strip */
export function weekStrip(days: Record<string, number>): { label: string; date: string; count: number; isToday: boolean }[] {
  const result: { label: string; date: string; count: number; isToday: boolean }[] = [];
  const labels = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];
  const today = new Date();
  const todayDow = today.getDay();
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    const dow = d.getDay();
    const labelIdx = dow === 0 ? 6 : dow - 1;
    result.push({
      label: labels[labelIdx],
      date: key,
      count: days[key] ?? 0,
      isToday: key === todayKey(),
    });
  }

  return result;
}
