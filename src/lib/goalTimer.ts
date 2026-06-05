import { computeTimerDurationMs } from "./time";
import type { Goal } from "./types";

/** In-memory goal timer session — not persisted */
export interface GoalTimerSession {
  goalId: string;
  /** When the timer view was opened (epoch ms) */
  openedAt: number;
  /** Remaining ms at session start */
  initialRemainingMs: number;
  paused: boolean;
  /** Epoch ms when the current pause began */
  pauseStartedAt: number | null;
  /** Total ms spent paused before the current pause */
  accumulatedPauseMs: number;
  completed: boolean;
}

/** Create a fresh timer session from a goal's deadline */
export function createTimerSession(
  goal: Goal,
  now = new Date()
): GoalTimerSession | null {
  const remaining = computeTimerDurationMs(goal, now);
  if (remaining === null || remaining <= 0) return null;

  return {
    goalId: goal.id,
    openedAt: now.getTime(),
    initialRemainingMs: remaining,
    paused: false,
    pauseStartedAt: null,
    accumulatedPauseMs: 0,
    completed: false,
  };
}

/** Total pause duration including an in-flight pause */
function totalPauseMs(session: GoalTimerSession, now: number): number {
  let pause = session.accumulatedPauseMs;
  if (session.paused && session.pauseStartedAt !== null) {
    pause += now - session.pauseStartedAt;
  }
  return pause;
}

/** Milliseconds left on the countdown */
export function getTimerRemainingMs(
  session: GoalTimerSession,
  now = Date.now()
): number {
  if (session.completed) return 0;
  const elapsed = now - session.openedAt - totalPauseMs(session, now);
  return Math.max(0, session.initialRemainingMs - elapsed);
}

/** Progress from 0 (full time left) to 1 (deadline reached) */
export function getTimerProgress(
  session: GoalTimerSession,
  now = Date.now()
): number {
  if (session.initialRemainingMs <= 0) return 1;
  const remaining = getTimerRemainingMs(session, now);
  return 1 - remaining / session.initialRemainingMs;
}

/** Toggle pause on or off */
export function toggleTimerPause(
  session: GoalTimerSession,
  now = Date.now()
): GoalTimerSession {
  if (session.completed) return session;

  if (session.paused && session.pauseStartedAt !== null) {
    return {
      ...session,
      paused: false,
      accumulatedPauseMs:
        session.accumulatedPauseMs + (now - session.pauseStartedAt),
      pauseStartedAt: null,
    };
  }

  return { ...session, paused: true, pauseStartedAt: now };
}

/** Mark session complete (time reached zero) */
export function completeTimerSession(
  session: GoalTimerSession
): GoalTimerSession {
  return { ...session, completed: true, paused: true, pauseStartedAt: null };
}
