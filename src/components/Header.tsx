"use client";

import { useFocus } from "@/context/FocusContext";

/** Top bar with logo, date, and goals progress pill */
export function Header() {
  const { stats } = useFocus();
  const pct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const dateLabel = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;

  return (
    <header className="header reveal" style={{ "--d": 0 } as React.CSSProperties}>
      <h1 className="logo" aria-label="focus">
        f<span className="logo-o">o<span className="logo-dot">.</span></span>cus
      </h1>
      <div className="header-meta">
        <time className="date-pill">{dateLabel}</time>
        <div className="goals-pill">
          <span className="goals-fill" style={{ width: `${pct}%` }} />
          <span className="goals-text">
            <strong>{stats.done}</strong> / {stats.total} goals done
          </span>
        </div>
        <button className="icon-btn" type="button" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  );
}
