"use client";

import { useFocus } from "@/context/FocusContext";
import {
  REMINDER_CUSTOM_VALUE,
  REMINDER_PRESETS,
} from "@/lib/constants";
import { effectiveIntervalMinutes } from "@/lib/reminders";
import { playChime } from "@/lib/audio";
import { saveLastReminderAt } from "@/lib/storage";
import { showGoalNotification } from "@/lib/reminders";

/** Reminder interval, sound, notifications, and focus hours */
export function SettingsPanel() {
  const { settings, updateSettings, requestNotifications, stats, openCheckIn } = useFocus();

  const intervalValue = settings.useCustomInterval
    ? REMINDER_CUSTOM_VALUE
    : settings.reminderIntervalMinutes;

  const handleIntervalChange = (val: string) => {
    const n = Number(val);
    if (n === REMINDER_CUSTOM_VALUE) {
      updateSettings({ useCustomInterval: true });
    } else {
      updateSettings({
        useCustomInterval: false,
        reminderIntervalMinutes: n,
      });
    }
  };

  const testReminder = () => {
    if (settings.notificationsEnabled) {
      void requestNotifications();
      showGoalNotification(
        stats.focused?.title ?? "focus goal",
        "test ping — how's it going?"
      );
    }
    if (settings.soundEnabled) void playChime();
    saveLastReminderAt(Date.now());
    openCheckIn();
  };

  return (
    <section className="reminders reveal" style={{ "--d": 3 } as React.CSSProperties}>
      <h2 className="section-label">reminders</h2>

      <div className="reminder-row">
        <label htmlFor="pingInterval">ping every</label>
        <select
          id="pingInterval"
          className="select-dark"
          value={intervalValue}
          onChange={(e) => handleIntervalChange(e.target.value)}
        >
          {REMINDER_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value={REMINDER_CUSTOM_VALUE}>custom</option>
        </select>
      </div>

      {settings.useCustomInterval && (
        <div className="reminder-row">
          <label htmlFor="customMin">custom (min)</label>
          <input
            id="customMin"
            className="input-sm"
            type="number"
            min={5}
            max={480}
            value={settings.customIntervalMinutes}
            onChange={(e) =>
              updateSettings({
                customIntervalMinutes: Math.max(5, Number(e.target.value)),
              })
            }
          />
        </div>
      )}

      <div className="reminder-row">
        <span>effective</span>
        <span style={{ color: "var(--accent-green)", fontSize: "0.72rem" }}>
          {effectiveIntervalMinutes(settings)} min
        </span>
      </div>

      <div className="toggle-row">
        <span>sound</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="toggle-row">
        <span>notifications</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => {
              updateSettings({ notificationsEnabled: e.target.checked });
              if (e.target.checked) void requestNotifications();
            }}
            aria-describedby="notif-hint"
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <p id="notif-hint" className="notif-hint">
        {settings.notificationsEnabled
          ? "You'll get gentle check-in reminders. If your browser asks, tap Allow."
          : "Turn on to get gentle check-in reminders while you work."}
      </p>

      <div className="reminder-row" style={{ marginTop: "0.75rem" }}>
        <span>focus hours</span>
        <div className="focus-hours">
          <input
            className="input-sm"
            type="number"
            min={0}
            max={23}
            value={settings.focusStartHour}
            onChange={(e) =>
              updateSettings({ focusStartHour: Number(e.target.value) })
            }
            aria-label="Focus start hour"
          />
          <span>–</span>
          <input
            className="input-sm"
            type="number"
            min={0}
            max={23}
            value={settings.focusEndHour}
            onChange={(e) =>
              updateSettings({ focusEndHour: Number(e.target.value) })
            }
            aria-label="Focus end hour"
          />
        </div>
      </div>

      <p style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
        No pings outside {settings.focusStartHour}:00–{settings.focusEndHour}:00
      </p>

      <button type="button" className="test-reminder-btn" onClick={testReminder}>
        test reminder + chime
      </button>
    </section>
  );
}
