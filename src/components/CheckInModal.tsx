"use client";

import { useFocus } from "@/context/FocusContext";
import { CHECKIN_MOOD } from "@/lib/constants";

/** Modal shown when a reminder fires */
export function CheckInModal() {
  const { checkIn, goals, submitCheckIn, closeCheckIn } = useFocus();

  if (!checkIn.open || checkIn.goalId === null) return null;

  const goal = goals.find((g) => g.id === checkIn.goalId);
  const title = goal?.title ?? "your goal";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      onClick={closeCheckIn}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="checkin-title">check-in</h2>
        <p>
          how&apos;s <strong>{title}</strong> going?
        </p>
        <div className="modal-actions checkin-btns">
          <button
            type="button"
            className="checkin-btn"
            onClick={() => submitCheckIn(CHECKIN_MOOD.track)}
          >
            <span>↑</span>
            <span>on track</span>
          </button>
          <button
            type="button"
            className="checkin-btn"
            onClick={() => submitCheckIn(CHECKIN_MOOD.struggle)}
          >
            <span>↓</span>
            <span>struggling</span>
          </button>
          <button
            type="button"
            className="checkin-btn"
            onClick={() => submitCheckIn(CHECKIN_MOOD.done)}
          >
            <span>✓</span>
            <span>wrapped it up</span>
          </button>
        </div>
        <button type="button" className="modal-dismiss" onClick={closeCheckIn}>
          dismiss
        </button>
      </div>
    </div>
  );
}
