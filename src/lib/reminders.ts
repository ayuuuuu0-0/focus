import type { Settings } from "./types";

/** Effective reminder interval in minutes */
export function effectiveIntervalMinutes(settings: Settings): number {
  if (settings.useCustomInterval) {
    return Math.max(5, settings.customIntervalMinutes);
  }
  return settings.reminderIntervalMinutes;
}

/** True if current local hour is inside the focus window */
export function isWithinFocusHours(settings: Settings, now = new Date()): boolean {
  const hour = now.getHours();
  const { focusStartHour, focusEndHour } = settings;

  if (focusStartHour === focusEndHour) return true;
  if (focusStartHour < focusEndHour) {
    return hour >= focusStartHour && hour < focusEndHour;
  }
  return hour >= focusStartHour || hour < focusEndHour;
}

/** True if enough time has passed since last reminder */
export function isReminderDue(
  lastAt: number | null,
  settings: Settings,
  now = Date.now()
): boolean {
  if (!isWithinFocusHours(settings, new Date(now))) return false;
  const intervalMs = effectiveIntervalMinutes(settings) * 60 * 1000;
  if (lastAt === null) return true;
  return now - lastAt >= intervalMs;
}

/** Request browser notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Fire a system notification for the active goal */
export function showGoalNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const n = new Notification("fo.cus check-in", {
    body: `${title} — ${body}`,
    icon: undefined,
    tag: "focus-checkin",
  });

  n.onclick = () => {
    window.focus();
    n.close();
  };
}
