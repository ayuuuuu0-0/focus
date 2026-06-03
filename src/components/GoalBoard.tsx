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
import { todayKey } from "@/lib/streaks";
import { formatTimeRangeDisplay } from "@/lib/time";

/** Goal list and add-goal form */
export function GoalBoard() {
  const {
    displayGoals,
    displayMainGoalId,
    displayFocusedGoalId,
    selectedDate,
    isReadOnlyView,
    hasSnapshotForSelected,
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

  return (
    <section className={isReadOnlyView ? "goal-board-readonly" : undefined}>
      {isReadOnlyView && (
        <div className="day-view-banner reveal" style={{ "--d": 1 } as React.CSSProperties}>
          <span className="day-view-label">
            Viewing <strong>{dateLabel}</strong>
            <span className="day-view-hint">read only</span>
          </span>
          <button
            type="button"
            className="day-view-back"
            onClick={() => setSelectedDate(todayKey())}
          >
            back to today
          </button>
        </div>
      )}

      {!isReadOnlyView && (
        <form
          className="task-input-wrap task-input-wrap-add reveal"
          style={{ "--d": 1 } as React.CSSProperties}
          onSubmit={handleSubmit}
        >
          <input
            className="task-input"
            type="text"
            placeholder="what do you need to do today?"
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

      <ActiveGoalTabs />

      {isReadOnlyView && !hasSnapshotForSelected && (
        <p className="day-view-empty reveal" style={{ "--d": 2 } as React.CSSProperties}>
          Nothing saved for {dateLabel}. Open fo.cus that day to capture your board.
        </p>
      )}

      <ul className={`task-list ${isReadOnlyView ? "task-list-readonly" : ""}`} role="list">
        {displayGoals.map((goal) => {
          const isActive = goal.status === GOAL_STATUS.active;
          const isCompleted = goal.status === GOAL_STATUS.completed;
          const isMain = isActive && goal.id === displayMainGoalId;
          const isFocused = isActive && goal.id === displayFocusedGoalId;
          const isSecondary = isActive && !isMain;

          let pillClass = "pill-upnext";
          let pillLabel = "up next";
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
                if (!isReadOnlyView && isActive) setFocusedGoal(goal.id);
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
                    {isReadOnlyView ? (
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
