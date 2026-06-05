"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playChime } from "@/lib/audio";
import { TIMER_TICK_MS } from "@/lib/constants";
import {
  completeTimerSession,
  createTimerSession,
  getTimerProgress,
  getTimerRemainingMs,
  toggleTimerPause,
  type GoalTimerSession,
} from "@/lib/goalTimer";
import { showGoalNotification } from "@/lib/reminders";
import {
  formatClockTime,
  formatCountdown,
  formatDuration,
  parseGoalWindow,
} from "@/lib/time";
import type { Goal, Settings } from "@/lib/types";

interface GoalTimerOverlayProps {
  goal: Goal;
  settings: Settings;
  onClose: () => void;
}

const ARC_RADIUS = 120;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

/** Full-screen countdown toward a goal's deadline */
export function GoalTimerOverlay({
  goal,
  settings,
  onClose,
}: GoalTimerOverlayProps) {
  const [session, setSession] = useState<GoalTimerSession | null>(() =>
    createTimerSession(goal)
  );
  const [now, setNow] = useState(() => Date.now());
  const completionFired = useRef(false);

  const remainingMs = session ? getTimerRemainingMs(session, now) : 0;
  const progress = session ? getTimerProgress(session, now) : 0;
  const isComplete =
    session?.completed === true ||
    (session !== null && remainingMs <= 0 && !session.paused);

  const handleComplete = useCallback(() => {
    if (completionFired.current) return;
    completionFired.current = true;

    void playChime();
    if (settings.notificationsEnabled) {
      showGoalNotification(goal.title, "time's up");
    }
    setSession((prev) => (prev ? completeTimerSession(prev) : prev));
  }, [goal.title, settings.notificationsEnabled]);

  useEffect(() => {
    if (!session || session.paused || session.completed) return;

    const id = setInterval(() => {
      setNow(Date.now());
    }, TIMER_TICK_MS);

    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session || session.completed || session.paused) return;
    if (remainingMs <= 0) {
      handleComplete();
    }
  }, [remainingMs, session, handleComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!session) {
    return (
      <div className="timer-overlay" role="dialog" aria-modal="true">
        <div className="timer-grain" aria-hidden="true" />
        <div className="timer-inner">
          <button type="button" className="timer-back" onClick={onClose}>
            <span aria-hidden="true">←</span> {goal.title}
          </button>
          <p className="timer-unavailable">Set an end time on this goal to use the timer.</p>
        </div>
      </div>
    );
  }

  const arcOffset = ARC_CIRCUMFERENCE * progress;
  const openedAt = new Date(session.openedAt);
  const remainingMin = Math.max(0, Math.ceil(remainingMs / 60_000));
  const goalWindow = parseGoalWindow(goal);
  const endsLabel =
    goalWindow !== null ? formatClockTime(goalWindow.end) : "—";

  return (
    <div
      className={`timer-overlay ${isComplete ? "timer-overlay-complete" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Timer for ${goal.title}`}
    >
      <div className="timer-grain" aria-hidden="true" />

      <div className="timer-inner">
        <button type="button" className="timer-back" onClick={onClose}>
          <span aria-hidden="true">←</span> {goal.title}
        </button>

        <div className="timer-center">
          <div className="timer-arc-wrap">
            <svg className="timer-arc" viewBox="0 0 280 280" aria-hidden="true">
              <circle
                className="timer-arc-track"
                cx="140"
                cy="140"
                r={ARC_RADIUS}
                fill="none"
              />
              <circle
                className="timer-arc-progress"
                cx="140"
                cy="140"
                r={ARC_RADIUS}
                fill="none"
                strokeDasharray={ARC_CIRCUMFERENCE}
                strokeDashoffset={arcOffset}
                strokeLinecap="round"
                transform="rotate(-90 140 140)"
              />
            </svg>
            <div
              className={`timer-display ${isComplete ? "timer-display-complete" : ""}`}
              aria-live="polite"
            >
              {isComplete ? "0:00" : formatCountdown(remainingMs)}
            </div>
          </div>

          <div className="timer-controls">
            <button
              type="button"
              className="timer-control-btn"
              onClick={() => {
                if (isComplete) return;
                setSession((prev) => (prev ? toggleTimerPause(prev) : prev));
                setNow(Date.now());
              }}
              disabled={isComplete}
              aria-label={session.paused ? "Resume timer" : "Pause timer"}
              title={session.paused ? "Resume" : "Pause"}
            >
              {session.paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="timer-control-btn"
              onClick={() => {
                completionFired.current = false;
                const fresh = createTimerSession(goal);
                setSession(fresh);
                setNow(Date.now());
              }}
              aria-label="Reset timer"
              title="Reset"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 1 3 6.7" />
                <path d="M3 3v6h6" />
              </svg>
            </button>

            <button
              type="button"
              className="timer-control-btn"
              onClick={onClose}
              aria-label="Stop timer"
              title="Stop"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        <p className="timer-status">
          started {formatClockTime(openedAt)} · goal ends {endsLabel} ·{" "}
          {isComplete ? "complete" : `${formatDuration(remainingMin)} remaining`}
        </p>
      </div>
    </div>
  );
}
