"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CHECKIN_MOOD, GOAL_STATUS, REMINDER_TICK_MS } from "@/lib/constants";
import { playChime } from "@/lib/audio";
import {
  createGoal,
  ensureAtLeastOneActive,
  getActiveGoals,
  getGoalById,
  goalStats,
  resolveFocusedGoalId,
  resolveMainGoalId,
  sortGoals,
} from "@/lib/goals";
import {
  isReminderDue,
  requestNotificationPermission,
  showGoalNotification,
} from "@/lib/reminders";
import { isFutureDateKey, isPastDateKey, todayKey, tomorrowKey } from "@/lib/dates";
import {
  applyPlannedBoardForDate,
  getPlannedGoals,
  plannedGoalCount,
  setPlannedGoalsForDate,
} from "@/lib/plannedDays";
import {
  loadDaySnapshots,
  loadFocusedGoalId,
  loadGoals,
  loadLastBoardDate,
  loadLastReminderAt,
  loadMainGoalId,
  loadPlannedDays,
  loadSettings,
  loadStreaks,
  saveDaySnapshots,
  saveFocusedGoalId,
  saveGoals,
  saveLastBoardDate,
  saveLastReminderAt,
  saveMainGoalId,
  savePlannedDays,
  saveSettings,
  saveStreaks,
} from "@/lib/storage";
import {
  createDaySnapshot,
  getDaySnapshot,
  upsertDaySnapshot,
} from "@/lib/snapshots";
import {
  computeCurrentStreak,
  recordGoalCompletion,
  undoGoalCompletion,
  weekStrip,
} from "@/lib/streaks";
import type {
  CheckInState,
  CheckinMood,
  DaySnapshotStore,
  Goal,
  PlannedDaysStore,
  Settings,
  StreakData,
} from "@/lib/types";

interface FocusContextValue {
  goals: Goal[];
  /** Goals shown in the board — live today or snapshot for selected day */
  displayGoals: Goal[];
  displayMainGoalId: string | null;
  displayFocusedGoalId: string | null;
  selectedDate: string;
  /** Viewing a past day (snapshot only) */
  isReadOnlyView: boolean;
  /** Viewing a future day — editable planned tasks */
  isPlanView: boolean;
  hasSnapshotForSelected: boolean;
  tomorrowDate: string;
  tomorrowPlanCount: number;
  openPlanTomorrow: () => void;
  backToToday: () => void;
  settings: Settings;
  streaks: StreakData;
  checkIn: CheckInState;
  mainGoalId: string | null;
  focusedGoalId: string | null;
  hydrated: boolean;
  stats: ReturnType<typeof goalStats> & { streak: number };
  weekDays: ReturnType<typeof weekStrip>;
  setSelectedDate: (dateKey: string) => void;
  addGoal: (title: string, tag: string, timeStart: string, timeEnd: string) => void;
  setGoalProgress: (id: string, progress: number) => void;
  completeGoal: (id: string) => void;
  restoreGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  updateGoalTime: (id: string, timeStart: string, timeEnd: string) => void;
  /** Add/remove from active pool (secondary); does not change main */
  toggleActiveGoal: (id: string) => void;
  /** Promote an active task to primary main */
  setMainGoal: (id: string) => void;
  /** Switch which active task you're focused on (secondary) */
  setFocusedGoal: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  submitCheckIn: (mood: CheckinMood, goalId?: string) => void;
  closeCheckIn: () => void;
  openCheckIn: () => void;
  requestNotifications: () => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | null>(null);

const SEED_GOALS: Goal[] = [
  {
    id: "seed-1",
    title: "review PR feedback on auth module",
    tag: "deep work",
    timeStart: "",
    timeEnd: "",
    progress: 100,
    status: GOAL_STATUS.completed,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "system design notes — chapter 4",
    tag: "learning",
    timeStart: "10:00",
    timeEnd: "12:30",
    progress: 62,
    status: GOAL_STATUS.active,
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    title: "standup prep + blockers doc",
    tag: "meeting",
    timeStart: "14:00",
    timeEnd: "16:00",
    progress: 0,
    status: GOAL_STATUS.upcoming,
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-4",
    title: "pair on caching layer spike",
    tag: "deep work",
    timeStart: "16:30",
    timeEnd: "18:00",
    progress: 0,
    status: GOAL_STATUS.upcoming,
    createdAt: new Date().toISOString(),
  },
];

export function FocusProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [streaks, setStreaks] = useState<StreakData>({ days: {} });
  const [checkIn, setCheckIn] = useState<CheckInState>({ open: false, goalId: null });
  const [mainGoalId, setMainGoalId] = useState<string | null>(null);
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const [daySnapshots, setDaySnapshots] = useState<DaySnapshotStore>({ days: {} });
  const [plannedDays, setPlannedDays] = useState<PlannedDaysStore>({ days: {} });
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [hydrated, setHydrated] = useState(false);

  const isPlanView = isFutureDateKey(selectedDate);
  const isReadOnlyView = isPastDateKey(selectedDate);
  const tomorrowDate = tomorrowKey();

  const updatePlannedGoals = useCallback(
    (dateKey: string, updater: (current: Goal[]) => Goal[]) => {
      setPlannedDays((prev) => {
        const nextGoals = sortGoals(updater(getPlannedGoals(prev, dateKey)));
        return setPlannedGoalsForDate(prev, dateKey, nextGoals);
      });
    },
    []
  );

  const syncMainAndFocused = useCallback(
    (
      nextGoals: Goal[],
      preferredMain?: string | null,
      preferredFocused?: string | null
    ) => {
      const main = resolveMainGoalId(
        nextGoals,
        preferredMain ?? mainGoalId
      );
      const focused = resolveFocusedGoalId(
        nextGoals,
        preferredFocused ?? focusedGoalId,
        main
      );
      setMainGoalId(main);
      setFocusedGoalId(focused);
      saveMainGoalId(main);
      saveFocusedGoalId(focused);
    },
    [mainGoalId, focusedGoalId]
  );

  useEffect(() => {
    const today = todayKey();
    let snapshots = loadDaySnapshots();
    let planned = loadPlannedDays();
    let stored = loadGoals();
    const lastBoardDate = loadLastBoardDate();

    if (lastBoardDate.length > 0 && lastBoardDate !== today) {
      if (stored.length > 0) {
        snapshots = upsertDaySnapshot(
          snapshots,
          lastBoardDate,
          createDaySnapshot(
            stored,
            loadMainGoalId(),
            loadFocusedGoalId()
          )
        );
      }

      const applied = applyPlannedBoardForDate(planned, today);
      planned = applied.store;
      if (applied.goals !== null) {
        stored = applied.goals;
      }
    }

    const initial =
      stored.length > 0 ? ensureAtLeastOneActive(stored) : SEED_GOALS;

    setGoals(initial);
    setSettings(loadSettings());
    setStreaks(loadStreaks());
    setDaySnapshots(snapshots);
    setPlannedDays(planned);
    setSelectedDate(today);
    saveLastBoardDate(today);

    const main = resolveMainGoalId(initial, loadMainGoalId());
    const focused = resolveFocusedGoalId(initial, loadFocusedGoalId(), main);
    setMainGoalId(main);
    setFocusedGoalId(focused);
    saveMainGoalId(main);
    saveFocusedGoalId(focused);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveGoals(goals);
  }, [goals, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveStreaks(streaks);
  }, [streaks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveMainGoalId(mainGoalId);
  }, [mainGoalId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveFocusedGoalId(focusedGoalId);
  }, [focusedGoalId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const key = todayKey();
    setDaySnapshots((prev) =>
      upsertDaySnapshot(
        prev,
        key,
        createDaySnapshot(goals, mainGoalId, focusedGoalId)
      )
    );
  }, [goals, mainGoalId, focusedGoalId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveDaySnapshots(daySnapshots);
  }, [daySnapshots, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    savePlannedDays(plannedDays);
  }, [plannedDays, hydrated]);

  const triggerCheckIn = useCallback(
    (goalId: string | null) => {
      const focusedId =
        goalId ??
        resolveFocusedGoalId(goals, focusedGoalId, mainGoalId);
      if (focusedId === null) return;
      setCheckIn({ open: true, goalId: focusedId });
    },
    [goals, focusedGoalId, mainGoalId]
  );

  const fireReminder = useCallback(() => {
    const focused = getGoalById(
      goals,
      resolveFocusedGoalId(goals, focusedGoalId, mainGoalId)
    );
    const title = focused?.title ?? "your focus task";

    if (settings.notificationsEnabled) {
      showGoalNotification(title, "how's it going?");
    }
    if (settings.soundEnabled) {
      void playChime();
    }

    saveLastReminderAt(Date.now());
    triggerCheckIn(focused?.id ?? null);
  }, [goals, focusedGoalId, mainGoalId, settings, triggerCheckIn]);

  useEffect(() => {
    if (!hydrated) return;

    const tick = () => {
      if (!isReminderDue(loadLastReminderAt(), settings)) return;
      fireReminder();
    };

    tick();
    const id = setInterval(tick, REMINDER_TICK_MS);
    return () => clearInterval(id);
  }, [hydrated, settings, fireReminder]);

  const addGoal = useCallback(
    (title: string, tag: string, timeStart: string, timeEnd: string) => {
      const g = createGoal(title, tag, timeStart, timeEnd);
      if (isPlanView) {
        updatePlannedGoals(selectedDate, (prev) => [...prev, g]);
        return;
      }

      setGoals((prev) => {
        const hasMain = resolveMainGoalId(prev, mainGoalId) !== null;
        const next = sortGoals([
          ...prev,
          hasMain ? g : { ...g, status: GOAL_STATUS.active },
        ]);
        if (!hasMain) {
          syncMainAndFocused(next, g.id, g.id);
        }
        return next;
      });
    },
    [isPlanView, selectedDate, mainGoalId, syncMainAndFocused, updatePlannedGoals]
  );

  const setGoalProgress = useCallback((id: string, progress: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g
      )
    );
  }, []);

  const completeGoal = useCallback(
    (id: string) => {
      setGoals((prev) => {
        const next = sortGoals(
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  status: GOAL_STATUS.completed,
                  progress: 100,
                  completedAt: new Date().toISOString(),
                }
              : g
          )
        );
        const actives = getActiveGoals(next);
        const nextMain =
          id === mainGoalId ? (actives[0]?.id ?? null) : mainGoalId;
        const nextFocused =
          id === focusedGoalId
            ? (actives[0]?.id ?? nextMain)
            : focusedGoalId;
        syncMainAndFocused(next, nextMain, nextFocused);
        return next;
      });
      setStreaks((s) => recordGoalCompletion(s));
    },
    [mainGoalId, focusedGoalId, syncMainAndFocused]
  );

  const restoreGoal = useCallback(
    (id: string) => {
      setGoals((prev) => {
        const target = prev.find((g) => g.id === id);
        if (!target || target.status !== GOAL_STATUS.completed) return prev;

        const next = sortGoals(
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  status: GOAL_STATUS.active,
                  progress: g.progress >= 100 ? 50 : g.progress,
                  completedAt: undefined,
                }
              : g
          )
        );
        syncMainAndFocused(next, id, id);
        return next;
      });
      setStreaks((s) => undoGoalCompletion(s));
    },
    [syncMainAndFocused]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      if (isPlanView) {
        updatePlannedGoals(selectedDate, (prev) =>
          prev.filter((g) => g.id !== id)
        );
        return;
      }

      setGoals((prev) => {
        const next = ensureAtLeastOneActive(
          sortGoals(prev.filter((g) => g.id !== id))
        );
        const nextMain = id === mainGoalId ? null : mainGoalId;
        const nextFocused = id === focusedGoalId ? null : focusedGoalId;
        syncMainAndFocused(next, nextMain, nextFocused);
        return next;
      });
    },
    [
      isPlanView,
      selectedDate,
      mainGoalId,
      focusedGoalId,
      syncMainAndFocused,
      updatePlannedGoals,
    ]
  );

  const updateGoalTime = useCallback(
    (id: string, timeStart: string, timeEnd: string) => {
      if (isPlanView) {
        updatePlannedGoals(selectedDate, (prev) =>
          prev.map((g) =>
            g.id === id ? { ...g, timeStart, timeEnd } : g
          )
        );
        return;
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, timeStart, timeEnd } : g
        )
      );
    },
    [isPlanView, selectedDate, updatePlannedGoals]
  );

  const toggleActiveGoal = useCallback(
    (id: string) => {
      setGoals((prev) => {
        const target = prev.find((g) => g.id === id);
        if (!target || target.status === GOAL_STATUS.completed) return prev;

        if (target.status === GOAL_STATUS.active) {
          if (id === mainGoalId) {
            const others = getActiveGoals(prev).filter((g) => g.id !== id);
            const next = sortGoals(
              prev.map((g) =>
                g.id === id
                  ? { ...g, status: GOAL_STATUS.upcoming }
                  : g
              )
            );
            syncMainAndFocused(
              next,
              others[0]?.id ?? null,
              others[0]?.id ?? null
            );
            return next;
          }

          const next = sortGoals(
            prev.map((g) =>
              g.id === id ? { ...g, status: GOAL_STATUS.upcoming } : g
            )
          );
          const nextFocused =
            id === focusedGoalId ? mainGoalId : focusedGoalId;
          syncMainAndFocused(next, mainGoalId, nextFocused);
          return next;
        }

        const next = sortGoals(
          prev.map((g) =>
            g.id === id ? { ...g, status: GOAL_STATUS.active } : g
          )
        );
        const main = resolveMainGoalId(next, mainGoalId);
        syncMainAndFocused(
          next,
          main ?? id,
          id
        );
        return next;
      });
    },
    [mainGoalId, focusedGoalId, syncMainAndFocused]
  );

  const setMainGoal = useCallback(
    (id: string) => {
      setGoals((prev) => {
        const target = prev.find((g) => g.id === id);
        if (!target || target.status === GOAL_STATUS.completed) return prev;

        const next = sortGoals(
          prev.map((g) => {
            if (g.id === id) return { ...g, status: GOAL_STATUS.active };
            return g;
          })
        );
        syncMainAndFocused(next, id, focusedGoalId ?? id);
        return next;
      });
    },
    [focusedGoalId, syncMainAndFocused]
  );

  const setFocusedGoal = useCallback(
    (id: string) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal || goal.status !== GOAL_STATUS.active) return;
      setFocusedGoalId(id);
      saveFocusedGoalId(id);
    },
    [goals]
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const submitCheckIn = useCallback(
    (mood: CheckinMood, goalId?: string) => {
      const targetId =
        goalId ??
        checkIn.goalId ??
        resolveFocusedGoalId(goals, focusedGoalId, mainGoalId);
      if (targetId === null) {
        setCheckIn({ open: false, goalId: null });
        return;
      }

      if (mood === CHECKIN_MOOD.done) {
        completeGoal(targetId);
      } else if (mood === CHECKIN_MOOD.track) {
        setGoalProgress(
          targetId,
          Math.min(
            100,
            (goals.find((g) => g.id === targetId)?.progress ?? 0) + 15
          )
        );
      } else if (mood === CHECKIN_MOOD.struggle) {
        setGoalProgress(
          targetId,
          Math.max(0, (goals.find((g) => g.id === targetId)?.progress ?? 0) - 5)
        );
      }

      setCheckIn({ open: false, goalId: null });
    },
    [checkIn.goalId, completeGoal, setGoalProgress, goals, focusedGoalId, mainGoalId]
  );

  const closeCheckIn = useCallback(() => {
    setCheckIn({ open: false, goalId: null });
  }, []);

  const openCheckIn = useCallback(() => {
    triggerCheckIn(null);
  }, [triggerCheckIn]);

  const requestNotifications = useCallback(async () => {
    await requestNotificationPermission();
  }, []);

  const stats = useMemo(() => {
    const base = goalStats(goals, mainGoalId, focusedGoalId);
    return { ...base, streak: computeCurrentStreak(streaks.days) };
  }, [goals, streaks, mainGoalId, focusedGoalId]);

  const weekDays = useMemo(() => weekStrip(streaks.days), [streaks]);

  const selectedSnapshot = useMemo(
    () => getDaySnapshot(daySnapshots, selectedDate),
    [daySnapshots, selectedDate]
  );
  const hasSnapshotForSelected = selectedSnapshot !== null;

  const tomorrowPlanCount = useMemo(
    () => plannedGoalCount(plannedDays, tomorrowDate),
    [plannedDays, tomorrowDate]
  );

  const openPlanTomorrow = useCallback(() => {
    setSelectedDate(tomorrowKey());
  }, []);

  const backToToday = useCallback(() => {
    setSelectedDate(todayKey());
  }, []);

  const displayGoals = useMemo(() => {
    if (isPlanView) {
      return sortGoals(getPlannedGoals(plannedDays, selectedDate));
    }
    if (isReadOnlyView) {
      if (!selectedSnapshot) return [];
      return sortGoals(selectedSnapshot.goals);
    }
    return sortGoals(goals);
  }, [isPlanView, isReadOnlyView, goals, plannedDays, selectedDate, selectedSnapshot]);

  const displayMainGoalId =
    isReadOnlyView || isPlanView
      ? null
      : mainGoalId;

  const displayFocusedGoalId =
    isReadOnlyView || isPlanView
      ? null
      : focusedGoalId;

  const value: FocusContextValue = {
    goals: sortGoals(goals),
    displayGoals,
    displayMainGoalId,
    displayFocusedGoalId,
    selectedDate,
    isReadOnlyView,
    isPlanView,
    hasSnapshotForSelected,
    tomorrowDate,
    tomorrowPlanCount,
    openPlanTomorrow,
    backToToday,
    settings,
    streaks,
    checkIn,
    mainGoalId,
    focusedGoalId,
    hydrated,
    stats,
    weekDays,
    setSelectedDate,
    addGoal,
    setGoalProgress,
    completeGoal,
    restoreGoal,
    deleteGoal,
    updateGoalTime,
    toggleActiveGoal,
    setMainGoal,
    setFocusedGoal,
    updateSettings,
    submitCheckIn,
    closeCheckIn,
    openCheckIn,
    requestNotifications,
  };

  return (
    <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
  );
}

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within FocusProvider");
  return ctx;
}
