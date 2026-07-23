const STORAGE_KEY = "zi-geng-reminder-time";

/** Mock / offline: persist reminder HH:MM in localStorage. */
export function readLocalReminderTime(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  } catch {
    /* ignore */
  }
  return "09:00";
}

export function writeLocalReminderTime(time: string): void {
  const normalized = time.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(normalized)) return;
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}
