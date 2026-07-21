import { useTheme } from "@/features/settings/useTheme";
import type { ThemePreference } from "@/features/settings/theme";
import { Button } from "@/components/common/Button";

const options: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "淺色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "系統" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="inline-flex rounded-md border border-[var(--color-line)] p-1"
      role="group"
      aria-label="主題"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={preference === option.value ? "default" : "ghost"}
          className="min-h-9 min-w-0 px-3 text-xs"
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
