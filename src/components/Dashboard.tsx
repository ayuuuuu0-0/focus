"use client";

import { FocusProvider } from "@/context/FocusContext";
import { Header } from "./Header";
import { GoalBoard } from "./GoalBoard";
import { WeekStreak } from "./WeekStreak";
import { CheckInSidebar } from "./CheckInSidebar";
import { SettingsPanel } from "./SettingsPanel";
import { StatsGrid } from "./StatsGrid";
import { CheckInModal } from "./CheckInModal";
import { useEffect } from "react";
import { useFocus } from "@/context/FocusContext";

function DashboardInner() {
  const { requestNotifications, settings, hydrated } = useFocus();

  useEffect(() => {
    if (!hydrated || !settings.notificationsEnabled) return;
    void requestNotifications();
  }, [hydrated, settings.notificationsEnabled, requestNotifications]);

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
