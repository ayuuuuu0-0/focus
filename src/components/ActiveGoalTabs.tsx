"use client";

import { useFocus } from "@/context/FocusContext";
import { GOAL_STATUS } from "@/lib/constants";

/** Switch focused task among secondary actives (main shown on its card) */
export function ActiveGoalTabs() {
  const {
    displayGoals,
    displayMainGoalId,
    displayFocusedGoalId,
    isReadOnlyView,
    isPlanView,
    setFocusedGoal,
  } = useFocus();

  if (isPlanView) return null;

  const secondaries = displayGoals.filter(
    (g) => g.status === GOAL_STATUS.active && g.id !== displayMainGoalId
  );

  if (secondaries.length === 0) return null;

  return (
    <nav
      className="active-tabs reveal"
      style={{ "--d": 2 } as React.CSSProperties}
      aria-label="Focused secondary tasks"
    >
      <span className="active-tabs-label">focused on</span>
      <div className="active-tabs-list">
        {secondaries.map((g) => {
          const isFocused = g.id === displayFocusedGoalId;
          const short = g.title.length > 22 ? `${g.title.slice(0, 22)}…` : g.title;
          return (
            <button
              key={g.id}
              type="button"
              className={`active-tab ${isFocused ? "active-tab-focused" : ""}`}
              onClick={() => {
                if (!isReadOnlyView) setFocusedGoal(g.id);
              }}
              disabled={isReadOnlyView}
              aria-pressed={isFocused}
            >
              {short}
              {isFocused && <span className="active-tab-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
