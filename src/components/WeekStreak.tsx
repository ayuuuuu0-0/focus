"use client";

import { useFocus } from "@/context/FocusContext";

/** Weekly strip — tap a day to view that day's saved board */
export function WeekStreak() {
  const { weekDays, selectedDate, setSelectedDate } = useFocus();

  return (
    <nav className="week-nav reveal" style={{ "--d": 3 } as React.CSSProperties} aria-label="Week streak">
      <div className="week-days">
        {weekDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const classes = [
            "week-day",
            day.isToday ? "today" : "",
            isSelected ? "selected" : "",
            day.count > 0 ? "has-activity" : "",
            day.isToday && day.count > 0 ? "has-active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={day.date}
              type="button"
              className={classes}
              onClick={() => setSelectedDate(day.date)}
              aria-pressed={isSelected}
              aria-label={`${day.date}: ${day.count} goals completed`}
              title={`${day.date}: ${day.count} goals completed`}
            >
              {day.count > 0 && (
                <span className="count" aria-hidden="true">
                  {day.count}
                </span>
              )}
              <span className="week-day-label">{day.label}</span>
              <span className="dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
