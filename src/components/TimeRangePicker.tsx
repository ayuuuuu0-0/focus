"use client";

import { useEffect, useRef } from "react";
import { formatTimeRangeDisplay } from "@/lib/time";

interface TimeRangePickerProps {
  /** Start time HH:mm */
  timeStart: string;
  /** End time HH:mm */
  timeEnd: string;
  onChange: (timeStart: string, timeEnd: string) => void;
  /** When true, shows inline time inputs */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  /** Large variant for add form */
  size?: "lg" | "md";
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/** Compact time window control — display or edit in one block */
export function TimeRangePicker({
  timeStart,
  timeEnd,
  onChange,
  editing,
  onEditingChange,
  size = "md",
}: TimeRangePickerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const display = formatTimeRangeDisplay(timeStart, timeEnd);

  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onEditingChange(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [editing, onEditingChange]);

  return (
    <div
      ref={wrapRef}
      className={`time-picker time-picker-${size} ${editing ? "time-picker-editing" : ""}`}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {editing ? (
        <div className="time-picker-edit">
          <input
            className="time-picker-input"
            type="time"
            value={timeStart}
            onChange={(e) => onChange(e.target.value, timeEnd)}
            aria-label="Start time"
          />
          <span className="time-picker-sep">→</span>
          <input
            className="time-picker-input"
            type="time"
            value={timeEnd}
            onChange={(e) => onChange(timeStart, e.target.value)}
            aria-label="End time"
          />
          <button
            type="button"
            className="time-picker-done"
            onClick={() => onEditingChange(false)}
          >
            ok
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="time-picker-display"
          onClick={() => onEditingChange(true)}
          title="Click to change time"
        >
          <span className="time-picker-text">{display}</span>
          <ClockIcon />
        </button>
      )}
    </div>
  );
}
