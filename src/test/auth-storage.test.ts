import { afterEach, describe, expect, it } from "vitest";
import { assertSafeLogoutCleanup, clearZiGengAuthStorage } from "@/lib/supabase/clear-auth-storage";
import { AUTH_STORAGE_KEY } from "@/lib/auth-keys";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("clearZiGengAuthStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("removes zi-geng keys including code-verifier", () => {
    const storage = memoryStorage({
      [AUTH_STORAGE_KEY]: "session",
      [`${AUTH_STORAGE_KEY}-code-verifier`]: "pkce",
      "lyz-main-auth": "keep-main",
      "acg-portal-auth": "keep-acg",
      unrelated: "keep",
    });

    const removed = clearZiGengAuthStorage(storage);
    assertSafeLogoutCleanup(removed);

    expect(storage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(`${AUTH_STORAGE_KEY}-code-verifier`)).toBeNull();
    expect(storage.getItem("lyz-main-auth")).toBe("keep-main");
    expect(storage.getItem("acg-portal-auth")).toBe("keep-acg");
    expect(storage.getItem("unrelated")).toBe("keep");
  });

  it("client factory uses zi-geng-auth storage key constant", async () => {
    expect(AUTH_STORAGE_KEY).toBe("zi-geng-auth");
  });
});
