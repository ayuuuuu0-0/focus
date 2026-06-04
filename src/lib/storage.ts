import { STORAGE_KEYS } from "./constants";
import type {
  Goal,
  PlannedDaysStore,
  Settings,
  StreakData,
  DaySnapshotStore,
} from "./types";
import {
  DEFAULT_FOCUS_END_HOUR,
  DEFAULT_FOCUS_START_HOUR,
  DEFAULT_REMINDER_INTERVAL_MIN,
} from "./constants";

/** Default settings when none are stored */
export const DEFAULT_SETTINGS: Settings = {
  reminderIntervalMinutes: DEFAULT_REMINDER_INTERVAL_MIN,
  customIntervalMinutes: 45,
  useCustomInterval: false,
  soundEnabled: true,
  notificationsEnabled: true,
  focusStartHour: DEFAULT_FOCUS_START_HOUR,
  focusEndHour: DEFAULT_FOCUS_END_HOUR,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Read JSON from localStorage with fallback */
export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw.length === 0) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Persist JSON to localStorage */
export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadGoals(): Goal[] {
  return readStorage<Goal[]>(STORAGE_KEYS.goals, []);
}

export function saveGoals(goals: Goal[]): void {
  writeStorage(STORAGE_KEYS.goals, goals);
}

export function loadSettings(): Settings {
  return readStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  writeStorage(STORAGE_KEYS.settings, settings);
}

export function loadStreaks(): StreakData {
  return readStorage<StreakData>(STORAGE_KEYS.streaks, { days: {} });
}

export function saveStreaks(streaks: StreakData): void {
  writeStorage(STORAGE_KEYS.streaks, streaks);
}

export function loadLastReminderAt(): number | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.lastReminderAt);
  if (raw === null || raw.length === 0) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function saveLastReminderAt(ts: number): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.lastReminderAt, String(ts));
}

export function loadMainGoalId(): string | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.mainGoalId);
  if (raw === null || raw.length === 0) return null;
  return raw;
}

export function saveMainGoalId(id: string | null): void {
  if (!isBrowser()) return;
  if (id === null) {
    localStorage.removeItem(STORAGE_KEYS.mainGoalId);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.mainGoalId, id);
}

export function loadFocusedGoalId(): string | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.focusedGoalId);
  if (raw === null || raw.length === 0) return null;
  return raw;
}

export function saveFocusedGoalId(id: string | null): void {
  if (!isBrowser()) return;
  if (id === null) {
    localStorage.removeItem(STORAGE_KEYS.focusedGoalId);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.focusedGoalId, id);
}

export function loadDaySnapshots(): DaySnapshotStore {
  return readStorage<DaySnapshotStore>(STORAGE_KEYS.daySnapshots, { days: {} });
}

export function saveDaySnapshots(store: DaySnapshotStore): void {
  writeStorage(STORAGE_KEYS.daySnapshots, store);
}

export function loadPlannedDays(): PlannedDaysStore {
  return readStorage<PlannedDaysStore>(STORAGE_KEYS.plannedDays, { days: {} });
}

export function savePlannedDays(store: PlannedDaysStore): void {
  writeStorage(STORAGE_KEYS.plannedDays, store);
}

export function loadLastBoardDate(): string {
  if (!isBrowser()) return "";
  const raw = localStorage.getItem(STORAGE_KEYS.lastBoardDate);
  return raw ?? "";
}

export function saveLastBoardDate(dateKey: string): void {
  if (!isBrowser()) return;
  if (dateKey.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.lastBoardDate);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.lastBoardDate, dateKey);
}
