import { createContext } from "react";
import type { ThemePreference } from "@/features/settings/theme";

export type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (theme: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
