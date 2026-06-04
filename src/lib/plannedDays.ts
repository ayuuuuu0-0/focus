import { GOAL_STATUS } from "./constants";
import { ensureAtLeastOneActive, sortGoals } from "./goals";
import type { Goal, PlannedDaysStore } from "./types";

/** Read planned goals for a date, or an empty list */
export function getPlannedGoals(
  store: PlannedDaysStore,
  dateKey: string
): Goal[] {
  return store.days[dateKey] ?? [];
}

/** Count of tasks planned for a date */
export function plannedGoalCount(
  store: PlannedDaysStore,
  dateKey: string
): number {
  return getPlannedGoals(store, dateKey).length;
}

/** Replace planned goals for one date */
export function setPlannedGoalsForDate(
  store: PlannedDaysStore,
  dateKey: string,
  goals: Goal[]
): PlannedDaysStore {
  if (goals.length === 0) {
    const nextDays = { ...store.days };
    delete nextDays[dateKey];
    return { days: nextDays };
  }
  return {
    days: { ...store.days, [dateKey]: goals },
  };
}

/** Promote today's planned board into live goals and clear that plan entry */
export function applyPlannedBoardForDate(
  store: PlannedDaysStore,
  dateKey: string
): { store: PlannedDaysStore; goals: Goal[] | null } {
  const planned = getPlannedGoals(store, dateKey);
  if (planned.length === 0) {
    return { store, goals: null };
  }

  const normalized = planned.map((g) => ({
    ...g,
    status: GOAL_STATUS.upcoming,
    progress: 0,
    completedAt: undefined,
  }));

  return {
    store: setPlannedGoalsForDate(store, dateKey, []),
    goals: ensureAtLeastOneActive(normalized),
  };
}

/** Sort goals for a planned day board */
export function sortPlannedGoals(goals: Goal[]): Goal[] {
  return sortGoals(goals);
}
