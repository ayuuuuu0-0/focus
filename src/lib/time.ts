import { GOAL_STATUS, OVERNIGHT_RANGE_SUFFIX } from "./constants";
import { addDaysToDateKey, dateKeyFromDate, parseDateKey } from "./dates";
import type { Goal } from "./types";

/** Parse HH:mm as today's local Date */
export function parseTimeToday(hhmm: string, base = new Date()): Date | null {
  if (hhmm.length === 0) return null;
  const parts = hhmm.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Parse HH:mm on a specific calendar date (YYYY-MM-DD) */
export function parseTimeOnDate(hhmm: string, dateKey: string): Date | null {
  const base = parseDateKey(dateKey);
  if (base === null) return null;
  return parseTimeToday(hhmm, base);
}

/** True when both times are set and end falls on the next calendar day */
export function isOvernightRange(timeStart: string, timeEnd: string): boolean {
  if (timeStart.length === 0 || timeEnd.length === 0) return false;
  return timeEnd <= timeStart;
}

/** Resolve the calendar day when timeStart occurs */
export function resolveGoalAnchorDate(
  goal: Goal,
  fallbackDateKey?: string
): string {
  if (goal.anchorDate !== undefined && goal.anchorDate.length > 0) {
    return goal.anchorDate;
  }
  if (goal.createdAt.length > 0) {
    return dateKeyFromDate(new Date(goal.createdAt));
  }
  if (fallbackDateKey !== undefined && fallbackDateKey.length > 0) {
    return fallbackDateKey;
  }
  return dateKeyFromDate(new Date());
}

/** Absolute start/end datetimes for a goal's time window */
export function parseGoalWindow(
  goal: Goal,
  fallbackDateKey?: string
): { start: Date; end: Date } | null {
  if (goal.timeEnd.length === 0) return null;

  const anchorDate = resolveGoalAnchorDate(goal, fallbackDateKey);
  const overnight = isOvernightRange(goal.timeStart, goal.timeEnd);

  const endDateKey = overnight
    ? addDaysToDateKey(anchorDate, 1)
    : anchorDate;
  if (endDateKey === null) return null;

  const end = parseTimeOnDate(goal.timeEnd, endDateKey);
  if (end === null) return null;

  if (goal.timeStart.length === 0) {
    const startBase = parseDateKey(anchorDate);
    if (startBase === null) return null;
    return { start: startBase, end };
  }

  const start = parseTimeOnDate(goal.timeStart, anchorDate);
  if (start === null) return null;

  return { start, end };
}

/** True when now falls within the goal's resolved time window */
export function isGoalInWindow(goal: Goal, now = new Date()): boolean {
  const window = parseGoalWindow(goal);
  if (window === null) return false;
  return now >= window.start && now < window.end;
}

/** True when goal is an overnight continuation shown on dateKey (anchor was previous day) */
export function isGoalContinuationOnDate(goal: Goal, dateKey: string): boolean {
  if (goal.status === GOAL_STATUS.completed) return false;
  if (!isOvernightRange(goal.timeStart, goal.timeEnd)) return false;

  const anchorDate = resolveGoalAnchorDate(goal);
  const nextDay = addDaysToDateKey(anchorDate, 1);
  if (nextDay === null) return false;

  return nextDay === dateKey;
}

/** Sort key: resolved start timestamp, or end of day if untimed */
export function goalSortTimestamp(goal: Goal, fallbackDateKey?: string): number {
  const window = parseGoalWindow(goal, fallbackDateKey);
  if (window !== null) return window.start.getTime();
  const anchor = parseDateKey(resolveGoalAnchorDate(goal, fallbackDateKey));
  return anchor?.getTime() ?? 0;
}

/** Format HH:mm as 12-hour clock (e.g. 2:30 PM) */
export function formatTime12h(hhmm: string): string {
  if (hhmm.length === 0) return "—";
  const parsed = parseTimeToday(hhmm);
  if (!parsed) return hhmm;
  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Single-line range for the time picker display */
export function formatTimeRangeDisplay(start: string, end: string): string {
  if (start.length === 0 && end.length === 0) return "Set time";
  if (end.length === 0) return formatTime12h(start);
  if (start.length === 0) return formatTime12h(end);

  const range = `${formatTime12h(start)} → ${formatTime12h(end)}`;
  if (isOvernightRange(start, end)) {
    return `${range} ${OVERNIGHT_RANGE_SUFFIX}`;
  }
  return range;
}

/** Human-readable duration from minutes */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const UNTIMED_GOAL_MINUTES = 45;

/**
 * Minutes remaining for the main active task until its end time (or estimate).
 */
export function computeMinutesLeftForGoal(
  goal: Goal | undefined,
  now = new Date()
): number {
  if (!goal || goal.status !== GOAL_STATUS.active) return 0;

  const window = parseGoalWindow(goal);
  if (window !== null) {
    if (now >= window.end) return 0;
    const from = now < window.start ? window.start : now;
    return Math.max(0, Math.round((window.end.getTime() - from.getTime()) / 60_000));
  }

  if (goal.timeEnd.length === 0) {
    return UNTIMED_GOAL_MINUTES;
  }

  return 0;
}

/** Milliseconds remaining until a goal's end time (for the focus timer) */
export function computeTimerDurationMs(
  goal: Goal,
  now = new Date()
): number | null {
  const window = parseGoalWindow(goal);
  if (window === null) return null;
  if (now >= window.end) return null;

  if (now < window.start) {
    return window.end.getTime() - window.start.getTime();
  }

  return window.end.getTime() - now.getTime();
}

/** Format a Date as a short clock label (e.g. 2:30 PM) */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format milliseconds as M:SS or H:MM:SS countdown */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
