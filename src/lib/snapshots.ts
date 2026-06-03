import type { DaySnapshot, DaySnapshotStore, Goal } from "./types";

/** Build a snapshot of the current board state */
export function createDaySnapshot(
  goals: Goal[],
  mainGoalId: string | null,
  focusedGoalId: string | null
): DaySnapshot {
  return {
    goals: goals.map((g) => ({ ...g })),
    mainGoalId,
    focusedGoalId,
    savedAt: new Date().toISOString(),
  };
}

/** Merge a snapshot for one date into the store */
export function upsertDaySnapshot(
  store: DaySnapshotStore,
  dateKey: string,
  snapshot: DaySnapshot
): DaySnapshotStore {
  return {
    days: { ...store.days, [dateKey]: snapshot },
  };
}

/** Read snapshot for a date, if any */
export function getDaySnapshot(
  store: DaySnapshotStore,
  dateKey: string
): DaySnapshot | null {
  return store.days[dateKey] ?? null;
}

/** Human-readable label for a YYYY-MM-DD key */
export function formatSnapshotDateLabel(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length !== 3) return dateKey;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateKey;
  }

  const date = new Date(year, month - 1, day);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return `${weekdays[date.getDay()]} · ${months[date.getMonth()]} ${day}`;
}
