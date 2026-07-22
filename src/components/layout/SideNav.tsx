import { NavLink } from "react-router-dom";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";
import { cn } from "@/lib/utils";

const primary = [
  { to: routes.today, label: "今日" },
  { to: routes.learnVocabulary, label: "詞彙" },
  { to: routes.learnQuotes, label: "名言" },
  { to: routes.learnCraft, label: "寫作技巧" },
  { to: routes.write, label: "寫作" },
  { to: routes.novels, label: "小說" },
  { to: routes.favorites, label: "收藏" },
  { to: routes.settings, label: "設定" },
  { to: routes.ownerContent, label: "內容管理" },
] as const;

export function SideNav() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper-2)] md:block">
      <div className="sticky top-0 flex h-dvh flex-col p-4">
        <p className="font-[family-name:var(--font-sans)] text-2xl tracking-[0.2em]">字耕</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">安靜耕耘文字</p>
        <nav aria-label="側欄導覽" className="mt-8 flex flex-1 flex-col gap-1">
          {primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)]",
                  isActive && "bg-[var(--color-accent-soft)] text-[var(--color-ink)]",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <a
          href={env.mainSiteUrl}
          className="mt-4 text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
        >
          公開網站
        </a>
      </div>
    </aside>
  );
}
