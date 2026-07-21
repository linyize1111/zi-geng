import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaPrompts } from "@/components/layout/PwaPrompts";
import { SideNav } from "@/components/layout/SideNav";
import { SyncStatus } from "@/components/layout/SyncStatus";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3 md:px-6">
          <div>
            <p className="font-[family-name:var(--font-sans)] text-lg tracking-[0.18em] md:hidden">
              字耕
            </p>
            <SyncStatus />
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:max-w-5xl md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <PwaPrompts />
    </div>
  );
}
