"use client";

import { useEffect, useState } from "react";
import { useFocus } from "@/context/FocusContext";
import { computeMinutesLeftForGoal, formatDuration } from "@/lib/time";

/** 2×2 stats cards — main task drives time left */
export function StatsGrid() {
  const { stats, openGoalTimer } = useFocus();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [stats.main?.timeEnd, stats.main?.timeStart, stats.main?.id]);

  const minutesLeft = computeMinutesLeftForGoal(stats.main, now);
  const leftLabel =
    minutesLeft === 0 ? "0m" : `~${formatDuration(minutesLeft)}`;
  const canOpenTimer =
    stats.main !== undefined && stats.main.timeEnd.length > 0;

  const handleLeftDoubleClick = () => {
    if (!canOpenTimer || stats.mainId === null) return;
    openGoalTimer(stats.mainId);
  };

  return (
    <section className="stats-grid reveal" style={{ "--d": 4 } as React.CSSProperties}>
      <div className="stat-card">
        <span className="stat-value">
          {stats.done}/{stats.total}
        </span>
        <span className="stat-label">done</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">🔥 {stats.streak}</span>
        <span className="stat-label">day streak</span>
      </div>
      <div className="stat-card stat-active">
        <span className="stat-value">
          {stats.main ? `${stats.main.progress}%` : "—"}
        </span>
        <span className="stat-label">main task</span>
      </div>
      <div
        className={`stat-card ${canOpenTimer ? "stat-card-clickable" : ""}`}
        onDoubleClick={handleLeftDoubleClick}
        title={canOpenTimer ? "Double-click to open timer" : undefined}
        role={canOpenTimer ? "button" : undefined}
        tabIndex={canOpenTimer ? 0 : undefined}
        onKeyDown={(e) => {
          if (!canOpenTimer || stats.mainId === null) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openGoalTimer(stats.mainId);
          }
        }}
      >
        <span className="stat-value">{leftLabel}</span>
        <span className="stat-label">left on main</span>
      </div>
    </section>
  );
}
