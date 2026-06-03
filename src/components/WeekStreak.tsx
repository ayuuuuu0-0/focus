"use client";

import { useFocus } from "@/context/FocusContext";

/** Weekly strip showing goals completed per day */
export function WeekStreak() {
  const { weekDays } = useFocus();

  return (
    <nav className="week-nav reveal" style={{ "--d": 3 } as React.CSSProperties} aria-label="Week streak">
      <div className="week-days">
        {weekDays.map((day) => {
          const classes = [
            "week-day",
            day.isToday ? "today" : "",
            day.count > 0 ? "has-activity" : "",
            day.isToday && day.count > 0 ? "has-active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={day.date} className={classes} title={`${day.date}: ${day.count} goals completed`}>
              {day.count > 0 && (
                <span className="count" aria-label={`${day.count} goals`}>
                  {day.count}
                </span>
              )}
              <span className="week-day-label">{day.label}</span>
              <span className="dot" />
            </div>
          );
        })}
      </div>
    </nav>
  );
}
