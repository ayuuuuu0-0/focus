import { GOAL_STATUS } from "./constants";
import { addDaysToDateKey } from "./dates";
import {
  isGoalContinuationOnDate,
  isOvernightRange,
  resolveGoalAnchorDate,
} from "./time";
import type { Goal } from "./types";

/** True when a goal is anchored to dateKey (start day) */
export function goalAppearsOnDate(goal: Goal, dateKey: string): boolean {
  return resolveGoalAnchorDate(goal) === dateKey;
}

/** Goals whose anchorDate matches dateKey */
export function getAnchoredGoalsForDate(
  goals: Goal[],
  dateKey: string
): Goal[] {
  return goals.filter((g) => goalAppearsOnDate(g, dateKey));
}

/** Overnight goals from the previous day that continue onto dateKey */
export function getContinuationGoalsForDate(
  allGoals: Goal[],
  dateKey: string
): Goal[] {
  return allGoals.filter((g) => isGoalContinuationOnDate(g, dateKey));
}

/** Merge anchored goals with continuations, deduped by id (anchored wins) */
export function mergeGoalsForDateDisplay(
  anchored: Goal[],
  continuations: Goal[]
): Goal[] {
  const seen = new Set(anchored.map((g) => g.id));
  const merged = [...anchored];
  for (const g of continuations) {
    if (!seen.has(g.id)) {
      merged.push(g);
      seen.add(g.id);
    }
  }
  return merged;
}

/** Flatten all goals from a planned-days store */
export function flattenPlannedGoals(
  plannedDays: { days: Record<string, Goal[]> }
): Goal[] {
  return Object.values(plannedDays.days).flat();
}

/**
 * Incomplete overnight goals from stored whose window extends into dateKey.
 * Used during day rollover to carry active sessions forward.
 */
export function getOvernightCarryOverGoals(
  goals: Goal[],
  dateKey: string
): Goal[] {
  const prevDay = addDaysToDateKey(dateKey, -1);
  if (prevDay === null) return [];

  return goals.filter((g) => {
    if (g.status === GOAL_STATUS.completed) return false;
    if (!isOvernightRange(g.timeStart, g.timeEnd)) return false;
    return resolveGoalAnchorDate(g) === prevDay;
  });
}

/** Merge carry-over goals into a board, deduping by id */
export function mergeGoalsWithCarryOver(
  boardGoals: Goal[],
  carryOver: Goal[]
): Goal[] {
  const seen = new Set(boardGoals.map((g) => g.id));
  const merged = [...boardGoals];
  for (const g of carryOver) {
    if (!seen.has(g.id)) {
      merged.push(g);
      seen.add(g.id);
    }
  }
  return merged;
}

/** True when goal is shown as a continuation (not anchor) on dateKey */
export function isContinuationDisplay(
  goal: Goal,
  dateKey: string
): boolean {
  return (
    isGoalContinuationOnDate(goal, dateKey) &&
    !goalAppearsOnDate(goal, dateKey)
  );
}

/** Active goals visible on a given date's board */
export function getActiveGoalsForDate(
  goals: Goal[],
  dateKey: string
): Goal[] {
  const boardGoals = mergeGoalsForDateDisplay(
    getAnchoredGoalsForDate(goals, dateKey),
    getContinuationGoalsForDate(goals, dateKey)
  );
  return boardGoals.filter((g) => g.status === GOAL_STATUS.active);
}
