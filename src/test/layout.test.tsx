import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/settings/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { routes } from "@/routes/paths";
import { isForeignAuthKey, isZiGengAuthKey, AUTH_STORAGE_KEY } from "@/lib/auth-keys";
import { applyThemeClass, resolveTheme } from "@/features/settings/theme";

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

function renderShell(initialPath: string = routes.today) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <AuthProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path={routes.today} element={<div>今日內容</div>} />
                <Route path={routes.learn} element={<div>學習內容</div>} />
                <Route path={routes.settings} element={<div>設定內容</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("layout and theme", () => {
  it("renders brand and today content", () => {
    renderShell();
    expect(screen.getAllByText("字耕").length).toBeGreaterThan(0);
    expect(screen.getByText("今日內容")).toBeInTheDocument();
  });

  it("shows mobile navigation labels", () => {
    renderShell();
    const nav = screen.getAllByRole("navigation", { name: "主要導覽" })[0];
    expect(nav).toBeTruthy();
    expect(within(nav!).getByRole("link", { name: /今日/ })).toBeInTheDocument();
  });

  it("can switch theme preference", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "深色" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await user.click(screen.getByRole("button", { name: "淺色" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("auth key isolation helpers", () => {
  it("protects foreign keys and scopes zi-geng keys", () => {
    expect(AUTH_STORAGE_KEY).toBe("zi-geng-auth");
    expect(isZiGengAuthKey("zi-geng-auth")).toBe(true);
    expect(isZiGengAuthKey("zi-geng-auth-code-verifier")).toBe(true);
    expect(isForeignAuthKey("lyz-main-auth")).toBe(true);
    expect(isForeignAuthKey("acg-portal-auth")).toBe(true);
    expect(isForeignAuthKey("zi-geng-auth")).toBe(false);
  });
});

describe("theme helpers", () => {
  it("resolves system theme and applies class", () => {
    expect(["light", "dark"]).toContain(resolveTheme("system"));
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
