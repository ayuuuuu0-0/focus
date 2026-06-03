"use client";

import { useEffect, useRef } from "react";

export interface GoalMenuState {
  goalId: string;
  x: number;
  y: number;
  isCompleted: boolean;
}

interface GoalContextMenuProps {
  menu: GoalMenuState | null;
  onClose: () => void;
  onChangeTime: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onRestore: (goalId: string) => void;
  onSetMain: (goalId: string) => void;
}

/** Right-click menu for goal actions */
export function GoalContextMenu({
  menu,
  onClose,
  onChangeTime,
  onDelete,
  onRestore,
  onSetMain,
}: GoalContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  return (
    <div
      ref={ref}
      className="goal-context-menu"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
    >
      {menu.isCompleted ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onRestore(menu.goalId);
            onClose();
          }}
        >
          Restore to active
        </button>
      ) : (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onChangeTime(menu.goalId);
              onClose();
            }}
          >
            Change time
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSetMain(menu.goalId);
              onClose();
            }}
          >
            Set as main task
          </button>
        </>
      )}
      <button
        type="button"
        role="menuitem"
        className="goal-menu-danger"
        onClick={() => {
          onDelete(menu.goalId);
          onClose();
        }}
      >
        Delete task
      </button>
    </div>
  );
}
