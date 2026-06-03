import { GOAL_STATUS } from "./constants";
import type { Goal, GoalStatus } from "./types";

/** Create a new goal with defaults */
export function createGoal(
  title: string,
  tag: string,
  timeStart: string,
  timeEnd: string
): Goal {
  return {
    id: crypto.randomUUID(),
    title,
    tag,
    timeStart,
    timeEnd,
    progress: 0,
    status: GOAL_STATUS.upcoming,
    createdAt: new Date().toISOString(),
  };
}

/** Sort: active first, then upcoming by time, completed last */
export function sortGoals(goals: Goal[]): Goal[] {
  const order: Record<GoalStatus, number> = {
    [GOAL_STATUS.active]: 0,
    [GOAL_STATUS.upcoming]: 1,
    [GOAL_STATUS.completed]: 2,
  };
  return [...goals].sort((a, b) => {
    const d = order[a.status] - order[b.status];
    if (d !== 0) return d;
    if (a.timeStart.length > 0 && b.timeStart.length > 0) {
      return a.timeStart.localeCompare(b.timeStart);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/** All goals with active status */
export function getActiveGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === GOAL_STATUS.active);
}

/** Resolve primary (main) active goal id */
export function resolveMainGoalId(
  goals: Goal[],
  mainGoalId: string | null
): string | null {
  const actives = getActiveGoals(goals);
  if (actives.length === 0) return null;
  if (
    mainGoalId !== null &&
    actives.some((g) => g.id === mainGoalId)
  ) {
    return mainGoalId;
  }
  return actives[0].id;
}

/** Resolve secondary (focused) active goal id — defaults to main */
export function resolveFocusedGoalId(
  goals: Goal[],
  focusedGoalId: string | null,
  mainGoalId: string | null
): string | null {
  const actives = getActiveGoals(goals);
  if (actives.length === 0) return null;
  if (
    focusedGoalId !== null &&
    actives.some((g) => g.id === focusedGoalId)
  ) {
    return focusedGoalId;
  }
  return resolveMainGoalId(goals, mainGoalId);
}

export function getGoalById(
  goals: Goal[],
  id: string | null
): Goal | undefined {
  if (id === null) return undefined;
  return goals.find((g) => g.id === id);
}

/** If no active goals, promote the first upcoming */
export function ensureAtLeastOneActive(goals: Goal[]): Goal[] {
  if (getActiveGoals(goals).length > 0) return goals;

  const firstUpcoming = goals.find((g) => g.status === GOAL_STATUS.upcoming);
  if (!firstUpcoming) return goals;

  return goals.map((g) =>
    g.id === firstUpcoming.id ? { ...g, status: GOAL_STATUS.active } : g
  );
}

/** Format time range for display */
export function formatTimeRange(start: string, end: string): string {
  if (start.length === 0 && end.length === 0) return "";
  if (end.length === 0) return start;
  if (start.length === 0) return end;
  return `${start} → ${end}`;
}

/** Stats: main (primary active), focused (secondary), all actives */
export function goalStats(
  goals: Goal[],
  mainGoalId: string | null,
  focusedGoalId: string | null
) {
  const total = goals.length;
  const done = goals.filter((g) => g.status === GOAL_STATUS.completed).length;
  const actives = getActiveGoals(goals);
  const mainId = resolveMainGoalId(goals, mainGoalId);
  const focusedId = resolveFocusedGoalId(goals, focusedGoalId, mainId);
  const main = getGoalById(goals, mainId);
  const focused = getGoalById(goals, focusedId);
  return { total, done, actives, main, focused, mainId, focusedId };
}
