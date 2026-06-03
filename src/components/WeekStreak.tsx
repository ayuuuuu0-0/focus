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
            <div key={day.date} className={classes} title={`${day.date}: ${day.count} goals`}>
              {day.label}
              <span className="dot" />
              {day.count > 0 && <span className="count">{day.count}</span>}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
