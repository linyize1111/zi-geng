export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "zi-geng-theme";

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return "system";
}

export function writeThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeClass(resolved: "light" | "dark"): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
}
