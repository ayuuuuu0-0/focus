"use client";

import { useState, FormEvent } from "react";
import { useFocus } from "@/context/FocusContext";
import { GOAL_STATUS } from "@/lib/constants";
import { SUGGESTED_TAGS } from "@/lib/constants";
import { CompleteIcon } from "@/components/icons/CompleteIcon";
import { ActiveGoalTabs } from "@/components/ActiveGoalTabs";
import { TimeRangePicker } from "@/components/TimeRangePicker";
import { GoalContextMenu, type GoalMenuState } from "@/components/GoalContextMenu";
import { formatSnapshotDateLabel } from "@/lib/snapshots";
import { formatTimeRangeDisplay } from "@/lib/time";

/** Goal list and add-goal form */
export function GoalBoard() {
  const {
    displayGoals,
    displayMainGoalId,
    displayFocusedGoalId,
    selectedDate,
    isReadOnlyView,
    isPlanView,
    hasSnapshotForSelected,
    tomorrowPlanCount,
    openPlanTomorrow,
    backToToday,
    addGoal,
    setGoalProgress,
    completeGoal,
    restoreGoal,
    deleteGoal,
    updateGoalTime,
    toggleActiveGoal,
    setMainGoal,
    setFocusedGoal,
  } = useFocus();

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [addTimeEditing, setAddTimeEditing] = useState(true);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<GoalMenuState | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) return;
    addGoal(title.trim(), tag.trim().length > 0 ? tag.trim() : "focus", timeStart, timeEnd);
    setTitle("");
    setTag("");
    setTimeStart("");
    setTimeEnd("");
  };

  const openContextMenu = (e: React.MouseEvent, goalId: string, isCompleted: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ goalId, x: e.clientX, y: e.clientY, isCompleted });
  };

  const dateLabel = formatSnapshotDateLabel(selectedDate);

  const showAddForm = !isReadOnlyView;
  const boardClass = isReadOnlyView
    ? "goal-board-readonly"
    : isPlanView
      ? "goal-board-plan"
      : undefined;

  return (
    <section className={boardClass}>
      {isReadOnlyView && (
        <div className="day-view-banner reveal" style={{ "--d": 1 } as React.CSSProperties}>
          <span className="day-view-label">
            Viewing <strong>{dateLabel}</strong>
            <span className="day-view-hint">read only</span>
          </span>
          <button type="button" className="day-view-back" onClick={backToToday}>
            back to today
          </button>
        </div>
      )}

      {isPlanView && (
        <div className="day-view-banner day-view-banner-plan reveal" style={{ "--d": 1 } as React.CSSProperties}>
          <span className="day-view-label">
            Planning for <strong>{dateLabel}</strong>
            <span className="day-view-hint">starts at midnight</span>
          </span>
          <button type="button" className="day-view-back" onClick={backToToday}>
            back to today
          </button>
        </div>
      )}

      {!isReadOnlyView && !isPlanView && (
        <div className="plan-tomorrow-row reveal" style={{ "--d": 1 } as React.CSSProperties}>
          <button type="button" className="plan-tomorrow-btn" onClick={openPlanTomorrow}>
            plan tomorrow
            {tomorrowPlanCount > 0 && (
              <span className="plan-tomorrow-count">{tomorrowPlanCount}</span>
            )}
          </button>
        </div>
      )}

      {showAddForm && (
        <form
          className="task-input-wrap task-input-wrap-add reveal"
          style={{ "--d": 1 } as React.CSSProperties}
          onSubmit={handleSubmit}
        >
          <input
            className="task-input"
            type="text"
            placeholder={
              isPlanView
                ? "what do you need to do tomorrow?"
                : "what do you need to do today?"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Goal title"
          />
          <input
            className="input-sm tag-input"
            type="text"
            placeholder="tag"
            list="tag-suggestions"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Goal tag"
          />
          <datalist id="tag-suggestions">
            {SUGGESTED_TAGS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <TimeRangePicker
            size="lg"
            timeStart={timeStart}
            timeEnd={timeEnd}
            editing={addTimeEditing}
            onEditingChange={setAddTimeEditing}
            onChange={(start, end) => {
              setTimeStart(start);
              setTimeEnd(end);
            }}
          />

          <button className="add-btn" type="submit" aria-label="Add goal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        </form>
      )}

      {!isPlanView && <ActiveGoalTabs />}

      {isReadOnlyView && !hasSnapshotForSelected && (
        <p className="day-view-empty reveal" style={{ "--d": 2 } as React.CSSProperties}>
          Nothing saved for {dateLabel}. Open fo.cus that day to capture your board.
        </p>
      )}

      {isPlanView && displayGoals.length === 0 && (
        <p className="day-view-empty reveal" style={{ "--d": 2 } as React.CSSProperties}>
          No tasks planned yet. Add what you want on the board tomorrow.
        </p>
      )}

      <ul
        className={`task-list ${isReadOnlyView || isPlanView ? "task-list-readonly" : ""}`}
        role="list"
      >
        {displayGoals.map((goal) => {
          const isActive = !isPlanView && goal.status === GOAL_STATUS.active;
          const isCompleted = !isPlanView && goal.status === GOAL_STATUS.completed;
          const isMain = isActive && goal.id === displayMainGoalId;
          const isFocused = isActive && goal.id === displayFocusedGoalId;
          const isSecondary = isActive && !isMain;

          let pillClass = "pill-upnext";
          let pillLabel = isPlanView ? "planned" : "up next";
          if (isCompleted) {
            pillClass = "pill-done";
            pillLabel = "done";
          } else if (isMain) {
            pillClass = "pill-main";
            pillLabel = "main";
          } else if (isSecondary) {
            pillClass = "pill-active";
            pillLabel = "active";
          }

          const timeDisplay = formatTimeRangeDisplay(goal.timeStart, goal.timeEnd);

          return (
            <li
              key={goal.id}
              className={`task-item ${goal.status} ${isMain ? "is-main" : ""} ${isFocused ? "focused" : ""}`}
              role="listitem"
              onClick={() => {
                if (!isReadOnlyView && !isPlanView && isActive) setFocusedGoal(goal.id);
              }}
              onContextMenu={(e) => {
                if (!isReadOnlyView) openContextMenu(e, goal.id, isCompleted);
              }}
            >
              <div className="task-main">
                <div className="task-header">
                  <div className="task-title">
                    {goal.title}
                    {goal.tag.length > 0 && (
                      <span className="task-tag">{goal.tag}</span>
                    )}
                  </div>
                  <div className="task-actions">
                    {isReadOnlyView || isPlanView ? (
                      <span className={`pill ${pillClass}`}>{pillLabel}</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`pill ${pillClass}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              restoreGoal(goal.id);
                              return;
                            }
                            if (isMain) {
                              toggleActiveGoal(goal.id);
                              return;
                            }
                            if (isSecondary) {
                              toggleActiveGoal(goal.id);
                              return;
                            }
                            toggleActiveGoal(goal.id);
                          }}
                          title={
                            isCompleted
                              ? "Restore to active"
                              : isMain
                                ? "Pause main task"
                                : isSecondary
                                  ? "Remove from active"
                                  : "Add as secondary active"
                          }
                        >
                          {pillLabel}
                        </button>
                        {!isCompleted && (
                          <button
                            type="button"
                            className="btn-complete"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeGoal(goal.id);
                            }}
                            aria-label={`Complete ${goal.title}`}
                            title="Mark complete"
                          >
                            <CompleteIcon size={20} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="task-progress-section">
                    <div className="task-meta">
                      <span>{goal.progress}% complete</span>
                      {isFocused && !isMain && (
                        <span className="task-badge-focused">focused</span>
                      )}
                    </div>
                    <div className="task-progress-wrap">
                      <div
                        className="task-progress-bar"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    {!isReadOnlyView && (
                      <input
                        type="range"
                        className="progress-slider"
                        min={0}
                        max={100}
                        value={goal.progress}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setGoalProgress(goal.id, Number(e.target.value))
                        }
                        aria-label={`Progress for ${goal.title}`}
                      />
                    )}
                  </div>
                )}

                {!isCompleted && (
                  <div className="task-time-row">
                    {isReadOnlyView ? (
                      timeDisplay.length > 0 && (
                        <span className="task-time-readonly">{timeDisplay}</span>
                      )
                    ) : (
                      <TimeRangePicker
                        size="md"
                        timeStart={goal.timeStart}
                        timeEnd={goal.timeEnd}
                        editing={editingTimeId === goal.id}
                        onEditingChange={(editing) =>
                          setEditingTimeId(editing ? goal.id : null)
                        }
                        onChange={(start, end) =>
                          updateGoalTime(goal.id, start, end)
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!isReadOnlyView && (
        <GoalContextMenu
          menu={menu}
          isPlanView={isPlanView}
          onClose={() => setMenu(null)}
          onChangeTime={(id) => setEditingTimeId(id)}
          onDelete={deleteGoal}
          onRestore={restoreGoal}
          onSetMain={(id) => setMainGoal(id)}
        />
      )}
    </section>
  );
}
