import { useEffect, useState, type ReactNode } from "react";
import {
  applyThemeClass,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "@/features/settings/theme";
import { ThemeContext } from "@/features/settings/theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(readThemePreference()),
  );

  useEffect(() => {
    const value = resolveTheme(preference);
    setResolved(value);
    applyThemeClass(value);
    writeThemePreference(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const value = resolveTheme("system");
      setResolved(value);
      applyThemeClass(value);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <ThemeContext.Provider
      value={{
        preference,
        resolved,
        setPreference: setPreferenceState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
