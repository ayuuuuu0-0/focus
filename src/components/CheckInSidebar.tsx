"use client";

import { useFocus } from "@/context/FocusContext";
import { CHECKIN_MOOD } from "@/lib/constants";

/** Check-in for the focused (secondary) active task */
export function CheckInSidebar() {
  const { stats, submitCheckIn } = useFocus();
  const focused = stats.focused;
  const main = stats.main;

  if (!focused) {
    return (
      <article className="checkin-card reveal" style={{ "--d": 2 } as React.CSSProperties}>
        <p className="checkin-q">
          No active task — tap <strong>up next</strong> to add a secondary, or set a <strong>main</strong> task.
        </p>
      </article>
    );
  }

  const short =
    focused.title.length > 32 ? `${focused.title.slice(0, 32)}…` : focused.title;
  const isMainFocused = main?.id === focused.id;

  return (
    <article className="checkin-card reveal" style={{ "--d": 2 } as React.CSSProperties}>
      <p className="checkin-q">
        how&apos;s <strong>{short}</strong> going?
        {!isMainFocused && main && (
          <span className="checkin-multi">
            {" "}
            (main: {main.title.length > 18 ? `${main.title.slice(0, 18)}…` : main.title})
          </span>
        )}
      </p>
      <div className="checkin-btns">
        <button
          type="button"
          className="checkin-btn"
          onClick={() => submitCheckIn(CHECKIN_MOOD.track, focused.id)}
        >
          <span>↑</span>
          <span>on track</span>
        </button>
        <button
          type="button"
          className="checkin-btn"
          onClick={() => submitCheckIn(CHECKIN_MOOD.struggle, focused.id)}
        >
          <span>↓</span>
          <span>struggling</span>
        </button>
        <button
          type="button"
          className="checkin-btn"
          onClick={() => submitCheckIn(CHECKIN_MOOD.done, focused.id)}
        >
          <span>✓</span>
          <span>wrapped it up</span>
        </button>
      </div>
    </article>
  );
}
