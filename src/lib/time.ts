import { GOAL_STATUS } from "./constants";
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
  return `${formatTime12h(start)} → ${formatTime12h(end)}`;
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

  const end = parseTimeToday(goal.timeEnd, now);
  if (end !== null && end > now) {
    const start = parseTimeToday(goal.timeStart, now);
    const from = start !== null && start > now ? start : now;
    return Math.max(0, Math.round((end.getTime() - from.getTime()) / 60_000));
  }

  if (goal.timeEnd.length === 0) {
    return UNTIMED_GOAL_MINUTES;
  }

  return 0;
}
