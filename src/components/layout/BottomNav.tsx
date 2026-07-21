import { BookOpen, Feather, MoreHorizontal, PenLine, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { routes } from "@/routes/paths";
import { cn } from "@/lib/utils";

const items = [
  { to: routes.today, label: "今日", icon: Sparkles },
  { to: routes.learn, label: "學習", icon: BookOpen },
  { to: routes.write, label: "寫作", icon: PenLine },
  { to: routes.novels, label: "小說", icon: Feather },
  { to: routes.settings, label: "更多", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-[var(--color-ink-muted)]",
                  isActive && "text-[var(--color-accent)]",
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
