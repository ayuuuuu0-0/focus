"use client";

import { FocusProvider, useFocus } from "@/context/FocusContext";
import { Header } from "./Header";
import { GoalBoard } from "./GoalBoard";
import { WeekStreak } from "./WeekStreak";
import { CheckInSidebar } from "./CheckInSidebar";
import { SettingsPanel } from "./SettingsPanel";
import { StatsGrid } from "./StatsGrid";
import { CheckInModal } from "./CheckInModal";
import { SignatureMark } from "./SignatureMark";
import { GoalTimerOverlay } from "./GoalTimerOverlay";
import { useEffect } from "react";

function DashboardInner() {
  const {
    requestNotifications,
    settings,
    hydrated,
    goals,
    timerGoalId,
    closeGoalTimer,
  } = useFocus();

  useEffect(() => {
    if (!hydrated || !settings.notificationsEnabled) return;
    void requestNotifications();
  }, [hydrated, settings.notificationsEnabled, requestNotifications]);

  const timerGoal =
    timerGoalId !== null
      ? goals.find((g) => g.id === timerGoalId) ?? null
      : null;

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <div className="app">
        <Header />
        <div className="grid">
          <section className="main-col">
            <GoalBoard />
            <WeekStreak />
          </section>
          <aside className="sidebar">
            <CheckInSidebar />
            <SettingsPanel />
            <StatsGrid />
          </aside>
        </div>
      </div>
      <CheckInModal />
      {timerGoal !== null && (
        <GoalTimerOverlay
          goal={timerGoal}
          settings={settings}
          onClose={closeGoalTimer}
        />
      )}
      <SignatureMark />
    </>
  );
}

export function Dashboard() {
  return (
    <FocusProvider>
      <DashboardInner />
    </FocusProvider>
  );
}
