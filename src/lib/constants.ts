/** localStorage keys */
export const STORAGE_KEYS = {
  goals: "focus_goals",
  settings: "focus_settings",
  streaks: "focus_streaks",
  lastReminderAt: "focus_last_reminder_at",
  /** Primary active task — drives "left today" and main stats */
  mainGoalId: "focus_main_goal_id",
  /** Secondary active task currently in view — check-ins & reminders UI */
  focusedGoalId: "focus_focused_goal_id",
  /** End-of-day board snapshots for history view */
  daySnapshots: "focus_day_snapshots",
  /** Tasks planned for future dates (e.g. tomorrow) */
  plannedDays: "focus_planned_days",
  /** Last calendar day the live board was active — drives day rollover */
  lastBoardDate: "focus_last_board_date",
} as const;

/** Reminder interval presets (minutes) */
export const REMINDER_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
] as const;

export const REMINDER_CUSTOM_VALUE = -1;

/** Default focus window — no pings outside this range */
export const DEFAULT_FOCUS_START_HOUR = 8;
export const DEFAULT_FOCUS_END_HOUR = 22;

export const DEFAULT_REMINDER_INTERVAL_MIN = 60;

/** Check-in mood values */
export const CHECKIN_MOOD = {
  track: "track",
  struggle: "struggle",
  done: "done",
} as const;

/** Goal status values */
export const GOAL_STATUS = {
  active: "active",
  upcoming: "upcoming",
  completed: "completed",
} as const;

/** Suggested tags for quick pick */
export const SUGGESTED_TAGS = ["deep work", "meeting", "learning", "admin", "health"];

/** Reminder tick interval (ms) — how often we check if a ping is due */
export const REMINDER_TICK_MS = 30_000;

/** Week day labels (Mon–Sun) */
export const WEEK_DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"] as const;
