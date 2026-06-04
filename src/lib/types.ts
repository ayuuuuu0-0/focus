import type { CHECKIN_MOOD, GOAL_STATUS } from "./constants";

export type GoalStatus = (typeof GOAL_STATUS)[keyof typeof GOAL_STATUS];

export type CheckinMood = (typeof CHECKIN_MOOD)[keyof typeof CHECKIN_MOOD];

/** A single focus goal with optional time window and tag */
export interface Goal {
  id: string;
  title: string;
  tag: string;
  timeStart: string;
  timeEnd: string;
  progress: number;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
}

/** User preferences for reminders and focus hours */
export interface Settings {
  reminderIntervalMinutes: number;
  customIntervalMinutes: number;
  useCustomInterval: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  focusStartHour: number;
  focusEndHour: number;
}

/** Per-day completed goal counts for streak tracking */
export interface StreakData {
  /** ISO date (YYYY-MM-DD) → goals completed that day */
  days: Record<string, number>;
}

/** Board state captured for a single calendar day */
export interface DaySnapshot {
  goals: Goal[];
  /** Primary active task id at snapshot time */
  mainGoalId: string | null;
  /** Secondary focused task id at snapshot time */
  focusedGoalId: string | null;
  /** When this snapshot was last written (ISO) */
  savedAt: string;
}

/** Daily board snapshots keyed by YYYY-MM-DD */
export interface DaySnapshotStore {
  days: Record<string, DaySnapshot>;
}

/** Future-day task boards keyed by YYYY-MM-DD (e.g. tomorrow) */
export interface PlannedDaysStore {
  days: Record<string, Goal[]>;
}

export interface CheckInState {
  open: boolean;
  goalId: string | null;
}
