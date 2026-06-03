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

export interface CheckInState {
  open: boolean;
  goalId: string | null;
}
